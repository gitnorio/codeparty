-- CodeParty canonical RLS policies
-- Block 1 source of truth: clean and stabilize security
-- This file is intended to match the live Supabase RLS state exactly.

begin;

create or replace function public.is_admin_email()
returns boolean
language sql
stable
as $$
  -- Keep this allowlist aligned with NEXT_PUBLIC_ADMIN_EMAILS / lib/admin-access.ts.
  select coalesce(
    lower(auth.jwt() ->> 'email') = any (
      array[
        'gatchebert@gmail.com'
      ]
    ),
    false
  );
$$;

create or replace function public.is_team_creator(p_team_id uuid)
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.teams t
    where t.id = p_team_id
      and t.created_by = auth.uid()
  );
$$;

create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = p_team_id
      and tm.user_id = auth.uid()
      and tm.member_status in ('active', 'completed')
  );
$$;

create or replace function public.can_view_profile(p_profile_id uuid)
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select
    p_profile_id = auth.uid()
    or public.is_admin_email()
    or exists (
      select 1
      from public.team_members me
      join public.team_members other_member
        on other_member.team_id = me.team_id
      where me.user_id = auth.uid()
        and other_member.user_id = p_profile_id
        and me.member_status in ('active', 'completed')
        and other_member.member_status in ('active', 'completed')
    )
    or exists (
      select 1
      from public.teams t
      join public.team_members tm
        on tm.team_id = t.id
      where t.created_by = auth.uid()
        and tm.user_id = p_profile_id
        and tm.member_status in ('active', 'completed')
    );
$$;

alter table public.profiles enable row level security;
alter table public.matchmaking_queue enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;

drop policy if exists "Users can cancel their own matchmaking entry" on public.matchmaking_queue;
drop policy if exists "Users can delete their own matchmaking entry" on public.matchmaking_queue;
drop policy if exists "Users can join matchmaking" on public.matchmaking_queue;
drop policy if exists "Users can view their own matchmaking entry" on public.matchmaking_queue;
drop policy if exists "matchmaking_queue_insert_own_or_admin" on public.matchmaking_queue;
drop policy if exists "matchmaking_queue_select_own_or_admin" on public.matchmaking_queue;
drop policy if exists "matchmaking_queue_update_own_or_admin" on public.matchmaking_queue;

drop policy if exists "Profiles are viewable by owner or teammates" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;

drop policy if exists "Users can create teams" on public.teams;
drop policy if exists "Users can view their teams" on public.teams;
drop policy if exists "Team creators can update teams" on public.teams;
drop policy if exists "teams_insert_admin_only" on public.teams;
drop policy if exists "teams_select_member_or_admin" on public.teams;
drop policy if exists "teams_update_admin_only" on public.teams;

drop policy if exists "Team creators can add members" on public.team_members;
drop policy if exists "Team creators can manage team memberships" on public.team_members;
drop policy if exists "Users can leave their own team membership" on public.team_members;
drop policy if exists "Users can view members of their teams" on public.team_members;
drop policy if exists "team_members_insert_admin_only" on public.team_members;
drop policy if exists "team_members_select_member_or_admin" on public.team_members;
drop policy if exists "team_members_update_admin_only" on public.team_members;

drop policy if exists "Team creators can create projects" on public.projects;
drop policy if exists "Team creators can update projects" on public.projects;
drop policy if exists "Users can view projects of their teams" on public.projects;
drop policy if exists "projects_insert_admin_only" on public.projects;
drop policy if exists "projects_select_team_member_or_admin" on public.projects;
drop policy if exists "projects_update_admin_only" on public.projects;

drop policy if exists "Team creators can create project members" on public.project_members;
drop policy if exists "Team creators can update project members" on public.project_members;
drop policy if exists "Users can update their own project contribution" on public.project_members;
drop policy if exists "Users can view project members of their teams" on public.project_members;
drop policy if exists "project_members_insert_admin_only" on public.project_members;
drop policy if exists "project_members_select_self_team_or_admin" on public.project_members;
drop policy if exists "project_members_update_admin_only" on public.project_members;

create policy "profiles_select"
on public.profiles
for select
to authenticated
using (
  public.can_view_profile(id)
);

create policy "profiles_insert"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  or public.is_admin_email()
);

create policy "profiles_update"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
  or public.is_admin_email()
)
with check (
  auth.uid() = id
  or public.is_admin_email()
);

create policy "matchmaking_queue_select"
on public.matchmaking_queue
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin_email()
);

create policy "matchmaking_queue_insert"
on public.matchmaking_queue
for insert
to authenticated
with check (
  auth.uid() = user_id
  or public.is_admin_email()
);

create policy "matchmaking_queue_update"
on public.matchmaking_queue
for update
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin_email()
)
with check (
  auth.uid() = user_id
  or public.is_admin_email()
);

create policy "matchmaking_queue_delete"
on public.matchmaking_queue
for delete
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin_email()
);

create policy "teams_select"
on public.teams
for select
to authenticated
using (
  public.is_admin_email()
  or created_by = auth.uid()
  or public.is_team_member(id)
);

create policy "teams_insert"
on public.teams
for insert
to authenticated
with check (
  public.is_admin_email()
);

create policy "teams_update"
on public.teams
for update
to authenticated
using (
  public.is_admin_email()
)
with check (
  public.is_admin_email()
);

create policy "team_members_select"
on public.team_members
for select
to authenticated
using (
  public.is_admin_email()
  or user_id = auth.uid()
  or public.is_team_member(team_id)
  or public.is_team_creator(team_id)
);

create policy "team_members_insert"
on public.team_members
for insert
to authenticated
with check (
  public.is_admin_email()
);

create policy "team_members_update"
on public.team_members
for update
to authenticated
using (
  public.is_admin_email()
)
with check (
  public.is_admin_email()
);

create policy "projects_select"
on public.projects
for select
to authenticated
using (
  public.is_admin_email()
  or public.is_team_member(team_id)
  or public.is_team_creator(team_id)
);

create policy "projects_insert"
on public.projects
for insert
to authenticated
with check (
  public.is_admin_email()
  or exists (
    select 1
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.team_id = projects.team_id
      and tm.user_id = auth.uid()
      and tm.member_status = 'active'
      and t.status in ('forming', 'active')
  )
);

create policy "projects_update"
on public.projects
for update
to authenticated
using (
  public.is_admin_email()
  or exists (
    select 1
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.team_id = projects.team_id
      and tm.user_id = auth.uid()
      and tm.member_status = 'active'
      and t.status in ('forming', 'active')
  )
)
with check (
  public.is_admin_email()
  or exists (
    select 1
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.team_id = projects.team_id
      and tm.user_id = auth.uid()
      and tm.member_status = 'active'
      and t.status in ('forming', 'active')
  )
);

create policy "project_members_select"
on public.project_members
for select
to authenticated
using (
  public.is_admin_email()
  or user_id = auth.uid()
  or exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and (
        public.is_team_member(p.team_id)
        or public.is_team_creator(p.team_id)
      )
  )
);

create policy "project_members_insert"
on public.project_members
for insert
to authenticated
with check (
  public.is_admin_email()
  or exists (
    select 1
    from public.projects p
    join public.team_members tm on tm.team_id = p.team_id
    join public.teams t on t.id = p.team_id
    where p.id = project_members.project_id
      and tm.user_id = auth.uid()
      and tm.member_status = 'active'
      and t.status in ('forming', 'active')
  )
);

create policy "project_members_update"
on public.project_members
for update
to authenticated
using (
  public.is_admin_email()
  or exists (
    select 1
    from public.projects p
    join public.team_members tm on tm.team_id = p.team_id
    join public.teams t on t.id = p.team_id
    where p.id = project_members.project_id
      and tm.user_id = auth.uid()
      and tm.member_status = 'active'
      and t.status in ('forming', 'active')
  )
)
with check (
  public.is_admin_email()
  or exists (
    select 1
    from public.projects p
    join public.team_members tm on tm.team_id = p.team_id
    join public.teams t on t.id = p.team_id
    where p.id = project_members.project_id
      and tm.user_id = auth.uid()
      and tm.member_status = 'active'
      and t.status in ('forming', 'active')
  )
);

commit;
