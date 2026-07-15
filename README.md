# CodeParty

CodeParty matches junior developers into focused parties, gives each party a shared workspace and turns completed projects into public portfolio proof.

## MVP features

- GitHub authentication through Supabase Auth
- Bilingual English/French onboarding and application UI
- Profile-based matchmaking queue with admin party creation
- One active party per user, with completed and cancelled party history
- Party workspace with members, public GitHub repository and realtime team chat
- Member completion requests with admin approval or rejection
- Public automated portfolio with completed projects and optional PDF resume
- Responsive light and dark themes

## Stack

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS and shadcn/ui
- Supabase Auth, Postgres, Storage, RLS and Realtime
- GitHub OAuth and public repository validation
- Vercel-ready production build

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com
```

Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Quality checks

```bash
npm run check
npm run build:webpack
```

## Deployment

Use `docs/mvp-release-readiness.md` as the release checklist. Apply the required SQL files in the documented order before deploying the web application.
