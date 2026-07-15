update public.profiles
set location = coalesce(nullif(trim(location), ''), 'Remote')
where location is null or trim(location) = '';

update public.profiles
set timezone = 'America/Toronto'
where timezone is null or trim(timezone) = '';

alter table public.profiles
alter column location set not null;

alter table public.profiles
alter column timezone set not null;
