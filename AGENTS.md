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
16. [ARCH] Always add a reliable sync fallback for realtime chat updates instead of depending on Supabase Realtime alone — realtime proved unreliable across two real browser sessions and the chat must update without manual refresh.
