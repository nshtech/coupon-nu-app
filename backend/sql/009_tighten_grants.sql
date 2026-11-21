-- Narrows table privileges on the two tables 005 did not cover, and makes the
-- saved_coupons policies cheaper. Nothing the app does changes.
--
-- Before this, Supabase's default grants gave anon and authenticated ALL
-- privileges on app_text and saved_coupons (visible in a `supabase db dump`);
-- only row-level security kept writes out. ALL includes TRUNCATE, which RLS
-- does not apply to: either role could empty both tables, every user's rows
-- included. The REST API never issues TRUNCATE, so this was not reachable
-- from the app, but it is one new access path away from mattering.
--
--   * app_text: anon and authenticated may only read it
--   * saved_coupons: authenticated may read, add and remove its own rows; anon
--     nothing. A save must name a coupon that exists, so the table cannot be
--     filled with made-up ids
--   * the saved_coupons policies call auth.uid() once per statement instead of
--     once per row (Supabase advisor lint auth_rls_initplan), like 005 does
--
-- Run once in the Supabase SQL editor. Additive, safe to re-run, safe with
-- every app version that is live.

begin;

-- Replacing a policy briefly locks its table. If a query is holding it, give up
-- after 5 s and change nothing (the transaction rolls back) instead of queueing
-- and stalling the app's reads behind it; just run the script again.
set local lock_timeout = '5s';

revoke all on public.app_text from anon, authenticated;
grant select on public.app_text to anon, authenticated;

revoke all on public.saved_coupons from anon, authenticated;
grant select, insert, delete on public.saved_coupons to authenticated;

drop policy if exists "read own saved coupons" on public.saved_coupons;
create policy "read own saved coupons"
    on public.saved_coupons for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "save own coupons" on public.saved_coupons;
create policy "save own coupons"
    on public.saved_coupons for insert to authenticated
    with check (
        (select auth.uid()) = user_id
        and exists (select 1 from public.coupons_data c where c.coupon_id = saved_coupons.coupon_id)
    );

drop policy if exists "unsave own coupons" on public.saved_coupons;
create policy "unsave own coupons"
    on public.saved_coupons for delete to authenticated
    using ((select auth.uid()) = user_id);

commit;

-- Check: anon should have select on app_text and nothing else; authenticated
-- select on app_text and select/insert/delete on saved_coupons.
--
--   select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
--   from information_schema.role_table_grants
--   where table_schema = 'public' and table_name in ('app_text', 'saved_coupons')
--     and grantee in ('anon', 'authenticated')
--   group by 1, 2 order by 1, 2;
