-- Coupon categories, editable in the Supabase dashboard.
--
-- Adds `category` to coupons_data and exposes it through the `coupons` view the
-- app reads. Before this, the app guessed a coupon's category from its vendor
-- name with a hardcoded map (VENDOR_PLACE_TYPES in utils/couponFilters.ts).
-- This backfills every existing coupon from that map, so nothing changes for
-- users when it runs.
--
-- The column is an enum, so the table editor shows a dropdown. The values must
-- match PLACE_TYPES in frontend/utils/couponFilters.ts. To add a category:
--   alter type public.coupon_category add value 'nightlife';
-- then add it (with its label) to PLACE_TYPES and ship an app update. A coupon
-- whose category the app does not know shows with no category.
--
-- Leave `category` empty (null) and the coupon has no category: it is listed,
-- but no category filter chip matches it.
--
-- Additive, safe to re-run, safe with every app version that is live (older
-- builds already prefer `category` over their built-in map).

begin;

do $$
begin
    if not exists (select 1 from pg_type where typname = 'coupon_category' and typnamespace = 'public'::regnamespace) then
        create type public.coupon_category as enum ('food', 'coffee', 'fitness', 'beauty', 'shopping', 'fun');
    end if;
end $$;

alter table public.coupons_data add column if not exists category public.coupon_category;

-- Backfill from the old hardcoded map. Vendor names are compared like the app
-- did: lower case, accents folded, everything but letters and digits removed.
-- Only fills empty categories, so re-running never overwrites a dashboard edit.
with vendor_categories(vendor_key, category) as (
    values
        ('chengdubistro', 'food'),
        ('curtscafe', 'food'),
        ('devildawgsevanston', 'food'),
        ('evanstoncornerbistro', 'food'),
        ('fridasevanston', 'food'),
        ('lacocinita', 'food'),
        ('landlakecafe', 'food'),
        ('mteverestrestaurant', 'food'),
        ('ovofritocafe', 'food'),
        ('papajohnspizza', 'food'),
        ('yofresh', 'food'),
        ('cravecookies', 'coffee'),
        ('mogetea', 'coffee'),
        ('reprisecoffeeroasters', 'coffee'),
        ('clubpilatesevanston', 'fitness'),
        ('pilatesconnectionchicago', 'fitness'),
        ('titleboxingevanston', 'fitness'),
        ('evanails', 'beauty'),
        ('animalrecords', 'shopping'),
        ('crossroadstrading', 'shopping'),
        ('gatherconsciouslycurated', 'shopping'),
        ('lockchicago', 'fun'),
        ('zorasplace', 'fun')
)
update public.coupons_data c
set category = vc.category::public.coupon_category
from vendor_categories vc
where c.category is null
  and regexp_replace(
          translate(lower(c.vendor), 'áàâäãåéèêëíìîïóòôöõúùûüñç', 'aaaaaaeeeeiiiiooooouuuunc'),
          '[^a-z0-9]', '', 'g'
      ) = vc.vendor_key;

-- Expose the column through the `coupons` view. Postgres fixes a view's column
-- list when the view is created, so it has to be redefined. Its definition was
-- never committed, so this rebuilds it from its current columns and refuses if
-- it is anything more than a plain column list over coupons_data (a filter,
-- join or computed column would be lost).
do $$
declare
    def      text := rtrim(btrim(pg_get_viewdef('public.coupons'::regclass)), ';');
    order_by text := coalesce((regexp_match(def, '\s(order\s+by\s.*)$', 'i'))[1], '');
    cols     text;
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'coupons' and column_name = 'category'
    ) then
        return;  -- already exposed
    end if;

    -- A trailing ORDER BY (the live view sorts by vendor) is kept as is; the
    -- rest must be a plain column list.
    if regexp_replace(def, '\sorder\s+by\s.*$', '', 'i') ~* '\m(where|join|group|having|union|limit|order|distinct)\M' then
        raise exception 'public.coupons is not a plain select from coupons_data; add category to it by hand. Definition: %', def;
    end if;

    -- every view column must be a coupons_data column of the same name
    if exists (
        select 1
        from information_schema.columns v
        where v.table_schema = 'public' and v.table_name = 'coupons'
          and not exists (
              select 1 from information_schema.columns t
              where t.table_schema = 'public' and t.table_name = 'coupons_data'
                and t.column_name = v.column_name
          )
    ) then
        raise exception 'public.coupons has columns that are not in coupons_data; add category to it by hand. Definition: %', def;
    end if;

    select string_agg(format('%I', column_name), ', ' order by ordinal_position)
    into cols
    from information_schema.columns
    where table_schema = 'public' and table_name = 'coupons';

    -- create or replace keeps the view's grants; new columns may only be appended
    execute format(
        'create or replace view public.coupons with (security_invoker = true) as select %s, category from public.coupons_data %s',
        cols, order_by
    );
end $$;

commit;

-- Check: every coupon and the category it got. Rows with a null category are
-- vendors the old map did not know; set them in the table editor.
select coupon_id, vendor, category from public.coupons order by category nulls first, vendor;
