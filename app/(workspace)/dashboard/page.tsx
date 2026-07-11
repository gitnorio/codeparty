"use client";

import { FolderGit2, GitBranch, Loader2, Sparkles, Users } from "lucide-react";

import { FeedbackBanner } from "@/components/app/feedback";
import { useWorkspaceProfile } from "@/components/app/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspaceSnapshot } from "@/lib/workspace-data";

export default function DashboardPage() {
  const profile = useWorkspaceProfile();
  const { snapshot, isLoading, errorMessage } = useWorkspaceSnapshot(profile.id);

  const teamCount = snapshot?.teamMembers.length ?? 0;
  const hasTeam = Boolean(snapshot?.currentTeam);

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
            Keep your matchmaking status, team context, and shared project setup aligned in one place.
          </CardDescription>
        </CardHeader>
      </Card>

      {errorMessage ? <FeedbackBanner tone="error" message={errorMessage} /> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          title="Matchmaking status"
          value={getQueueStatusValue(snapshot?.queueEntry?.status)}
          description={getQueueStatusDescription(snapshot?.queueEntry?.status)}
          icon={Sparkles}
          loading={isLoading}
        />
        <StatCard
          title="Current team"
          value={snapshot?.currentTeam?.name ?? "Waiting for team"}
          description={
            snapshot?.currentTeam
              ? `${teamCount} members · ${formatLabel(snapshot.currentTeam.status)} status`
              : "You will see your active team here once a match is created."
          }
          icon={Users}
          loading={isLoading}
        />
        <StatCard
          title="Current project"
          value={snapshot?.currentProject?.name ?? "Waiting for project"}
          description={
            snapshot?.currentProject
              ? `${formatLabel(snapshot.currentProject.status)} · ${snapshot.currentProject.stack.length} stack choices`
              : hasTeam
                ? "Your team is ready, and the project will appear once your team saves the setup."
                : "Your team project will appear here once it is created."
          }
          icon={FolderGit2}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-[#ece8f8] bg-white shadow-none">
          <CardHeader>
            <Badge variant="outline" className="w-fit rounded-full bg-[#f6f2ff] text-[#7650ff]">
              Project repo
            </Badge>
            <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">
              Shared repository
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-[#6a6683]">
              Keep the project link visible without turning the dashboard into a GitHub clone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-[1.25rem] bg-[#faf8ff] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">GitHub repo</p>
                  <p className="mt-1 text-lg font-medium text-[#1f1c38]">
                    {snapshot?.currentProject?.github_repo_url
                      ? getRepoLabel(snapshot.currentProject.github_repo_url)
                      : "Not linked yet"}
                  </p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-sm font-medium text-[#7650ff]">
                  {snapshot?.currentProject?.github_repo_url ? "Linked" : "Not linked"}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 text-sm text-[#6a6683]">
                <GitBranch className="size-4 text-[#7650ff]" />
                {snapshot?.currentProject?.github_repo_url ? (
                  <a
                    href={snapshot.currentProject.github_repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#5b45d9] underline-offset-4 hover:underline"
                  >
                    Open repository
                  </a>
                ) : hasTeam ? (
                  "The repository will appear once your team creates and links the project setup."
                ) : (
                  "Add the shared GitHub repository once your team creates it."
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#ece8f8] bg-white shadow-none">
          <CardHeader>
            <Badge variant="outline" className="w-fit rounded-full bg-[#f6f2ff] text-[#7650ff]">
              Current focus
            </Badge>
            <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">
              What matters now
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <CompactRow
              title="Project status"
              value={
                snapshot?.currentProject
                  ? formatLabel(snapshot.currentProject.status)
                  : "Waiting for project"
              }
              detail={
                snapshot?.currentProject?.description ||
                "The project scope appears here once your team saves the setup."
              }
            />
            <CompactRow
              title="Your role"
              value={
                snapshot?.currentProjectMember?.membership.project_role
                  ? formatLabel(snapshot.currentProjectMember.membership.project_role)
                  : "Not assigned"
              }
              detail="Your team can define or refine roles on the project page."
            />
            <CompactRow
              title="Core stack"
              value={snapshot?.currentProject?.stack.slice(0, 3).join(" · ") || "Not defined"}
              detail="Keep this lightweight here; the full setup lives on the project page."
            />
          </CardContent>
        </Card>
      </div>
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

function CompactRow({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.15rem] bg-[#faf8ff] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-[#8f84bc]">{title}</p>
      <p className="mt-1 text-base font-medium text-[#1f1c38]">{value}</p>
      <p className="mt-1 text-sm leading-6 text-[#6a6683]">{detail}</p>
    </div>
  );
}

function getQueueStatusValue(status?: string | null) {
  if (!status) return "Ready to join";
  if (status === "waiting") return "In queue";
  if (status === "matched") return "Matched";
  return "Queue cancelled";
}

function getQueueStatusDescription(status?: string | null) {
  if (!status) return "Your profile is complete and can enter the queue.";
  if (status === "waiting") return "Your profile is currently visible for team matching.";
  if (status === "matched") return "A team match has already been created for your profile.";
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

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
