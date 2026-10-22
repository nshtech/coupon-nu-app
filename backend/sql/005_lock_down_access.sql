-- Row-level security for every table the app touches, plus a guard on each
-- coupon redemption. Before this ran, anyone holding the public anon key (it
-- ships inside the app) could, without logging in, read every user's
-- `subscriptions` and `coupon_usages` rows and read (and likely edit) the
-- coupons themselves.
--
-- Run once in the Supabase SQL editor. Safe to re-run, and safe with every app
-- version that is live:
--   * coupons are still readable by signed-in users (the app only loads them
--     after login)
--   * redemptions still work through the same insert, but the trigger below
--     decides whether each one is allowed
--   * the app's own write to `subscriptions` after a purchase is now refused.
--     That write was never what unlocked the app: it unlocks from RevenueCat
--     first, and re-checks RevenueCat on launch whenever no row exists. Rows
--     can still be added from the table editor (e.g. the App Store reviewer).
--
-- Redemption rules (edit the constants in guard_coupon_usage() to change them):
--   * `used_at` is always the database's clock; whatever the client sends is ignored
--   * the coupon must exist and not be past its expiration date (Chicago time)
--   * limited coupons (usage_limit > 0): at most usage_limit uses per user
--   * unlimited coupons (usage_limit = 0): one use per COOLDOWN per user
--   * every coupon: at most DAILY_CAP redemptions per user in any 24 hours
--   * nobody can edit or delete a redemption from the app
--
-- The service role (dashboard, backend, reset_coupons.py) bypasses the RLS
-- policies and grants, but not the guard_coupon_usage() trigger: its inserts
-- into coupon_usages still get used_at = now() and must pass the redemption
-- checks above (only the "your own account" check is skipped). It can still
-- edit and delete redemptions.

begin;

-- ---------------------------------------------------------------------------
-- Start from a known state: drop whatever policies exist today (their names are
-- not recorded anywhere), then create exactly the ones below.
-- ---------------------------------------------------------------------------
do $$
declare
    pol record;
begin
    for pol in
        select policyname, tablename from pg_policies
        where schemaname = 'public'
          and tablename in ('subscriptions', 'coupon_usages', 'coupons_data', 'vendors')
    loop
        execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
    end loop;
end $$;

-- ---------------------------------------------------------------------------
-- subscriptions: each user reads their own row. Writes only from the
-- dashboard / service role.
-- ---------------------------------------------------------------------------
alter table public.subscriptions enable row level security;

revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

create policy "read own subscription"
    on public.subscriptions for select to authenticated
    using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- coupon_usages: each user reads and adds their own rows, nothing else.
-- ---------------------------------------------------------------------------
alter table public.coupon_usages enable row level security;

revoke all on public.coupon_usages from anon, authenticated;
grant select, insert on public.coupon_usages to authenticated;

create policy "read own coupon usages"
    on public.coupon_usages for select to authenticated
    using ((select auth.uid()) = user_id);

create policy "redeem coupons as yourself"
    on public.coupon_usages for insert to authenticated
    with check ((select auth.uid()) = user_id);

create index if not exists coupon_usages_user_coupon_used_at_idx
    on public.coupon_usages (user_id, coupon_id, used_at desc);
create index if not exists coupon_usages_user_used_at_idx
    on public.coupon_usages (user_id, used_at desc);

-- ---------------------------------------------------------------------------
-- coupons_data (the table) and coupons (the view the app reads): readable by
-- signed-in users, written only from the dashboard / service role.
--
-- The view is switched to security_invoker so it obeys the table's RLS instead
-- of running with its owner's rights, which bypass RLS.
-- ---------------------------------------------------------------------------
do $$
begin
    -- security_invoker means the view reads every table it uses with the
    -- caller's rights; refuse rather than silently break the app if the view
    -- reads anything besides coupons_data
    if exists (
        select 1
        from pg_rewrite r
        join pg_depend d on d.objid = r.oid and d.classid = 'pg_rewrite'::regclass
        where r.ev_class = 'public.coupons'::regclass
          and d.refclassid = 'pg_class'::regclass
          and d.refobjid not in ('public.coupons'::regclass, 'public.coupons_data'::regclass)
    ) then
        raise exception 'public.coupons reads tables other than coupons_data; review the view before running this';
    end if;
end $$;

alter table public.coupons_data enable row level security;

revoke all on public.coupons_data from anon, authenticated;
grant select on public.coupons_data to authenticated;

create policy "read coupons"
    on public.coupons_data for select to authenticated
    using (true);

alter view public.coupons set (security_invoker = true);
revoke all on public.coupons from anon, authenticated;
grant select on public.coupons to authenticated;

-- ---------------------------------------------------------------------------
-- vendors: holds contact emails and the app never reads it. No access.
-- ---------------------------------------------------------------------------
alter table public.vendors enable row level security;
revoke all on public.vendors from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Redemption guard. Runs for every insert, from any client.
--
-- SECURITY INVOKER on purpose: it only reads the caller's own usages and the
-- coupons, which RLS already allows, so it needs no extra privileges. Errors
-- carry a stable code in `message` (coupon-detail.tsx maps it to copy) and the
-- minutes left to wait in `detail`.
-- ---------------------------------------------------------------------------
create or replace function public.guard_coupon_usage()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    -- shown in the app as UNLIMITED_COOLDOWN_LABEL (coupon-detail.tsx); change both
    COOLDOWN  constant interval := interval '1 hour';
    DAILY_CAP constant integer  := 10;
    caller    uuid := auth.uid();
    lim       bigint;
    expires   timestamp;
    uses      integer;
    last_use  timestamptz;
    today     integer;
begin
    -- RLS already enforces this for app clients; repeated here so the rule
    -- holds even if a policy is later loosened by mistake
    if caller is not null and new.user_id is distinct from caller then
        raise exception using errcode = '42501', message = 'not_your_account';
    end if;

    new.used_at := now();

    -- one redemption per user at a time, so two quick taps (or parallel
    -- requests) cannot both pass the counts below
    perform pg_advisory_xact_lock(hashtextextended('coupon_usage:' || new.user_id::text, 0));

    select c.usage_limit, c.expiration_date into lim, expires
    from public.coupons_data c
    where c.coupon_id = new.coupon_id;

    if not found then
        raise exception using errcode = 'P0001', message = 'coupon_not_found';
    end if;

    if expires is not null and expires::date < (now() at time zone 'America/Chicago')::date then
        raise exception using errcode = 'P0001', message = 'coupon_expired';
    end if;

    select count(*), max(u.used_at) into uses, last_use
    from public.coupon_usages u
    where u.user_id = new.user_id and u.coupon_id = new.coupon_id;

    if coalesce(lim, 0) > 0 and uses >= lim then
        raise exception using errcode = 'P0001', message = 'usage_limit_reached';
    end if;

    if coalesce(lim, 0) = 0 and last_use > now() - COOLDOWN then
        raise exception using
            errcode = 'P0001',
            message = 'coupon_cooldown',
            detail  = ceil(extract(epoch from (last_use + COOLDOWN - now())) / 60)::text;
    end if;

    select count(*) into today
    from public.coupon_usages u
    where u.user_id = new.user_id and u.used_at > now() - interval '24 hours';

    if today >= DAILY_CAP then
        raise exception using errcode = 'P0001', message = 'daily_limit_reached';
    end if;

    return new;
end;
$$;

revoke all on function public.guard_coupon_usage() from public, anon, authenticated;

drop trigger if exists guard_coupon_usage on public.coupon_usages;
create trigger guard_coupon_usage
    before insert on public.coupon_usages
    for each row execute function public.guard_coupon_usage();

commit;

-- ---------------------------------------------------------------------------
-- Verify after running. Every row should show rls_enabled = true (or a view
-- with security_invoker) and anon_select / anon_insert = false, except
-- app_text, which is public copy:
--
--   select c.relname, c.relkind, c.relrowsecurity as rls_enabled, c.reloptions,
--          has_table_privilege('anon', c.oid, 'select') as anon_select,
--          has_table_privilege('anon', c.oid, 'insert') as anon_insert
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relkind in ('r', 'v', 'p')
--   order by 1;
-- ---------------------------------------------------------------------------
