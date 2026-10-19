-- Editable app copy (headlines and other short text), so wording can change
-- from the Supabase table editor without an app release.
-- Additive only: safe to run while any app version is live. Until it runs, or
-- for any missing key, the app falls back to the text built into it.
--
-- Edit a row's `value` and the app picks it up the next time the screen
-- loads. Clear the value (empty string) to fall back to the built-in text.
--
-- Keys in use:
--   discover_headline  headline on the Discover tab
--   saved_headline     headline on the Saved tab
--   used_headline      headline on the Used tab

create table if not exists app_text (
    key        text primary key,
    value      text not null,
    updated_at timestamptz not null default now()
);

alter table app_text enable row level security;

-- public copy, readable by everyone; only the dashboard / service role writes
drop policy if exists "read app text" on app_text;
create policy "read app text"
    on app_text for select to anon, authenticated
    using (true);

insert into app_text (key, value) values
    ('discover_headline', 'Good deals, right around the corner.'),
    ('saved_headline', 'Saved for your next outing.'),
    ('used_headline', 'Your past perks.')
on conflict (key) do nothing;
