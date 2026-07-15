begin;

alter table public.profiles
drop constraint if exists profiles_display_name_length_check,
drop constraint if exists profiles_avatar_url_length_check,
drop constraint if exists profiles_bio_length_check,
drop constraint if exists profiles_location_length_check,
drop constraint if exists profiles_resume_path_length_check,
drop constraint if exists profiles_timezone_length_check;

alter table public.profiles
add constraint profiles_display_name_length_check
check (char_length(display_name) <= 39),
add constraint profiles_avatar_url_length_check
check (avatar_url is null or char_length(avatar_url) <= 500),
add constraint profiles_bio_length_check
check (bio is null or char_length(bio) <= 500),
add constraint profiles_location_length_check
check (location is null or char_length(location) <= 120),
add constraint profiles_resume_path_length_check
check (resume_path is null or char_length(resume_path) <= 255),
add constraint profiles_timezone_length_check
check (char_length(timezone) <= 64);

alter table public.teams
drop constraint if exists teams_name_length_check,
drop constraint if exists teams_party_id_length_check;

alter table public.teams
add constraint teams_name_length_check
check (char_length(name) <= 80),
add constraint teams_party_id_length_check
check (char_length(party_id) = 5);

alter table public.projects
drop constraint if exists projects_name_length_check,
drop constraint if exists projects_description_length_check,
drop constraint if exists projects_github_repo_url_length_check;

alter table public.projects
add constraint projects_name_length_check
check (char_length(name) <= 80),
add constraint projects_description_length_check
check (description is null or char_length(description) <= 300),
add constraint projects_github_repo_url_length_check
check (github_repo_url is null or char_length(github_repo_url) <= 255);

alter table public.project_members
drop constraint if exists project_members_contribution_summary_length_check;

alter table public.project_members
add constraint project_members_contribution_summary_length_check
check (contribution_summary is null or char_length(contribution_summary) <= 300);

alter table public.team_messages
drop constraint if exists team_messages_content_length_check;

alter table public.team_messages
add constraint team_messages_content_length_check
check (char_length(content) <= 500);

commit;
