-- Card photos served from Supabase Storage instead of bundled with the app.
--
-- Adds `photo_url` to coupons_data and exposes it through the `coupons` view.
-- The app already prefers `photo_url` over its bundled photos
-- (couponPhoto() in frontend/utils/couponImages.ts), so filling this column
-- switches every card to the Storage copy with no app release. Leave it empty
-- (null) and the card falls back to the bundled photo, or a lilac block.
--
-- The photos live in the public `coupon-images` bucket under `photos/`, next
-- to the logos (`image_url`). To change a photo: upload the new file in
-- Storage, copy its public URL, paste it into `photo_url` in the table editor.
--
-- Additive, safe to re-run (never overwrites a photo_url set by hand), safe
-- with every app version that is live.

begin;

alter table public.coupons_data add column if not exists photo_url text;

-- Backfill from the photos uploaded to Storage. Vendor names are compared like
-- the app does: lower case, accents folded, everything but letters and digits
-- removed, then matched on a prefix ("Club Pilates Evanston" -> 'clubpilates').
with photos(vendor_prefix, file) as (
    values
        ('animalrecords', 'animal-records.jpg'),
        ('chengdubistro', 'chengdu-bistro.jpg'),
        ('clubpilates', 'club-pilates.jpg'),
        ('cravecookies', 'crave-cookies.jpg'),
        ('crepeoclock', 'crepe-oclock.jpg'),
        ('curtscafe', 'curts-cafe.jpg'),
        ('devildawgs', 'devil-dawgs.jpg'),
        ('elephantvine', 'elephant-vine.jpg'),
        ('evanails', 'eva-nails.jpg'),
        ('evanstoncornerbistro', 'evanston-corner-bistro.jpg'),
        ('fridas', 'fridas.jpg'),
        ('gather', 'gather.jpg'),
        ('lacocinita', 'la-cocinita.jpg'),
        ('landlake', 'land-and-lake.jpg'),
        ('lockchicago', 'lock-chicago.jpg'),
        ('moget', 'moge-tee.jpg'),
        ('mteverest', 'mt-everest.jpg'),
        ('ovofrito', 'ovo-frito.jpg'),
        ('papajohns', 'papa-johns.jpg'),
        ('pilatesconnection', 'pilates-connection.jpg'),
        ('reprisecoffee', 'reprise-coffee.jpg'),
        ('titleboxing', 'title-boxing.jpg'),
        ('yofresh', 'yofresh.jpg'),
        ('zorasplace', 'zoras-place.jpg')
)
update public.coupons_data c
set photo_url = 'https://sozbbhiylaezrvjaedcy.supabase.co/storage/v1/object/public/coupon-images/photos/' || p.file
from photos p
where c.photo_url is null
  and regexp_replace(
          translate(lower(c.vendor), 'áàâäãåéèêëíìîïóòôöõúùûüñç', 'aaaaaaeeeeiiiiooooouuuunc'),
          '[^a-z0-9]', '', 'g'
      ) like p.vendor_prefix || '%';

-- Expose the column through the `coupons` view, the same way 007 added
-- `category`: rebuild it from its current columns, refusing if it is anything
-- more than a plain column list over coupons_data.
do $$
declare
    def      text := rtrim(btrim(pg_get_viewdef('public.coupons'::regclass)), ';');
    order_by text := coalesce((regexp_match(def, '\s(order\s+by\s.*)$', 'i'))[1], '');
    cols     text;
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'coupons' and column_name = 'photo_url'
    ) then
        return;  -- already exposed
    end if;

    if regexp_replace(def, '\sorder\s+by\s.*$', '', 'i') ~* '\m(where|join|group|having|union|limit|order|distinct)\M' then
        raise exception 'public.coupons is not a plain select from coupons_data; add photo_url to it by hand. Definition: %', def;
    end if;

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
        raise exception 'public.coupons has columns that are not in coupons_data; add photo_url to it by hand. Definition: %', def;
    end if;

    select string_agg(format('%I', column_name), ', ' order by ordinal_position)
    into cols
    from information_schema.columns
    where table_schema = 'public' and table_name = 'coupons';

    -- create or replace keeps the view's grants; new columns may only be appended
    execute format(
        'create or replace view public.coupons with (security_invoker = true) as select %s, photo_url from public.coupons_data %s',
        cols, order_by
    );
end $$;

commit;

-- Check: every coupon and its photo. Rows with a null photo_url are vendors
-- with no uploaded photo; upload one and paste its URL in the table editor.
select coupon_id, vendor, photo_url from public.coupons order by photo_url nulls first, vendor;
