# CodeParty Chatroom Execution Plan

This document is the source of truth for the `5-chatroom` branch feature work.

The execution order below must be followed strictly unless the user explicitly changes priorities.

---

## Feature goal

Add a real-time team chat as a **global floating widget** that stays available across the authenticated app, using Next.js App Router and Supabase Realtime.

The chat must:

1. Appear only for users who belong to an active team
2. Persist visually across route changes
3. Receive new messages in real time
4. Track unread messages while minimized or while the browser tab is inactive
5. Keep the rest of the application unchanged

---

## Product constraints

- The widget lives in the global app layout, not in a page
- The widget is `fixed` at the bottom-right of the viewport
- Open state is a compact panel, not a fullscreen view
- Minimized state is a floating circular bubble
- No Discord, no external messaging tool, no GitHub-like chat detour
- Tailwind CSS only, aligned with the existing workspace UI
- The chat is an additive overlay and must not restructure the current pages

---

## Execution rules

- Complete one block fully before starting the next
- Do not skip validation at the end of a block
- Do not leave a partially wired realtime flow in a “done” block
- Keep schema, RLS, API, and UI behavior aligned at all times
- Treat this file as the active implementation roadmap for the feature
- Update this file if scope changes

---

## Architecture overview

### Main moving parts

1. **Supabase schema**
   - `team_messages`
   - RLS policies
   - index on `team_id`

2. **Server API**
   - `GET /api/teams/[teamId]/messages`
   - `POST /api/teams/[teamId]/messages`

3. **Global UI**
   - `ChatWidget`
   - `ChatWindow`
   - `ChatBubbleButton`
   - global open/minimized state

4. **Realtime**
   - Supabase channel subscription filtered by `team_id`
   - unread counter logic
   - browser tab visibility handling

5. **Conditional display**
   - render only for authenticated users with an active team

---

## Block 1 — Data model and security

### Goal

Create the chat message persistence layer with safe access control.

### Tasks

1. Add a new `team_messages` table to Supabase with:
   - `id uuid primary key default gen_random_uuid()`
   - `team_id uuid not null references public.teams(id) on delete cascade`
   - `user_id uuid not null references public.profiles(id) on delete cascade`
   - `content text not null`
   - `created_at timestamptz not null default now()`
2. Add an index on `team_id`
3. Enable RLS on `team_messages`
4. Add `SELECT` policy:
   - user must belong to that team
5. Add `INSERT` policy:
   - user must be an active member of that team
6. Update generated or maintained TypeScript database types if needed
7. Keep the SQL file in repo as the source of truth for the new policies

### Done when

- `team_messages` exists in SQL
- `SELECT` is blocked for non-members
- `INSERT` is blocked for non-members
- Active team members can read and write messages
- Repo SQL reflects the final intended live state

---

## Block 2 — Server-side message API

### Goal

Expose a safe team-scoped message API for loading and sending messages.

### Tasks

1. Create route:
   - `/api/teams/[teamId]/messages`
2. Implement `GET`:
   - authenticate user
   - verify user belongs to `teamId`
   - fetch the latest 50 messages
   - sort ascending by `created_at`
3. Implement `POST`:
   - authenticate user
   - verify user belongs to `teamId`
   - validate non-empty `content`
   - insert message with `team_id`, `user_id`, `content`
4. Return clear errors for:
   - unauthenticated
   - unauthorized
   - invalid payload
   - server failure
5. Keep API behavior minimal and predictable

### Done when

- Team members can load the last 50 messages
- Team members can send a message successfully
- Non-members cannot read or write messages
- Route responses are stable and explicit

---

## Block 3 — Global chat state and mounting

### Goal

Mount the floating chat globally and keep its state stable across route changes.

### Tasks

1. Create a global chat UI state store:
   - React Context or Zustand
   - `isOpen`
   - `unreadCount`
   - helpers to open, minimize, increment unread, reset unread
2. Mount `ChatWidget` in the global layout for the authenticated app shell
3. Ensure the widget uses `fixed` positioning at the bottom-right
4. Keep the widget mounted while navigating between authenticated pages
5. Do not render the widget for users without an active team
6. Keep the overlay independent from page content

### Done when

- The widget persists across route changes
- Open/minimized state survives page changes within the session
- Users without an active team see no chat widget at all

---

## Block 4 — Chat UI components

### Goal

Build the full chat interface with compact, production-style UX.

### Tasks

1. Create `ChatWidget`
   - root orchestrator
   - open/minimized rendering switch
   - unread badge handling
2. Create `ChatWindow`
   - fixed panel near `360x480`
   - header
   - minimize button
   - scrollable messages area
   - input row with send button
3. Create `ChatBubbleButton`
   - circular floating button
   - chat icon
   - unread badge
4. Message item behavior:
   - current user aligned right
   - others aligned left
   - current user uses accent styling
   - others use neutral grey styling
   - show avatar, display name, content, timestamp
5. Add empty state:
   - “No messages yet, say hello to your team!”
6. Add loading state
7. Add send error state with compact visual feedback
8. Add smooth scale/fade transition between minimized and open states

### Done when

- The widget is visually complete
- Open/minimized states feel smooth
- The panel is compact and consistent with the rest of the workspace

---

## Block 5 — Realtime subscription and unread logic

### Goal

Keep the chat live at all times and make unread counts trustworthy.

### Tasks

1. Subscribe to Supabase Realtime on `team_messages`
2. Filter realtime events by `team_id`
3. Keep the subscription active whenever:
   - the user is authenticated
   - the user belongs to an active team
4. Load initial messages through the API
5. Append new messages live when received
6. Auto-scroll to bottom when appropriate
7. Increment unread count when:
   - widget is minimized
   - or browser tab is not active
8. Reset unread count when the widget is reopened
9. Avoid double-inserting messages between initial load, POST result, and realtime event
10. Unsubscribe cleanly on teardown or team change

### Done when

- New messages appear in real time
- Unread badge increments reliably
- Reopening the chat resets unread count
- No duplicate message rendering occurs

---

## Block 6 — Team-aware behavior and integration

### Goal

Tie the chat to the real authenticated workspace state.

### Tasks

1. Reuse existing team membership state where possible
2. Detect the user’s active team from the authenticated workspace context/snapshot
3. Ensure only one team chat is active at a time for the current active team
4. Show team context in header:
   - team name
   - optional member avatars/initials if practical
5. Keep behavior stable if:
   - user has no team
   - user has a cancelled team
   - team exists but no messages exist yet
6. Keep the rest of the app unchanged

### Done when

- The widget only appears in valid team contexts
- The header reflects the current team
- No page-specific coupling leaks into the widget

---

## Block 7 — Final polish and validation

### Goal

Make the feature solid enough to merge and demo.

### Tasks

1. Verify message sending end to end
2. Verify realtime receiving end to end
3. Verify minimized/open transitions
4. Verify unread badge behavior:
   - minimized
   - browser tab inactive
   - reopen reset
5. Verify authenticated user without team sees nothing
6. Verify responsive behavior of the floating panel
7. Run lint
8. Run production build
9. Keep SQL instructions ready for manual Supabase application if required

### Done when

- Chat works across route changes
- Realtime is stable
- Security is correct
- Build and lint pass

---

## Recommended implementation order

1. Block 1 — Data model and security
2. Block 2 — Server-side message API
3. Block 3 — Global chat state and mounting
4. Block 4 — Chat UI components
5. Block 5 — Realtime subscription and unread logic
6. Block 6 — Team-aware behavior and integration
7. Block 7 — Final polish and validation

---

## Current status

- Block 1 — Data model and security: **completed**
- Block 2 — Server-side message API: **completed**
- Block 3 — Global chat state and mounting: **completed**
- Block 4 — Chat UI components: **completed**
- Block 5 — Realtime subscription and unread logic: **completed**
- Block 6 — Team-aware behavior and integration: **completed**
- Block 7 — Final polish and validation: **in progress**

## Next active block

- **Block 7 — Final polish and validation**
