alter table public.profiles
add column if not exists show_location_on_portfolio boolean not null default true,
add column if not exists show_timezone_on_portfolio boolean not null default true,
add column if not exists resume_path text;
