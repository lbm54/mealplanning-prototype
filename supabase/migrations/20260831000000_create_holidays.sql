-- holidays: US calendar for Vana's week briefings (federal + big food-relevant cultural dates).
-- Seed generated from packages/web/src/server/vana/holidays.ts (rules-based, observed-day shifts included).
-- Extend by inserting more rows (any country_code) — the context reads the table, computation is only a fallback.
create table if not exists public.holidays (
    country_code text not null default 'US',
    holiday_date date not null,
    name         text not null,
    federal      boolean not null default false,
    primary key (country_code, holiday_date, name)
);

alter table public.holidays enable row level security;
drop policy if exists "holidays public read" on public.holidays;
create policy "holidays public read" on public.holidays for select using (true);
grant select on public.holidays to authenticated, anon, service_role;

insert into public.holidays (holiday_date, name, federal) values
    ('2026-09-07', 'Labor Day', true),
    ('2026-10-12', 'Columbus Day', true),
    ('2026-10-31', 'Halloween', false),
    ('2026-11-11', 'Veterans Day', true),
    ('2026-11-26', 'Thanksgiving', true),
    ('2026-12-25', 'Christmas Day', true),
    ('2026-12-31', 'New Year''s Eve', false),
    ('2027-01-01', 'New Year''s Day', true),
    ('2027-01-18', 'MLK Day', true),
    ('2027-02-14', 'Valentine''s Day', false),
    ('2027-02-15', 'Presidents'' Day', true),
    ('2027-03-17', 'St. Patrick''s Day', false),
    ('2027-03-26', 'Good Friday', false),
    ('2027-03-28', 'Easter Sunday', false),
    ('2027-05-09', 'Mother''s Day', false),
    ('2027-05-31', 'Memorial Day', true),
    ('2027-06-18', 'Juneteenth', true),
    ('2027-06-20', 'Father''s Day', false),
    ('2027-07-05', 'Independence Day', true),
    ('2027-09-06', 'Labor Day', true),
    ('2027-10-11', 'Columbus Day', true),
    ('2027-10-31', 'Halloween', false),
    ('2027-11-11', 'Veterans Day', true),
    ('2027-11-25', 'Thanksgiving', true),
    ('2027-12-24', 'Christmas Day', true),
    ('2027-12-31', 'New Year''s Eve', false)
on conflict (country_code, holiday_date, name) do nothing;
