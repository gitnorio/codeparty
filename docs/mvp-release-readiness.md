# CodeParty MVP — Production Release Checklist

This file is the deployment source of truth for the current MVP.

## 1. Supabase database

The existing Supabase project must already contain the core tables: `profiles`, `matchmaking_queue`, `teams`, `team_members` and `projects`.

Apply these current SQL files in this order from the Supabase SQL editor:

1. `supabase/profile-avatar-url.sql`
2. `supabase/profile-onboarding-schema-update.sql`
3. `supabase/profile-schema-coherence-cleanup.sql`
4. `supabase/profile-headline-cleanup.sql`
5. `supabase/make-location-optional.sql`
6. `supabase/teams-party-id-migration.sql`
7. `supabase/single-active-party-lifecycle.sql`
8. `supabase/party-completion-requests.sql`
9. `supabase/portfolio-schema-update.sql`
10. `supabase/portfolio-visibility-preferences.sql`
11. `supabase/mvp-schema-cleanup.sql`
12. `supabase/rls-policies.sql`
13. `supabase/text-length-guards.sql`
14. `supabase/portfolio-resume-storage.sql`

Do **not** apply `supabase/restore-required-profile-fields.sql`: `location` is intentionally optional. `supabase/team-members-max-active-parties.sql` is superseded by `supabase/single-active-party-lifecycle.sql`.

Before launch, keep the email allowlist inside `public.is_admin_email()` in `supabase/rls-policies.sql` synchronized with `NEXT_PUBLIC_ADMIN_EMAILS` in the deployment environment.

Confirm in Supabase:

- RLS is enabled on every public application table
- `team_messages` is present in the `supabase_realtime` publication
- `portfolio-resumes` is public, accepts PDF only and has a 500 KB limit
- `project_members`, `projects.start_date` and `projects.end_date` no longer exist
- A user cannot belong to more than one active party

## 2. Production environment

Set these variables in the hosting provider for Production and Preview environments:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` — exact deployed origin, for example `https://codeparty.example`
- `NEXT_PUBLIC_ADMIN_EMAILS` — comma-separated admin emails; never leave empty

Never expose the service-role key with a `NEXT_PUBLIC_` prefix.

Keep `DEV_LOGIN_ENABLED` and `NEXT_PUBLIC_DEV_LOGIN_ENABLED` unset or `false` in Production. They may be set to `true` together only on an access-protected Preview deployment.

## 3. Supabase Auth and GitHub OAuth

In Supabase Auth URL configuration:

- Set the Site URL to the production `NEXT_PUBLIC_SITE_URL`
- Add the production origin and required preview origins to Redirect URLs

In the GitHub OAuth App:

- Keep the authorization callback URL equal to the callback URL shown by Supabase for the GitHub provider
- Confirm GitHub login returns to the production CodeParty origin

## 4. Automated validation

Run from the repository root:

```bash
npm ci
npm run check
npm run build:webpack
```

Deployment must stop if lint, TypeScript or the production build fails.

## 5. Manual smoke test

Use two normal GitHub accounts and one admin account.

### User flow

1. Sign in with GitHub
2. Complete onboarding and confirm the profile and GitHub avatar are saved
3. Join the matchmaking queue and confirm live queue updates
4. Have the admin create a party and confirm the user leaves the waiting state
5. Open the party workspace and create the project with a valid public GitHub repository
6. Send chat messages between two browsers without refreshing
7. Request party completion
8. After admin approval, confirm the project appears on the public portfolio
9. Edit portfolio visibility, bio and resume, then verify the public link in a signed-out browser
10. Verify English/French and light/dark mode on Home, Onboarding, Dashboard, Matchmaking, Workspace, Settings, Admin Matchmaking and Portfolio

### Admin flow

1. Confirm non-admin accounts cannot load or call admin matchmaking APIs
2. Confirm every waiting profile is visible
3. Create a party and verify the generated five-digit Party ID
4. Reject one completion request and approve another
5. Mark a test party cancelled and verify it is no longer treated as active

## 6. Known MVP operational limits

- Chat API rate limiting is process-local and therefore best-effort on serverless infrastructure; database length guards and RLS remain enforced. A shared rate-limit store is recommended after MVP validation.
- GitHub repository existence is checked through the public GitHub API and can be temporarily affected by GitHub rate limits.
- Portfolio resumes are publicly readable by design because public portfolios link directly to them.

## 7. Release decision

The MVP is ready only when:

- all automated checks pass
- all SQL changes are applied to production
- OAuth URLs use the production domain
- the full user and admin smoke tests pass
- no production environment variable still references `localhost`
