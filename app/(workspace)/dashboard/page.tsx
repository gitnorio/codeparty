"use client";

import { useEffect, useState } from "react";
import { GitBranch, Loader2, Sparkles, Users } from "lucide-react";

import { FeedbackBanner } from "@/components/app/feedback";
import { useWorkspaceProfile } from "@/components/app/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useWorkspaceSnapshot } from "@/lib/workspace-data";

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

export default function DashboardPage() {
  const profile = useWorkspaceProfile();
  const { snapshot, isLoading, errorMessage } = useWorkspaceSnapshot(profile.id);
  const [repositories, setRepositories] = useState<RepositoryListItem[]>([]);
  const [repositoriesLoading, setRepositoriesLoading] = useState(true);
  const [repositoriesError, setRepositoriesError] = useState<string | null>(null);

  const teamCount = snapshot?.teamMembers.length ?? 0;

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

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none">
        <CardHeader>
          <Badge className="w-fit rounded-full bg-white/14 text-white hover:bg-white/14">
            Dashboard
          </Badge>
          <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
            Welcome back,
            <br />
            {profile.display_name}
          </CardTitle>
          <CardDescription className="mt-2 max-w-2xl text-base leading-7 text-white/82">
            Keep your matchmaking status, team context, and linked repositories visible in one place.
          </CardDescription>
        </CardHeader>
      </Card>

      {errorMessage ? <FeedbackBanner tone="error" message={errorMessage} /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <StatCard
          title="Matchmaking status"
          value={getQueueStatusValue(snapshot?.queueEntry?.status, snapshot?.currentTeam?.status)}
          description={getQueueStatusDescription(snapshot?.queueEntry?.status, snapshot?.currentTeam?.status)}
          icon={Sparkles}
          loading={isLoading}
        />
        <StatCard
          title="Current team"
          value={snapshot?.currentTeam ? `Party ${snapshot.currentTeam.party_id}` : "Waiting for party"}
          description={
            snapshot?.currentTeam
              ? `${teamCount} members · ${formatLabel(snapshot.currentTeam.status)} status`
              : "You will see your active team here once a match is created."
          }
          icon={Users}
          loading={isLoading}
        />
      </div>

      <Card className="border border-[#ece8f8] bg-white shadow-none">
        <CardHeader>
          <Badge variant="outline" className="w-fit rounded-full bg-[#f6f2ff] text-[#7650ff]">
            Project repos
          </Badge>
          <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">
            Shared repositories
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-[#6a6683]">
            Browse every visible GitHub repository, with the most recent projects first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {repositoriesError ? <FeedbackBanner tone="error" message={repositoriesError} /> : null}

          <div className="rounded-[1.1rem] bg-[#faf8ff] p-2.5">
            {repositoriesLoading ? (
              <div className="flex min-h-28 items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-[#6a6683]">
                  <Loader2 className="size-4 animate-spin text-[#7650ff]" />
                  Loading repositories...
                </div>
              </div>
            ) : repositories.length === 0 ? (
              <div className="flex min-h-28 items-center justify-center text-center">
                <div className="max-w-sm">
                  <p className="text-sm font-medium text-[#1f1c38]">No linked repositories yet.</p>
                  <p className="mt-2 text-sm leading-6 text-[#6a6683]">
                    Repositories appear here once a team creates a project and links its GitHub URL.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-h-[22rem] space-y-1.5 overflow-y-auto pr-1">
                {repositories.map((repository) => (
                  <div
                    key={repository.id}
                    className="rounded-[0.95rem] border border-[#ece8f8] bg-white px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f84bc]">
                          Party {repository.partyId}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-[#1f1c38]">
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

                      <div className="shrink-0 rounded-full bg-[#f6f2ff] px-2 py-0.5 text-[10px] font-medium text-[#7650ff]">
                        {formatDate(repository.createdAt)}
                      </div>
                    </div>

                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#6a6683]">
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
  icon: typeof Sparkles;
  loading?: boolean;
}) {
  return (
    <Card className="border border-[#ece8f8] bg-white shadow-none">
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#ece4ff] p-2 text-[#7650ff]">
            <Icon className="size-4" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">{title}</p>
            <div className="mt-1 flex items-center gap-2">
              {loading ? <Loader2 className="size-4 animate-spin text-[#7650ff]" /> : null}
              <p className="text-xl font-semibold tracking-[-0.04em] text-[#1f1c38]">{value}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#6a6683]">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getQueueStatusValue(status?: string | null, teamStatus?: TeamRow["status"] | null) {
  if (teamStatus === "active") return "In active party";
  if (teamStatus === "completed") return "Party completed";
  if (teamStatus === "cancelled") return "Party cancelled";
  if (!status) return "Ready to join";
  if (status === "waiting") return "In queue";
  if (status === "matched") return "Party created";
  return "Queue cancelled";
}

function getQueueStatusDescription(status?: string | null, teamStatus?: TeamRow["status"] | null) {
  if (teamStatus === "active") return "You already belong to an active party.";
  if (teamStatus === "completed") return "Your last party was completed and remains in your history.";
  if (teamStatus === "cancelled") return "Your last party was cancelled and remains in your history.";
  if (!status) return "Your profile is complete and can enter the queue.";
  if (status === "waiting") return "Your profile is currently visible for team matching.";
  if (status === "matched") return "A party was previously created for your profile.";
  return "You can rejoin matchmaking anytime from the Matchmaking screen.";
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

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
