"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, GitBranch, Loader2, Users, type LucideIcon } from "lucide-react";

import { FeedbackBanner } from "@/components/app/feedback";
import { useLanguage } from "@/components/app/language-provider";
import { Mascot } from "@/components/app/mascot";
import { useWorkspaceProfile } from "@/components/app/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useWorkspaceSnapshot, type WorkspaceSnapshot } from "@/lib/workspace-data";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

type RepositoryListItem = {
  id: string;
  repoUrl: string;
  repoLabel: string;
  partyId: string;
  projectName: string;
  createdAt: string;
};

type SuggestedAction = {
  badge?: string | null;
  title: string;
  description: string;
  ctaLabel?: string | null;
  href?: string | null;
};

export default function DashboardPage() {
  const profile = useWorkspaceProfile();
  const { language } = useLanguage();
  const { snapshot, isLoading, errorMessage } = useWorkspaceSnapshot(profile.id);
  const [repositories, setRepositories] = useState<RepositoryListItem[]>([]);
  const [repositoriesLoading, setRepositoriesLoading] = useState(true);
  const [repositoriesError, setRepositoriesError] = useState<string | null>(null);

  const activeCurrentTeam =
    snapshot?.currentTeam?.status === "active" ? snapshot.currentTeam : null;
  const teamCount = activeCurrentTeam ? snapshot?.teamMembers.length ?? 0 : 0;

  useEffect(() => {
    let mounted = true;

    async function loadRepositories() {
      const supabase = getSupabaseBrowserClient();

      setRepositoriesLoading(true);
      setRepositoriesError(null);

      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .not("github_repo_url", "is", null)
        .order("created_at", { ascending: false });

      if (!mounted) {
        return;
      }

      if (projectsError) {
        setRepositories([]);
        setRepositoriesError(projectsError.message);
        setRepositoriesLoading(false);
        return;
      }

      const projectRows = (projects ?? []) as ProjectRow[];
      const teamIds = [...new Set(projectRows.map((project) => project.team_id))];

      if (teamIds.length === 0) {
        setRepositories([]);
        setRepositoriesLoading(false);
        return;
      }

      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .in("id", teamIds);

      if (!mounted) {
        return;
      }

      if (teamsError) {
        setRepositories([]);
        setRepositoriesError(teamsError.message);
        setRepositoriesLoading(false);
        return;
      }

      const teamsById = new Map(
        ((teams ?? []) as TeamRow[]).map((team) => [team.id, team.party_id] as const)
      );

      setRepositories(
        projectRows.map((project) => ({
          id: project.id,
          repoUrl: project.github_repo_url ?? "",
          repoLabel: getRepoLabel(project.github_repo_url ?? ""),
          partyId: teamsById.get(project.team_id) ?? (language === "fr" ? "Inconnu" : "Unknown"),
          projectName: project.name,
          createdAt: project.created_at,
        }))
      );
      setRepositoriesLoading(false);
    }

    void loadRepositories();

    return () => {
      mounted = false;
    };
  }, [language]);

  const suggestedAction = getDashboardSuggestedAction(snapshot, language);

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none dark:bg-[linear-gradient(135deg,#6d5ce8_0%,#5f50d2_100%)]">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
                {language === "fr"
                  ? `Bon retour, ${profile.display_name}`
                  : `Welcome back, ${profile.display_name}`}
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-base leading-7 text-white/82">
                {language === "fr"
                  ? "Gardez le contexte de votre équipe et vos repositories liés au même endroit."
                  : "Keep your team context and linked repositories visible in one place."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {errorMessage ? <FeedbackBanner tone="error" message={errorMessage} /> : null}

      <Card className="border border-[#ece8f8] bg-white shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
        <CardHeader>
          {suggestedAction.badge ? (
            <Badge
              variant="outline"
              className="w-fit rounded-full bg-[#f6f2ff] text-[#7650ff] dark:border-[#27272f] dark:bg-[#23232c] dark:text-[#a698ff]"
            >
              {suggestedAction.badge}
            </Badge>
          ) : null}
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
              {suggestedAction.title}
            </CardTitle>
              <CardDescription className="text-sm leading-6 text-app-secondary">
              {suggestedAction.description}
              </CardDescription>
            </div>
            <Mascot pose="encouragement" size="md" className="shrink-0" />
          </div>
        </CardHeader>
        {suggestedAction.ctaLabel && suggestedAction.href ? (
          <CardContent>
            <Link
              href={suggestedAction.href}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#947cff_100%)] px-5 text-sm font-medium text-white transition hover:opacity-95"
            >
              {suggestedAction.ctaLabel}
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-4">
        <StatCard
          title={language === "fr" ? "Équipe actuelle" : "Current team"}
          value={activeCurrentTeam ? `Party ${activeCurrentTeam.party_id}` : language === "fr" ? "Aucun party actif" : "No active party"}
          description={
            activeCurrentTeam
              ? `${teamCount} ${language === "fr" ? "membres" : "members"} · ${formatLabel(activeCurrentTeam.status, language)}`
              : language === "fr"
                ? "Vous n’appartenez actuellement à aucun party actif."
                : "You do not currently belong to an active party."
          }
          icon={Users}
          loading={isLoading}
        />
      </div>

      <Card className="border border-[#ece8f8] bg-white shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
        <CardHeader>
          <Badge variant="outline" className="w-fit rounded-full bg-[#f6f2ff] text-[#7650ff] dark:border-[#27272f] dark:bg-[#23232c] dark:text-[#a698ff]">
            {language === "fr" ? "Repos projet" : "Project repos"}
          </Badge>
          <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
            {language === "fr" ? "Repositories partagés" : "Shared repositories"}
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-app-secondary">
            {language === "fr"
              ? "Parcourez tous les repositories GitHub visibles, avec les projets les plus récents en premier."
              : "Browse every visible GitHub repository, with the most recent projects first."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {repositoriesError ? <FeedbackBanner tone="error" message={repositoriesError} /> : null}

          <div className="rounded-[1.1rem] bg-[#faf8ff] p-2.5 dark:bg-[#16161d]">
            {repositoriesLoading ? (
              <div className="flex min-h-28 items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-app-secondary">
                  <Loader2 className="size-4 animate-spin text-[#7650ff]" />
                  {language === "fr" ? "Chargement des repositories..." : "Loading repositories..."}
                </div>
              </div>
            ) : repositories.length === 0 ? (
              <div className="flex min-h-28 items-center justify-center text-center">
                <div className="max-w-sm">
                  <Mascot pose="sad" size="md" centered className="mb-3" />
                  <p className="text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">
                    {language === "fr" ? "Aucun repository lié pour le moment." : "No linked repositories yet."}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-app-secondary">
                    {language === "fr"
                      ? "Les repositories apparaissent ici une fois qu’une équipe crée un projet et lie son URL GitHub."
                      : "Repositories appear here once a team creates a project and links its GitHub URL."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-h-[22rem] space-y-1.5 overflow-y-auto pr-1">
                {repositories.map((repository) => (
                  <div
                    key={repository.id}
                    className="rounded-[0.95rem] border border-[#ece8f8] bg-white px-3 py-2.5 dark:border-[#27272f] dark:bg-[#1a1a22]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-app-overline">
                          Party {repository.partyId}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">
                          {repository.projectName}
                        </p>
                        <a
                          href={repository.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 block truncate text-sm text-[#5b45d9] underline-offset-4 hover:underline"
                        >
                          {repository.repoLabel}
                        </a>
                      </div>

                      <div className="shrink-0 rounded-full bg-[#f6f2ff] px-2 py-0.5 text-[10px] font-medium text-[#7650ff] dark:bg-[#23232c] dark:text-[#a698ff]">
                        {formatDate(repository.createdAt)}
                      </div>
                    </div>

                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-app-secondary">
                      <GitBranch className="size-3 text-[#7650ff]" />
                      <span>{language === "fr" ? "Ouvrir le repository" : "Open repository"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[#ece8f8] bg-white shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
        <CardHeader>
          <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
            {language === "fr" ? "Mes parties" : "My Parties"}
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-app-secondary">
            {language === "fr"
              ? "Gardez vos parties actives et passées près de votre liste de repositories."
              : "Keep your active and past parties close to your project repository list."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {snapshot?.allTeams.length ? (
            <div className="rounded-[1rem] border border-[#ece8f8] bg-[#fcfbff] dark:border-[#27272f] dark:bg-[#16161d]">
              {snapshot.allTeams.map((party) => (
                <Link
                  key={party.id}
                  href={`/workspace?party=${party.id}`}
                  className="flex items-center justify-between gap-3 border-b px-4 py-3 transition hover:bg-[#faf8ff] dark:border-[#27272f] dark:hover:bg-[#1a1a22] last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">Party {party.party_id}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getPartyStatusClasses(party.status)}`}>
                        {formatPartyStatus(party.status, language)}
                      </span>
                      <span className="text-[11px] text-app-secondary">
                        {language === "fr" ? "Créée" : "Created"} {formatDate(party.created_at, language)}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[#5b45d9]">
                    {language === "fr" ? "Ouvrir" : "Open"}
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[1rem] bg-[#faf8ff] p-4 text-center text-sm text-app-secondary dark:bg-[#16161d] dark:text-muted-foreground">
              <Mascot pose="sad" size="md" centered className="mb-3" />
              {language === "fr" ? "Aucun party pour le moment." : "No parties yet."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  loading = false,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  loading?: boolean;
}) {
  return (
    <Card className="border border-[#ece8f8] bg-white shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#ece4ff] p-2 text-[#7650ff] dark:bg-[#272138] dark:text-[#a698ff]">
            <Icon className="size-4" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-app-overline">{title}</p>
            <div className="mt-1 flex items-center gap-2">
              {loading ? <Loader2 className="size-4 animate-spin text-[#7650ff]" /> : null}
              <p className="text-xl font-semibold tracking-[-0.04em] text-[#1f1c38] dark:text-[#f2f2f5]">{value}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-app-secondary">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getDashboardSuggestedAction(snapshot: WorkspaceSnapshot | null, language: "en" | "fr" = "en"): SuggestedAction {
  const activeTeam = snapshot?.allTeams.find((team) => team.status === "active") ?? null;
  const currentTeam = snapshot?.currentTeam ?? null;
  const hasPastParties = (snapshot?.allTeams.length ?? 0) > 0;
  const queueEntryStatus = snapshot?.queueEntry?.status ?? null;

  if (activeTeam && currentTeam?.id === activeTeam.id) {
    if (!snapshot?.currentProject) {
      return {
        badge: language === "fr" ? "Prochaine action suggérée" : "Suggested next step",
        title: language === "fr" ? "Votre party est prête à démarrer." : "Your party is ready to start.",
        description:
          language === "fr"
            ? "Configurez le projet d’équipe pour que tout le monde s’aligne sur le build et le repository partagés."
            : "Set up the team project so everyone can align around the shared build and repository.",
        ctaLabel: language === "fr" ? "Configurer le projet" : "Set up project",
        href: `/workspace?party=${activeTeam.id}`,
      };
    }

    if (!snapshot.currentProject.github_repo_url) {
      return {
        badge: language === "fr" ? "Prochaine action suggérée" : "Suggested next step",
        title: language === "fr" ? "Votre projet a encore besoin d’un repository." : "Your project still needs a repository.",
        description:
          language === "fr"
            ? "Liez le repository GitHub public pour donner au party un seul endroit commun où construire."
            : "Link the public GitHub repository to give the party one shared place to build from.",
        ctaLabel: language === "fr" ? "Lier le repository" : "Link repository",
        href: `/workspace?party=${activeTeam.id}`,
      };
    }

    if (activeTeam.completion_requested_at) {
      return {
        badge: language === "fr" ? "Prochaine action suggérée" : "Suggested next step",
        title: language === "fr" ? "Votre demande de complétion est en révision." : "Your completion request is under review.",
        description:
          language === "fr"
            ? "Ouvrez l’espace du party pour revoir les derniers détails du projet pendant que l’admin vérifie la complétion."
            : "Open the party workspace to review the latest project details while admin checks completion.",
        ctaLabel: language === "fr" ? "Ouvrir l’espace" : "Open workspace",
        href: `/workspace?party=${activeTeam.id}`,
      };
    }

    return {
      badge: language === "fr" ? "Prochaine action suggérée" : "Suggested next step",
      title: language === "fr" ? "Faites avancer votre party actif." : "Keep your active party moving.",
      description:
        language === "fr"
          ? "Ouvrez l’espace pour coordonner l’équipe, vérifier le repo et garder le projet sur les rails."
          : "Open the workspace to coordinate with the team, review the repo, and keep the project on track.",
      ctaLabel: language === "fr" ? "Ouvrir l’espace" : "Open workspace",
      href: `/workspace?party=${activeTeam.id}`,
    };
  }

  if (queueEntryStatus === "waiting") {
    return {
      badge: null,
      title:
        language === "fr"
          ? "Vous êtes actuellement dans la file de matchmaking."
          : "You are currently in the matchmaking queue.",
      description:
        language === "fr"
          ? "Gardez un œil sur votre statut et restez prêt pendant que le prochain party se forme."
          : "Check your matchmaking status and stay ready while the next party is being formed.",
      ctaLabel: null,
      href: null,
    };
  }

  if (hasPastParties) {
    return {
      badge: language === "fr" ? "Prochaine action suggérée" : "Suggested next step",
      title: language === "fr" ? "Prêt pour votre prochain party ?" : "Ready for your next party?",
      description:
        language === "fr"
          ? "Vous avez déjà un historique de parties. Retournez dans le matchmaking quand vous voulez lancer un nouveau build."
          : "You already have party history. Jump back into matchmaking when you want to start a new build.",
      ctaLabel: language === "fr" ? "Rejoindre le matchmaking" : "Join matchmaking",
      href: "/matchmaking",
    };
  }

  return {
    badge: language === "fr" ? "Prochaine action suggérée" : "Suggested next step",
    title: language === "fr" ? "Vous êtes prêt pour votre première party." : "You are ready for your first party.",
    description:
      language === "fr"
        ? "Votre profil est déjà prêt. Rejoignez le matchmaking pour être placé dans une équipe et commencer à construire."
        : "Your profile is already set. Join matchmaking to get placed into a team and start building.",
    ctaLabel: language === "fr" ? "Rejoindre le matchmaking" : "Join matchmaking",
    href: "/matchmaking",
  };
}

function getRepoLabel(repoUrl: string) {
  try {
    const url = new URL(repoUrl);
    return url.pathname.replace(/^\//, "");
  } catch {
    return repoUrl;
  }
}

function formatDate(value: string, language: "en" | "fr" = "en") {
  try {
    return new Intl.DateTimeFormat(language === "fr" ? "fr-CA" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatPartyStatus(status: "active" | "completed" | "cancelled", language: "en" | "fr" = "en") {
  if (language === "fr") {
    if (status === "active") return "Active";
    if (status === "completed") return "Complétée";
    return "Annulée";
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getPartyStatusClasses(status: "active" | "completed" | "cancelled") {
  if (status === "active") return "bg-[#ece4ff] text-[#5b45d9]";
  if (status === "completed") return "bg-[#e9f9ef] text-[#208a52]";
  return "bg-[#fff0f3] text-[#b84b66]";
}

function formatLabel(value: string, language: "en" | "fr" = "en") {
  if (language === "fr") {
    if (value === "active") return "statut actif";
    if (value === "completed") return "statut complété";
    if (value === "cancelled") return "statut annulé";
  }
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
