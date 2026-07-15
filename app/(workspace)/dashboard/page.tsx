"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, GitBranch, Loader2, Users, type LucideIcon } from "lucide-react";

import { FeedbackBanner } from "@/components/app/feedback";
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
          partyId: teamsById.get(project.team_id) ?? "Unknown",
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
  }, []);

  const suggestedAction = getDashboardSuggestedAction(snapshot);

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none dark:bg-[linear-gradient(135deg,#6d5ce8_0%,#5f50d2_100%)]">
        <CardHeader>
          <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
            {`Welcome back, ${profile.display_name}`}
          </CardTitle>
          <CardDescription className="mt-2 max-w-2xl text-base leading-7 text-white/82">
            Keep your team context and linked repositories visible in one place.
          </CardDescription>
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
          <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
            {suggestedAction.title}
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-app-secondary">
            {suggestedAction.description}
          </CardDescription>
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
          title="Current team"
          value={activeCurrentTeam ? `Party ${activeCurrentTeam.party_id}` : "No active party"}
          description={
            activeCurrentTeam
              ? `${teamCount} members · ${formatLabel(activeCurrentTeam.status)} status`
              : "You do not currently belong to an active party."
          }
          icon={Users}
          loading={isLoading}
        />
      </div>

      <Card className="border border-[#ece8f8] bg-white shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
        <CardHeader>
          <Badge variant="outline" className="w-fit rounded-full bg-[#f6f2ff] text-[#7650ff] dark:border-[#27272f] dark:bg-[#23232c] dark:text-[#a698ff]">
            Project repos
          </Badge>
          <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
            Shared repositories
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-app-secondary">
            Browse every visible GitHub repository, with the most recent projects first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {repositoriesError ? <FeedbackBanner tone="error" message={repositoriesError} /> : null}

          <div className="rounded-[1.1rem] bg-[#faf8ff] p-2.5 dark:bg-[#16161d]">
            {repositoriesLoading ? (
              <div className="flex min-h-28 items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-app-secondary">
                  <Loader2 className="size-4 animate-spin text-[#7650ff]" />
                  Loading repositories...
                </div>
              </div>
            ) : repositories.length === 0 ? (
              <div className="flex min-h-28 items-center justify-center text-center">
                <div className="max-w-sm">
                  <p className="text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">No linked repositories yet.</p>
                  <p className="mt-2 text-sm leading-6 text-app-secondary">
                    Repositories appear here once a team creates a project and links its GitHub URL.
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
                      <span>Open repository</span>
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
          <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">My Parties</CardTitle>
          <CardDescription className="text-sm leading-6 text-app-secondary">
            Keep your active and past parties close to your project repository list.
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
                        {formatPartyStatus(party.status)}
                      </span>
                      <span className="text-[11px] text-app-secondary">
                        Created {formatDate(party.created_at)}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[#5b45d9]">
                    Open
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[1rem] bg-[#faf8ff] p-4 text-sm text-app-secondary dark:bg-[#16161d] dark:text-muted-foreground">
              No parties yet.
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

function getDashboardSuggestedAction(snapshot: WorkspaceSnapshot | null): SuggestedAction {
  const activeTeam = snapshot?.allTeams.find((team) => team.status === "active") ?? null;
  const currentTeam = snapshot?.currentTeam ?? null;
  const hasPastParties = (snapshot?.allTeams.length ?? 0) > 0;
  const queueEntryStatus = snapshot?.queueEntry?.status ?? null;

  if (activeTeam && currentTeam?.id === activeTeam.id) {
    if (!snapshot?.currentProject) {
      return {
        badge: "Suggested next step",
        title: "Your party is ready to start.",
        description:
          "Set up the team project so everyone can align around the shared build and repository.",
        ctaLabel: "Set up project",
        href: `/workspace?party=${activeTeam.id}`,
      };
    }

    if (!snapshot.currentProject.github_repo_url) {
      return {
        badge: "Suggested next step",
        title: "Your project still needs a repository.",
        description:
          "Link the public GitHub repository to give the party one shared place to build from.",
        ctaLabel: "Link repository",
        href: `/workspace?party=${activeTeam.id}`,
      };
    }

    if (activeTeam.completion_requested_at) {
      return {
        badge: "Suggested next step",
        title: "Your completion request is under review.",
        description:
          "Open the party workspace to review the latest project details while admin checks completion.",
        ctaLabel: "Open workspace",
        href: `/workspace?party=${activeTeam.id}`,
      };
    }

    return {
      badge: "Suggested next step",
      title: "Keep your active party moving.",
      description:
        "Open the workspace to coordinate with the team, review the repo, and keep the project on track.",
      ctaLabel: "Open workspace",
      href: `/workspace?party=${activeTeam.id}`,
    };
  }

  if (queueEntryStatus === "waiting") {
    return {
      badge: null,
      title: "You are currently in the matchmaking queue.",
      description:
        "Check your matchmaking status and stay ready while the next party is being formed.",
      ctaLabel: null,
      href: null,
    };
  }

  if (hasPastParties) {
    return {
      badge: "Suggested next step",
      title: "Ready for your next party?",
      description:
        "You already have party history. Jump back into matchmaking when you want to start a new build.",
      ctaLabel: "Join matchmaking",
      href: "/matchmaking",
    };
  }

  return {
    badge: "Suggested next step",
    title: "You are ready for your first party.",
    description:
      "Your profile is already set. Join matchmaking to get placed into a team and start building.",
    ctaLabel: "Join matchmaking",
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

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatPartyStatus(status: "active" | "completed" | "cancelled") {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getPartyStatusClasses(status: "active" | "completed" | "cancelled") {
  if (status === "active") return "bg-[#ece4ff] text-[#5b45d9]";
  if (status === "completed") return "bg-[#e9f9ef] text-[#208a52]";
  return "bg-[#fff0f3] text-[#b84b66]";
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
