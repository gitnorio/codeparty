# CodeParty MVP Release Readiness

This checklist is the final release and demo readiness reference for the MVP.

## Verified in code

- `npm run lint` passes
- `npx next build --webpack` passes
- Auth entry routing resolves through `/`
- Signed-in users without a profile are redirected to `/onboarding`
- Signed-in users with a profile are redirected to `/dashboard`
- Onboarded users are redirected away from `/onboarding`
- Team members can create their own project and paste a public GitHub repository URL
- Admins can supervise matchmaking and mark a team/project as abandoned
- Canonical SQL policy file lives at `supabase/rls-policies.sql`

## Environment variables required

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_ADMIN_EMAILS`

## Supabase / SQL status

- Current canonical policy file: `supabase/rls-policies.sql`
- Self-service project RLS patch has already been applied to the linked Supabase project

## Manual validation checklist

### User journey

1. Open `/`
2. Click `Login with GitHub`
3. Confirm redirect:
   - no profile -> `/onboarding`
   - existing profile -> `/dashboard`
4. Complete onboarding
5. Confirm queue entry is created
6. Open `Matchmaking`
7. Confirm queue state is visible
8. After admin team creation, confirm:
   - `My Team` shows members
   - `My Project` allows self-service creation if no project exists
   - `Dashboard` reflects team/project state
9. Create a project with a valid public GitHub URL
10. Confirm project, roles, repo, and contribution data appear across workspace pages

### Admin journey

1. Sign in with an email present in `NEXT_PUBLIC_ADMIN_EMAILS`
2. Open `/admin-matchmaking`
3. Confirm all `waiting` queue profiles appear
4. Create a team from waiting users
5. Confirm formed team appears in admin supervision
6. Confirm admin can reopen cancelled queue entries
7. Confirm admin can mark a team/project as abandoned

## Production callback note

GitHub OAuth should redirect back to:

```txt
{NEXT_PUBLIC_SITE_URL}/
```

## Remaining non-code validation

- Run the manual user journey once in the browser
- Run the manual admin journey once in the browser
- Verify the production GitHub OAuth app callback URL matches the deployed `NEXT_PUBLIC_SITE_URL`
