begin;

alter table public.profiles
drop column if exists level;

alter table public.profiles
drop column if exists goal;

alter table public.profiles
drop column if exists availability_per_week;

commit;
