begin;

drop table if exists public.project_members cascade;

alter table public.projects
drop column if exists start_date,
drop column if exists end_date;

commit;
