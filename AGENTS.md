<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Agent Instructions

Read this entire file before starting any task.

## Self-Correcting Rules Engine

This file contains a growing ruleset that improves over time. **At session start, read the entire "Learned Rules" section before doing anything.**

### How it works

1. When the user corrects you or you make a mistake, **immediately append a new rule** to the "Learned Rules" section at the bottom of this file.
2. Rules are numbered sequentially and written as clear, imperative instructions.
3. Format: `N. [CATEGORY] Never/Always do X — because Y.`
4. Categories: `[STYLE]`, `[CODE]`, `[ARCH]`, `[TOOL]`, `[PROCESS]`, `[DATA]`, `[UX]`, `[OTHER]`
5. Before starting any task, scan all rules below for relevant constraints.
6. If two rules conflict, the higher-numbered (newer) rule wins.
7. Never delete rules. If a rule becomes obsolete, append a new rule that supersedes it.

### When to add a rule

- User explicitly corrects your output ("no, do it this way")
- User rejects a file, approach, or pattern
- You hit a bug caused by a wrong assumption about this codebase
- User states a preference ("always use X", "never do Y")

### Rule format example

```
14. [CODE] Always use `bun` instead of `npm` — user preference, bun is installed globally.
15. [STYLE] Never add emojis to commit messages — project convention.
16. [ARCH] API routes live in `src/server/routes/`, not `src/api/` — existing codebase pattern.
```

---

## Learned Rules

<!-- New rules are appended below this line. Do not edit above this section. -->
1. [CODE] Always use `shadcn` components for this branch's feature UI work when applicable — user explicitly asked to redo the feature with shadcn.
2. [UX] Always push the home, onboarding, and dashboard toward a premium SaaS direction inspired by `blabla.ai` — user explicitly requested that visual direction.
3. [UX] Always match the referenced design language much more closely in palette, spacing, and composition when the user provides screenshots — previous attempt drifted too far from the reference.
4. [ARCH] Always use an authenticated app shell after login with left sidebar, topbar, and content areas for dashboard, matchmaking, team, project, public profile, and settings — user explicitly defined the connected layout.
5. [STYLE] Always keep the product UI copy in English unless the user explicitly asks for another language — user explicitly reminded that the interface must be in English.
6. [UX] Never switch the onboarding back to a dark dashboard aesthetic when a stronger visual rule already requires a `blabla.ai`-like light violet SaaS look — the previous onboarding rewrite violated the established design direction.
7. [UX] Always keep the entire app in the `blabla.ai` UX direction on every page, not just marketing screens — user explicitly said the whole app must follow that UX without exception.
8. [UX] Always keep `Login with GitHub` as the GitHub auth button label and never replace it with `Open dashboard`; expose `Dev Login` as a temporary separate entry to `/dev-login` when requested — user explicitly clarified the CTA behavior.
9. [DATA] Never use fake placeholder identities like `Alex Morgan` or labels like `Simulated developer preview` in authenticated onboarding; always use the real GitHub/session identity with professional copy — user explicitly rejected non-production identity placeholders.
10. [STYLE] Always keep the entire site fully in English, including onboarding labels and helper text, even when the user discusses product decisions in French — user explicitly reminded that the whole site must remain in English.
11. [ARCH] Secure admin-only screens with a real email-based admin allowlist and hide those entries from non-admin users — user explicitly requested a true email-based admin guard.
12. [PROCESS] When committing to an implementation block, always finish the full agreed scope before stopping — user explicitly asked that each step be completed all the way through.
13. [PROCESS] Always maintain and follow a written MVP execution plan in a Markdown file as the source of truth once the user requests it — user explicitly asked for a plan file to be followed religiously.
14. [UX] Never add GitHub-like contribution or progress panels, and always keep forms and cards compact rather than oversized — user explicitly said CodeParty should not try to replace GitHub and that the UI must feel tighter.
15. [ARCH] Always keep the authenticated MVP navigation focused on `Dashboard`, `Matchmaking`, `Workspace`, and `Settings`, with `Public Profile` removed from primary navigation and `Team`/`Project` merged into one `Workspace` screen — user asked to execute the full cleanup audit.
16. [UX] Always make the main parent container responsive and content-driven in height — it should grow when a page has many elements and shrink when a page has few, instead of forcing oversized fixed-height shells.
17. [DATA] Always treat the user avatar as a persisted profile field in Supabase and prefer the user’s Discord avatar URL when available, with a safe fallback when it is missing.
18. [DATA] Always use the user’s GitHub avatar as the profile avatar source for this app when available — user corrected the earlier Discord wording.
19. [ARCH] Always provide a real Portfolio page when the user asks for it, backed by public-shareable portfolio data rather than a placeholder redirect.
16. [ARCH] Always add a reliable sync fallback for realtime chat updates instead of depending on Supabase Realtime alone — realtime proved unreliable across two real browser sessions and the chat must update without manual refresh.
17. [ARCH] Always treat onboarding as profile configuration, not as next-matchmaking configuration — the user explicitly redefined onboarding’s product purpose.
18. [DATA] Always treat `display_name` as the immutable account username in the UI and product flow — the user explicitly said it is now the username and must not be editable.
19. [ARCH] Always keep the frontend profile model strictly aligned with the Supabase `profiles` table and remove unused columns instead of leaving dead schema behind — the user explicitly rejected DB columns that the app no longer uses.
20. [UX] Always keep the onboarding free of a separate identity step when the username is already sourced from the connected account — the user explicitly asked to remove Step 2.
21. [DATA] Always use a dedicated `party_id` field for parties instead of overloading `teams.name` when the product distinguishes the two concepts — the user explicitly asked for a real Party ID.
22. [UX] Always treat successful matches as Parties in the matchmaking experience, remove the old matched-state block, and prefer automatic realtime updates over manual refresh controls — the user explicitly redefined the page behavior.
23. [UX] Always make the Workspace entry screen show the full party list first, then open a specific party workspace on click — the user explicitly redefined the navigation flow.
24. [ARCH] Always let a user rejoin matchmaking after joining a party unless they already have 3 active parties, and enforce that same limit in Supabase — the user explicitly defined this product rule.
25. [ARCH] Always enforce a single active party per user for the MVP, with party history shown in Matchmaking and party status changes restricted to admin controls — the user explicitly simplified the product rule and admin responsibilities.
26. [ARCH] Always use a member completion-request flow for party completion, where members can request completion but only admins can approve or reject it — the user explicitly defined this moderation flow.
27. [DATA] Never allow free-text entry for `Technical stack` in profile settings; always use a controlled predefined technology selection — the user explicitly rejected arbitrary stack values.
28. [UX] Never show the `Username` section inside `Profile settings` — the user explicitly asked to remove it from Settings.
29. [UX] Always provide a global dark mode toggle near `Logout`, using moon/sun icons and keeping the same violet accents while replacing white surfaces with dark ones — the user explicitly requested this theme behavior.
30. [UX] Always use a product-grade dark palette with dark cards, muted borders, softened text, and a slightly subdued violet accent instead of leaving white cards on a black background — the user explicitly rejected the half-finished dark mode look.

31. [UX] Always make the portfolio owner view visibly editable with a clear Edit button on the actual in-app Portfolio route, not only on the public share page — the user must immediately see how to edit their portfolio.

32. [DATA] Never relax required profile fields globally when the user only asks for optional display in Portfolio — keep profile data rules strict and change only portfolio visibility.

33. [UX] Always keep only one clear portfolio edit entry and one top-level copy-link action — duplicate edit/copy buttons in the portfolio UI confuse the user.

34. [CODE] Never render `window`-derived absolute URLs during the initial SSR pass of a Client Component — compute them after mount or only inside click handlers to avoid hydration mismatches.
35. [UX] Always support both English and French across the full app with a top-right language toggle, while never translating usernames or other user-generated identity fields.
36. [STYLE] Always treat `party` as a masculine noun in French copy and translate built-in option labels like languages and project types according to the active app language.
35. [DATA] Never use the mascot as a user avatar or avatar fallback — user identities must use their GitHub avatar when available, with initials fallback only if needed.
36. [UX] Always make the `Get my resume` CTA on Portfolio feel premium and elevated, matching the high-end violet SaaS direction — the user explicitly asked for a premium treatment.
37. [UX] Never show mascot PNGs inside Portfolio success/error notification feedback — Portfolio toast/banner messages must stay clean and minimal.
38. [UX] Always keep the `© 2026 CodeParty. All rights reserved.` footer global, outside the main content boxes, and visually understated at the very bottom of every page.
39. [DATA] Always keep `location` optional in the `profiles` model and never add it to onboarding — the user explicitly said onboarding must not collect it and the database must allow null.
40. [UX] Always include the global dark mode toggle in onboarding and ensure the onboarding surfaces have matching dark styling — the user explicitly asked for dark mode there too.
41. [UX] Always keep the onboarding parent box vertically centered in the viewport unless the user explicitly asks otherwise.
42. [UX] Never show a mascot PNG inside the Dashboard hero, and keep the `Suggested next step` mascot larger and more prominent instead — the user explicitly refined that layout.
43. [UX] Always give the Matchmaking profile-criteria card a meaningful action-oriented title and use a distinct icon for each criterion — the user explicitly asked for clearer wording and unique icons.
44. [UX] Always include `Portfolio` in the portfolio-page top navigation before `Settings`, and show it as the selected nav item on portfolio routes.
