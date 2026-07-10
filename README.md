# Junior Dev Team Projects

Plateforme web qui aide les développeurs juniors à former une équipe, construire un vrai projet sur GitHub et créer une preuve crédible de collaboration pour leur CV.

## Objectif

Aider les développeurs juniors à montrer plus que des projets solo :

- travail en équipe ;
- Git/GitHub ;
- pull requests ;
- contribution réelle ;
- projet terminé ;
- rôle clair dans une équipe.

## MVP

Fonctionnalités principales :

- Authentification avec GitHub
- Création d’un profil développeur
- File de matchmaking
- Création d’équipe
- Création d’un projet lié à une équipe
- Ajout manuel du repo GitHub
- Page équipe/projet
- `publicProfile` pour afficher les projets terminés d’un utilisateur

## Règle importante

Une équipe correspond toujours à un seul projet.

```txt
1 team = 1 project
1 project = 1 team
```

Même si les mêmes membres veulent faire un nouveau projet, une nouvelle équipe doit être créée.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- GitHub Auth
- Vercel

## Structure

```txt
src/
  app/
    api/
    dashboard/
    matchmaking/
    teams/
    publicProfile/

  components/
  lib/
  services/
  hooks/
  constants/
```

## Base de données

Tables principales :

```txt
profiles
matchmaking_queue
teams
team_members
projects
project_members
```

Relation importante :

```txt
projects.team_id UNIQUE
```

Cela garantit qu’une équipe ne peut avoir qu’un seul projet.

## GitHub

Pour le MVP, la plateforme ne crée pas automatiquement les repos GitHub.

Chaque équipe crée son propre repo GitHub, puis ajoute le lien dans la plateforme.

## Développement local

```bash
npm install
npm run dev
```

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_EMAILS=
```

Production GitHub OAuth callback should point to:

```txt
{NEXT_PUBLIC_SITE_URL}/
```

Ne jamais envoyer `.env.local` sur GitHub.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run start
```

## Priorité MVP

Valider que des développeurs juniors veulent réellement rejoindre une équipe, construire un projet et terminer quelque chose qu’ils peuvent montrer sur leur CV.
