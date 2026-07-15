begin;

alter table public.teams
add column if not exists completion_requested_at timestamptz,
add column if not exists completion_requested_by uuid references public.profiles(id) on delete set null;

commit;
