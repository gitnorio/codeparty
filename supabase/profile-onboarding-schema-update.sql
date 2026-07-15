begin;

alter table public.profiles
drop constraint if exists profiles_project_type_check;

alter table public.profiles
alter column project_type drop default;

alter table public.profiles
alter column project_type type text[]
using (
  case
    when project_type is null then '{}'::text[]
    else array[project_type]
  end
);

alter table public.profiles
alter column project_type set default '{}'::text[];

alter table public.profiles
add constraint profiles_project_type_check
check (
  project_type <@ array['web_app', 'mobile_app', 'api', 'ai_app']::text[]
);

commit;
