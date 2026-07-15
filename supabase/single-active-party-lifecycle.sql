begin;

update public.teams
set status = 'active'
where status = 'forming';

alter table public.teams
drop constraint if exists teams_status_check;

alter table public.teams
add constraint teams_status_check
check (status in ('active', 'completed', 'cancelled'));

drop trigger if exists enforce_max_active_parties_on_team_members on public.team_members;
drop function if exists public.enforce_max_active_parties();

create or replace function public.enforce_single_active_party()
returns trigger
language plpgsql
as $$
declare
  active_party_count integer;
begin
  if new.member_status <> 'active' then
    return new;
  end if;

  select count(*)
  into active_party_count
  from public.team_members tm
  join public.teams t
    on t.id = tm.team_id
  where tm.user_id = new.user_id
    and tm.member_status = 'active'
    and t.status = 'active'
    and tm.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if active_party_count >= 1 then
    raise exception 'A user cannot belong to more than 1 active party at the same time.';
  end if;

  return new;
end;
$$;

create trigger enforce_single_active_party_on_team_members
before insert or update on public.team_members
for each row
execute function public.enforce_single_active_party();

commit;
