# CodeParty MVP Execution Plan

This document is the source of truth for finishing the CodeParty MVP.

The execution order below must be followed strictly unless the user explicitly changes priorities.

---

## MVP finish line

The MVP is considered complete only when this end-to-end flow works:

1. A user signs in with GitHub
2. The user completes onboarding
3. The user enters the matchmaking queue
4. The admin sees all waiting users
5. The admin creates a team
6. The admin creates a project for that team
7. The admin assigns project members and roles
8. The user sees team, project, role, repo, and contribution context in the workspace
9. All sensitive access is protected by clean RLS and server-side admin checks

---

## Execution rules

- Complete one block fully before starting the next
- Do not skip validation at the end of a block
- Do not leave partial data flows or placeholder actions in a completed block
- Treat this file as the active implementation roadmap
- Update this file if scope changes

---

## Block 1 — Clean and stabilize security

### Goal

Make the data layer production-safe and remove security ambiguity.

### Tasks

1. Clean duplicate RLS policies on:
   - `profiles`
   - `matchmaking_queue`
   - `teams`
   - `team_members`
   - `projects`
   - `project_members`
2. Keep one consistent access model per table
3. Preserve admin access through approved email allowlist logic
4. Preserve user self-access where needed
5. Verify helper functions:
   - `is_admin_email`
   - `is_team_member`
   - `is_team_creator`
   - `can_view_profile`
6. Remove recursive or overlapping policy paths
7. Keep SQL files in repo aligned with live Supabase state

### Done when

- No policy recursion remains
- No duplicate policy strategy remains
- Admin pages still work
- Regular user pages still work
- Live DB and repo SQL match

---

## Block 2 — Complete admin operations

### Goal

Allow the admin to manage the full matchmaking lifecycle from queue to real project.

### Tasks

1. Keep the admin matchmaking screen stable
2. Add project creation for a formed team
3. Add project editing fields:
   - project name
   - description
   - stack
   - GitHub repo URL
   - project status
   - optional dates
4. Add project member assignment
5. Add project role assignment
6. Add contribution summary editing
7. Ensure all admin write actions run through secure backend paths
8. Enforce state consistency between:
   - `matchmaking_queue`
   - `teams`
   - `team_members`
   - `projects`
   - `project_members`

### Done when

- Admin can create a team
- Admin can create a project for that team
- Admin can assign members and roles
- Admin can link a GitHub repo
- Admin can update statuses without breaking data consistency

---

## Block 3 — Complete user workspace behavior

### Goal

Make every authenticated user page reflect the real state of the user.

### Tasks

1. Verify dashboard with real queue/team/project data
2. Verify matchmaking page with:
   - join queue
   - pause queue
   - matched state
3. Verify team page with real members
4. Verify project page with:
   - real project
   - real repo URL
   - real roles
   - real contribution summaries
5. Verify public profile preview with real data
6. Verify settings updates persist correctly
7. Ensure all empty states are intentional and clear

### Done when

- No workspace page depends on fake assumptions
- All states are understandable with or without project data
- Settings updates reflect immediately in the shell

---

## Block 4 — Finish auth and routing reliability

### Goal

Remove auth uncertainty and ensure smooth product flow.

### Tasks

1. Verify GitHub OAuth callback behavior
2. Verify redirect logic:
   - signed out -> home
   - signed in without profile -> onboarding
   - signed in with profile -> dashboard
3. Prevent onboarded users from re-entering onboarding by mistake
4. Verify logout flow
5. Verify session refresh behavior
6. Keep `Dev Login` disabled or removable for production

### Done when

- Auth flow is predictable
- Routing always lands on the correct screen
- No dead-end auth state remains

---

## Block 5 — UX polish for MVP readiness

### Goal

Remove the last rough edges so the MVP feels intentional.

### Tasks

1. Standardize success states
2. Standardize error states
3. Standardize loading states
4. Standardize empty states
5. Remove any remaining placeholder-like micro-copy
6. Hide or remove non-functional UI elements
7. Verify responsive behavior on:
   - home
   - onboarding
   - dashboard
   - admin matchmaking
   - project
   - team

### Done when

- The app feels coherent from page to page
- No obviously fake UI remains
- Mobile and desktop both feel stable

---

## Block 6 — MVP validation and release readiness

### Goal

Confirm the MVP is operational and safe to demo or release.

### Tasks

1. Run lint
2. Run production build
3. Manually validate the full user journey
4. Manually validate the full admin journey
5. Verify production environment variables:
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_ADMIN_EMAILS`
6. Verify GitHub OAuth production callback
7. Prepare final SQL setup files in repo

### Done when

- Full journey works end to end
- Build passes
- Security model is stable
- MVP can be demonstrated cleanly

---

## Recommended immediate execution order

1. Block 1 — Clean and stabilize security
2. Block 2 — Complete admin operations
3. Block 3 — Complete user workspace behavior
4. Block 4 — Finish auth and routing reliability
5. Block 5 — UX polish for MVP readiness
6. Block 6 — MVP validation and release readiness

---

## Current status

- Block 1 — Clean and stabilize security: **completed**
- Block 2 — Complete admin operations: **completed**
- Block 3 — Complete user workspace behavior: **completed**
- Block 4 — Finish auth and routing reliability: **completed**
- Block 5 — UX polish for MVP readiness: **completed**
- Block 6 — MVP validation and release readiness: **paused for audit cleanup**

## Audit cleanup pass

The product audit introduced one final structural cleanup pass before Block 6.

### Goal

Reduce page duplication, tighten the MVP UX, and make the workspace feel more intentional.

### Tasks

1. Merge `My Team` and `My Project` into one compact `Workspace` screen
2. Remove `Public Profile` from primary navigation
3. Keep `Public Profile` out of the MVP flow and redirect it to a stronger screen
4. Recenter `Matchmaking` on queue management and next-step clarity
5. Compact oversized cards and forms across workspace pages
6. Compact the admin matchmaking screen and reduce visual noise
7. Keep admin allowlist logic explicitly aligned between app code and Supabase SQL

### Done when

- Sidebar navigation is simpler
- No thin or duplicate workspace page remains in the main flow
- Queue, workspace, and settings each have a clear role
- The UI feels tighter and more production-ready
- The SQL allowlist source-of-truth mismatch is documented in code

### Current cleanup status

- Audit cleanup pass: **in progress**

## Latest validation

- Block 5 passes `npm run lint`
- Block 5 passes `npx next build --webpack`
- The next active block is: **Block 6 — MVP validation and release readiness**
