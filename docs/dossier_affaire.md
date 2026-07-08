# Dossier d’affaires

## Plateforme de collaboration pour développeurs juniors

## 1. Résumé exécutif

Le projet consiste à créer une plateforme web permettant à des développeurs juniors, étudiants, autodidactes ou diplômés de bootcamps de former de petites équipes afin de réaliser des projets concrets en collaboration.

Le problème principal visé est le manque d’expérience pratique crédible chez les développeurs juniors. Beaucoup possèdent des connaissances techniques, mais peinent à démontrer leur capacité à travailler en équipe, à utiliser GitHub de manière professionnelle, à gérer des tâches, à collaborer sur des pull requests et à terminer un projet complet.

La solution proposée est une plateforme qui permet aux utilisateurs de créer un profil développeur, d’entrer dans un système de matchmaking, de rejoindre une équipe, de construire un projet réel sur GitHub, puis d’obtenir une page portfolio partageable mettant en valeur leur contribution.

L’objectif du MVP est de valider une hypothèse simple : les développeurs juniors veulent-ils réellement rejoindre une plateforme qui les aide à terminer des projets d’équipe crédibles pour enrichir leur CV et leur portfolio ?

Le MVP sera initialement gratuit afin de faciliter l’adoption, de récolter des retours utilisateurs et de construire une première communauté active.

---

## 2. Problème identifié

Les développeurs juniors rencontrent souvent un obstacle majeur lorsqu’ils cherchent leur premier emploi : ils n’ont pas assez d’expérience concrète à montrer.

Les projets personnels sont utiles, mais ils ne prouvent pas toujours certaines compétences recherchées en entreprise, comme :

* la collaboration en équipe ;
* l’utilisation professionnelle de Git et GitHub ;
* la gestion des branches ;
* les pull requests ;
* les revues de code ;
* la communication technique ;
* la division des tâches ;
* la capacité à livrer un projet complet ;
* la constance sur plusieurs semaines.

En parallèle, construire seul est difficile. Beaucoup de juniors commencent des projets, mais ne les terminent pas. Ils perdent la motivation, manquent de structure ou n’ont personne avec qui avancer.

Le problème n’est donc pas seulement de “trouver des coéquipiers”. Le vrai problème est :

> Les développeurs juniors ont besoin de preuves crédibles de collaboration et de réalisation de projets concrets pour améliorer leur employabilité.

---

## 3. Public cible

La plateforme cible principalement :

* les développeurs juniors sans expérience professionnelle ;
* les étudiants en informatique ;
* les diplômés de bootcamps ;
* les autodidactes ;
* les personnes en reconversion vers le développement logiciel ;
* les développeurs qui veulent enrichir leur portfolio GitHub ;
* les candidats qui veulent montrer des projets d’équipe sur leur CV.

Le profil type de l’utilisateur est une personne qui connaît déjà les bases du développement, mais qui manque d’expérience pratique, de projets terminés et de preuves concrètes de collaboration.

---

## 4. Solution proposée

La solution est une plateforme web de matchmaking et de suivi de projets collaboratifs.

Le fonctionnement est simple :

1. L’utilisateur se connecte avec GitHub.
2. Il complète son profil développeur.
3. Il indique ses compétences, ses disponibilités, son niveau et ses objectifs.
4. Il rejoint une file de matchmaking.
5. La plateforme forme une petite équipe de développeurs compatibles.
6. L’équipe choisit elle-même le projet à construire.
7. L’équipe crée son propre dépôt GitHub.
8. Le lien du dépôt est ajouté dans la plateforme.
9. Les membres construisent le projet ensemble pendant une période définie.
10. À la fin, chaque membre obtient une page portfolio avec le projet, son rôle et sa contribution.

La plateforme ne remplace pas GitHub. Elle agit comme une couche d’organisation, de mise en relation, de suivi et de valorisation du travail.

---

## 5. Proposition de valeur

Pour les développeurs juniors, la plateforme permet de :

* trouver des coéquipiers sérieux ;
* travailler sur un vrai projet d’équipe ;
* obtenir une expérience plus proche du monde professionnel ;
* enrichir son GitHub ;
* améliorer son CV ;
* créer une page portfolio crédible ;
* démontrer ses compétences de collaboration ;
* rester motivé grâce à une équipe ;
* répéter l’expérience avec plusieurs projets.

Pour les recruteurs, à terme, la plateforme pourrait permettre de voir des candidats avec des preuves concrètes de contribution, au lieu de simples projets personnels isolés.

Pour les écoles, bootcamps ou communautés tech, la plateforme pourrait servir d’outil de mise en pratique et de suivi de projets collaboratifs.

---

## 6. Différenciation

Le projet se distingue d’un hackathon classique.

Un hackathon est souvent court, intense et orienté prototype. Ici, l’objectif est différent :

* les projets se construisent sur plusieurs semaines ;
* les équipes sont petites ;
* le rythme est plus réaliste ;
* l’objectif est de terminer un projet présentable ;
* l’expérience est répétable ;
* la valeur principale est la preuve de collaboration.

Le projet ne se limite pas non plus à un simple Discord ou groupe de discussion. La plateforme structure l’expérience autour du profil, du matchmaking, de l’équipe, du projet, du suivi et du portfolio final.

---

## 7. MVP proposé

Le MVP doit rester simple. Il ne doit pas chercher à tout automatiser dès le départ.

Les fonctionnalités essentielles sont :

### 7.1 Authentification GitHub

L’utilisateur doit pouvoir se connecter avec son compte GitHub.

Cela permet de lier directement son identité développeur à la plateforme.

### 7.2 Profil développeur

Après connexion, l’utilisateur complète son profil :

* nom ou pseudo ;
* lien GitHub ;
* niveau ;
* technologies principales ;
* objectif ;
* disponibilité hebdomadaire ;
* langue ;
* fuseau horaire ;
* type de projet souhaité.

### 7.3 File de matchmaking

L’utilisateur peut cliquer sur un bouton pour rejoindre la file de matchmaking.

Au début, le matchmaking peut être manuel ou semi-manuel. Il n’est pas nécessaire de développer un algorithme complexe immédiatement.

### 7.4 Formation d’équipe

L’administrateur ou la plateforme crée une équipe de 3 à 5 personnes selon :

* disponibilité ;
* stack technique ;
* langue ;
* niveau ;
* objectif ;
* motivation.

### 7.5 Page équipe

Chaque équipe dispose d’une page avec :

* les membres ;
* les rôles ;
* le statut de l’équipe ;
* le projet associé ;
* les prochaines étapes ;
* le lien du dépôt GitHub.

### 7.6 Création de projet

L’équipe peut définir :

* le nom du projet ;
* la description ;
* la stack ;
* les objectifs ;
* la durée prévue ;
* le lien GitHub du repo ;
* les rôles des membres.

### 7.7 Gestion du dépôt GitHub

Pour le MVP, chaque équipe crée son propre dépôt GitHub.

La plateforme ne crée pas automatiquement les repos et ne gère pas les permissions GitHub au début.

La plateforme stocke simplement :

* l’URL du repo ;
* le nom du projet ;
* les membres ;
* les rôles ;
* le statut du projet.

### 7.8 Page portfolio

À la fin du projet, chaque membre obtient une page publique partageable contenant :

* le projet terminé ;
* son rôle ;
* les technologies utilisées ;
* le lien GitHub ;
* la description du projet ;
* les membres de l’équipe ;
* un résumé de sa contribution.

Cette page représente la valeur principale du MVP.

---

## 8. Gestion des dépôts GitHub

Pour la première version, il est recommandé de ne pas créer d’organisation GitHub centrale.

Chaque équipe doit créer son propre dépôt GitHub sur le compte d’un des membres ou dans une organisation qu’elle contrôle.

Avantages :

* plus simple à mettre en place ;
* moins de responsabilités pour la plateforme ;
* les utilisateurs gardent le contrôle de leur code ;
* les contributions apparaissent naturellement sur leur GitHub ;
* aucune gestion complexe de permissions au départ.

La plateforme doit simplement demander aux utilisateurs de coller le lien du dépôt GitHub.

Plus tard, une intégration GitHub plus avancée pourra être ajoutée :

* GitHub OAuth ;
* GitHub App ;
* lecture des commits ;
* lecture des pull requests ;
* suivi des issues ;
* vérification automatique des contributions ;
* création automatique de repos ;
* gestion d’une organisation officielle.

Pour le MVP, cette complexité est volontairement évitée.

---

## 9. Gestion des conflits entre membres

Comme les projets sont collaboratifs, il peut y avoir des conflits entre participants.

Les risques possibles sont :

* un membre abandonne le projet ;
* un membre ne contribue pas ;
* un membre retire les droits GitHub à un autre ;
* désaccord sur la direction du projet ;
* conflit sur la propriété du code ;
* déséquilibre dans les contributions.

Pour le MVP, la plateforme doit prévoir des règles simples :

1. Chaque équipe doit définir dès le départ qui possède le dépôt GitHub.
2. Les membres doivent accepter une charte de collaboration.
3. La plateforme doit afficher clairement que la gestion des droits GitHub appartient à l’équipe.
4. Un membre peut signaler un problème.
5. Un administrateur peut intervenir manuellement.
6. Les projets abandonnés peuvent être marqués comme incomplets.
7. Les membres sérieux peuvent conserver une bonne réputation sur la plateforme.

À long terme, un système de réputation pourra être ajouté pour encourager les bons comportements.

---

## 10. Modèle économique potentiel

Le MVP doit être gratuit au départ.

L’objectif initial n’est pas de maximiser les revenus, mais de valider :

* l’existence du problème ;
* l’intérêt des utilisateurs ;
* leur engagement ;
* leur capacité à terminer des projets ;
* la valeur de la page portfolio.

Une fois la communauté construite, plusieurs modèles de revenus sont possibles.

### 10.1 Abonnement premium pour développeurs

Les utilisateurs pourraient payer pour obtenir :

* matchmaking prioritaire ;
* accès à des équipes plus sérieuses ;
* projets mieux structurés ;
* portfolio avancé ;
* statistiques de contribution ;
* badges de fiabilité ;
* recommandations de projet ;
* accompagnement CV/portfolio.

### 10.2 Projets encadrés

La plateforme pourrait proposer des projets guidés avec :

* cahier des charges ;
* roadmap ;
* tâches pré-définies ;
* mentor ;
* revue de code ;
* livrables attendus.

Ce modèle ne remplace pas la liberté des équipes de créer leurs propres projets. Il ajoute simplement une option plus structurée pour ceux qui veulent être accompagnés.

### 10.3 Accès recruteurs

À terme, les recruteurs pourraient payer pour accéder à des profils de développeurs ayant terminé des projets collaboratifs.

La valeur pour eux serait de repérer des candidats capables de travailler en équipe, pas seulement des candidats avec des projets personnels.

### 10.4 Partenariats écoles et bootcamps

Les écoles, bootcamps ou organismes de formation pourraient utiliser la plateforme pour permettre à leurs étudiants de faire des projets inter-écoles ou inter-cohortes.

Le modèle pourrait être :

* abonnement par établissement ;
* accès à un tableau de bord ;
* suivi des projets ;
* suivi des contributions ;
* portfolio automatique pour les étudiants.

---

## 11. Stack technique recommandée

Pour la version web, la stack recommandée est :

* Next.js ;
* TypeScript ;
* Tailwind CSS ;
* shadcn/ui ;
* Supabase ;
* GitHub Auth ;
* Vercel.

### 11.1 Frontend

Next.js servira à construire l’interface web :

* landing page ;
* connexion ;
* dashboard ;
* profil développeur ;
* page équipe ;
* page projet ;
* page portfolio.

### 11.2 Backend

Next.js servira aussi à créer les routes API backend.

L’approche recommandée est API-first, afin de pouvoir réutiliser le backend plus tard avec une application mobile.

Exemples de routes :

* `/api/users`;
* `/api/profiles`;
* `/api/matchmaking`;
* `/api/teams`;
* `/api/projects`;
* `/api/portfolio`.

### 11.3 Base de données

Supabase sera utilisé pour :

* l’authentification ;
* la base PostgreSQL ;
* les profils ;
* les équipes ;
* les projets ;
* la file de matchmaking ;
* les rôles ;
* les statuts.

### 11.4 Mobile plus tard

Lorsque la version mobile sera développée, elle pourra utiliser :

* Expo React Native ;
* TypeScript ;
* les mêmes routes API ;
* la même base Supabase ;
* les mêmes types partagés si le projet est bien structuré.

---

## 12. Structure de données initiale

Les tables principales pourraient être :

### profiles

Contient les informations du développeur.

Champs possibles :

* id ;
* user_id ;
* github_username ;
* avatar_url ;
* display_name ;
* level ;
* bio ;
* preferred_stack ;
* availability_per_week ;
* language ;
* timezone ;
* goal ;
* created_at.

### matchmaking_queue

Contient les utilisateurs en attente d’équipe.

Champs possibles :

* id ;
* user_id ;
* preferred_stack ;
* availability_per_week ;
* goal ;
* language ;
* status ;
* created_at.

### teams

Contient les équipes créées.

Champs possibles :

* id ;
* name ;
* status ;
* created_at ;
* created_by.

### team_members

Associe les utilisateurs aux équipes.

Champs possibles :

* id ;
* team_id ;
* user_id ;
* role ;
* status ;
* joined_at.

### projects

Contient les projets créés par les équipes.

Champs possibles :

* id ;
* team_id ;
* name ;
* description ;
* stack ;
* github_repo_url ;
* status ;
* start_date ;
* end_date ;
* created_at.

### project_members

Décrit le rôle de chaque membre dans le projet.

Champs possibles :

* id ;
* project_id ;
* user_id ;
* project_role ;
* contribution_summary.

---

## 13. Parcours utilisateur MVP

Le parcours utilisateur doit être très simple.

### Étape 1 : Arrivée sur la landing page

L’utilisateur comprend rapidement :

* le problème ;
* la solution ;
* le fonctionnement ;
* la valeur pour son CV ;
* le bouton d’inscription.

### Étape 2 : Connexion avec GitHub

L’utilisateur se connecte avec GitHub.

### Étape 3 : Création du profil

Il complète ses informations :

* niveau ;
* stack ;
* disponibilité ;
* objectif ;
* langue ;
* type de projet recherché.

### Étape 4 : Rejoindre le matchmaking

Il clique sur “Join matchmaking”.

### Étape 5 : Formation de l’équipe

Au début, l’équipe peut être formée manuellement par l’administrateur.

### Étape 6 : Définition du projet

L’équipe choisit un projet, définit la stack et ajoute le lien GitHub.

### Étape 7 : Collaboration

L’équipe travaille ensemble sur GitHub.

### Étape 8 : Finalisation

Le projet est marqué comme terminé.

### Étape 9 : Portfolio

Chaque membre obtient une page projet partageable.

---

## 14. Indicateurs de succès

Pour savoir si le MVP fonctionne, il faut suivre certains indicateurs.

### Indicateurs d’intérêt

* nombre d’inscriptions ;
* nombre de profils complétés ;
* nombre d’utilisateurs qui rejoignent le matchmaking ;
* nombre d’utilisateurs qui reviennent après inscription.

### Indicateurs d’engagement

* nombre d’équipes créées ;
* nombre de projets créés ;
* nombre de dépôts GitHub ajoutés ;
* nombre de projets actifs ;
* nombre de membres qui participent réellement.

### Indicateurs de réussite

* nombre de projets terminés ;
* pourcentage d’équipes qui terminent un projet ;
* nombre de pages portfolio générées ;
* nombre d’utilisateurs qui veulent refaire un projet ;
* nombre de recommandations ou invitations.

Le KPI le plus important au départ est :

> Le pourcentage d’équipes qui terminent réellement un projet.

Si les utilisateurs s’inscrivent mais ne terminent rien, la plateforme ne résout pas encore le problème principal.

---

## 15. Risques principaux

### 15.1 Abandon des membres

C’est probablement le plus grand risque.

Certains utilisateurs peuvent rejoindre une équipe puis disparaître.

Solutions possibles :

* petites équipes ;
* durée de projet courte ;
* disponibilité affichée ;
* système de réputation ;
* remplacement manuel ;
* statut actif/inactif ;
* rappel par email.

### 15.2 Qualité faible des projets

Les équipes peuvent choisir des projets trop vagues ou trop ambitieux.

Solutions possibles :

* guide de choix de projet ;
* exemples de projets ;
* modèle de cahier des charges ;
* checklist de lancement ;
* validation manuelle au début.

### 15.3 Manque d’utilisateurs

Au début, il peut être difficile de former des équipes rapidement.

Solutions possibles :

* commencer avec une communauté Reddit, Discord ou LinkedIn ;
* créer une liste d’attente ;
* former les premières équipes manuellement ;
* organiser des cohortes ;
* limiter les stacks au départ.

### 15.4 Conflits entre membres

Les conflits peuvent nuire à l’expérience.

Solutions possibles :

* charte de collaboration ;
* règles claires ;
* possibilité de signaler un problème ;
* intervention manuelle ;
* réputation utilisateur.

### 15.5 Trop de fonctionnalités trop tôt

Le projet peut devenir trop complexe si l’on ajoute immédiatement :

* chat intégré ;
* GitHub App ;
* paiements ;
* IA ;
* mobile ;
* recruteurs ;
* certifications.

Solution :

* rester concentré sur le MVP ;
* tester la valeur principale ;
* développer progressivement.

---

## 16. Stratégie de lancement

Le lancement doit être communautaire et manuel.

### Phase 1 : Validation

Objectif : parler à 10 à 30 développeurs juniors.

Questions à poser :

* Est-ce que tu as du mal à trouver des projets crédibles pour ton CV ?
* Est-ce que tu préfères construire seul ou en équipe ?
* As-tu déjà abandonné un projet personnel ?
* Est-ce qu’un projet d’équipe GitHub t’aiderait dans ta recherche d’emploi ?
* Qu’est-ce qui te ferait peur dans ce type de plateforme ?
* Combien d’heures par semaine pourrais-tu consacrer à un projet ?
* Est-ce que tu utiliserais cette plateforme gratuitement ?
* Qu’est-ce qui te ferait payer plus tard ?

### Phase 2 : Première cohorte

Objectif : former 2 ou 3 équipes manuellement.

Chaque équipe devrait avoir :

* 3 à 5 membres ;
* une durée claire ;
* un projet simple ;
* un repo GitHub ;
* une page projet ;
* un suivi minimal.

### Phase 3 : Amélioration

Après la première cohorte, il faut analyser :

* ce qui a fonctionné ;
* ce qui a bloqué ;
* qui a abandonné ;
* pourquoi certains ont continué ;
* ce qui manque dans la plateforme ;
* ce que les utilisateurs veulent vraiment.

### Phase 4 : Automatisation

Une fois le processus manuel validé, la plateforme peut automatiser :

* la formation d’équipes ;
* les rappels ;
* les suggestions de projets ;
* les statuts ;
* les pages portfolio ;
* la réputation.

---

## 17. Roadmap proposée

### Version 0.1 — MVP interne

* Landing page ;
* GitHub Auth ;
* profil développeur ;
* file de matchmaking ;
* création manuelle d’équipe ;
* page équipe ;
* création projet ;
* ajout lien GitHub ;
* page portfolio simple.

### Version 0.2 — Première cohorte

* emails de notification ;
* statut des projets ;
* formulaire de feedback ;
* règles de collaboration ;
* signalement de problème ;
* amélioration du dashboard.

### Version 0.3 — Matchmaking semi-automatique

* matching par stack ;
* matching par disponibilité ;
* matching par langue ;
* matching par objectif ;
* tableau admin.

### Version 0.4 — Preuve de contribution

* résumé de contribution ;
* rôle dans le projet ;
* historique de projet ;
* badges simples ;
* page portfolio améliorée.

### Version 1.0 — Lancement public

* inscription ouverte ;
* onboarding complet ;
* matchmaking plus automatisé ;
* portfolio public ;
* communauté ;
* premières options premium à tester.

---

## 18. Positionnement

Le positionnement recommandé est :

> Une plateforme qui aide les développeurs juniors à construire des projets d’équipe réels, visibles sur GitHub, afin de créer une preuve crédible de collaboration pour leur CV.

Message simple :

> Stop building alone. Join a team, build a real project, and show credible teamwork experience on your resume.

En français :

> Arrête de construire seul. Rejoins une équipe, développe un vrai projet et montre une expérience de collaboration crédible sur ton CV.

---

## 19. Conclusion

Ce projet répond à un problème réel chez les développeurs juniors : le manque de preuves concrètes d’expérience collaborative.

L’idée est pertinente, mais son succès dépendra moins de la technologie que de la capacité à faire terminer des projets aux utilisateurs.

Le MVP doit donc se concentrer sur une seule promesse :

> Aider des développeurs juniors à terminer un vrai projet d’équipe qu’ils peuvent fièrement montrer sur leur CV.

Pour y arriver, il faut éviter de surdévelopper trop tôt. La première version doit être simple, gratuite, manuelle lorsque nécessaire, et centrée sur la validation terrain.

La priorité est de former quelques équipes, observer leur comportement, comprendre les blocages, puis améliorer progressivement la plateforme.

La technologie recommandée est Next.js, TypeScript, Supabase, GitHub Auth et Vercel, avec une structure API-first pour permettre une future version mobile.

Le projet a un potentiel intéressant s’il réussit à transformer une simple mise en relation entre développeurs en une véritable preuve de collaboration professionnelle.
