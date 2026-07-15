begin;

alter table public.teams
add column if not exists party_id text;

create or replace function public.generate_party_id()
returns text
language plpgsql
as $$
declare
  generated_id text;
begin
  loop
    generated_id := lpad((floor(random() * 100000))::int::text, 5, '0');

    exit when not exists (
      select 1
      from public.teams
      where party_id = generated_id
    );
  end loop;

  return generated_id;
end;
$$;

update public.teams
set party_id = public.generate_party_id()
where party_id is null;

alter table public.teams
alter column party_id set not null;

create unique index if not exists teams_party_id_key
on public.teams(party_id);

commit;
