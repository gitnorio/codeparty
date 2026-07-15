begin;

alter table public.profiles
add column if not exists bio text,
add column if not exists location text,
add column if not exists resume_path text,
add column if not exists show_location_on_portfolio boolean not null default true,
add column if not exists show_timezone_on_portfolio boolean not null default true;

alter table public.teams
add column if not exists completed_at timestamptz;

create unique index if not exists profiles_display_name_unique_ci
on public.profiles (lower(display_name));

commit;
