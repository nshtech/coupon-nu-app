-- Saved (favorited) coupons, behind the app's Saved tab.
-- Additive only: safe to run while any app version is live. Until it runs,
-- the app hides the save hearts and the Saved tab explains why.
--
-- Deleting the auth user (DELETE /api/delete-account) cascades here.
-- `coupon_id` has no foreign key: `coupons` is a view in this database, and
-- Postgres cannot reference a view. A row left behind by a deleted coupon is
-- harmless, since the Saved tab only shows ids that match a live coupon.

create table if not exists saved_coupons (
    user_id    uuid not null references auth.users (id) on delete cascade,
    coupon_id  bigint not null,
    created_at timestamptz not null default now(),
    primary key (user_id, coupon_id)
);

alter table saved_coupons enable row level security;

drop policy if exists "read own saved coupons" on saved_coupons;
create policy "read own saved coupons"
    on saved_coupons for select to authenticated
    using (auth.uid() = user_id);

drop policy if exists "save own coupons" on saved_coupons;
create policy "save own coupons"
    on saved_coupons for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "unsave own coupons" on saved_coupons;
create policy "unsave own coupons"
    on saved_coupons for delete to authenticated
    using (auth.uid() = user_id);
