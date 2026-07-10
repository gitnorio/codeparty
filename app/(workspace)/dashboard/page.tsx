"use client";

import {
  Activity,
  ArrowUpRight,
  FolderGit2,
  GitBranch,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FeedbackBanner } from "@/components/app/feedback";
import { Progress } from "@/components/ui/progress";
import { useWorkspaceProfile } from "@/components/app/workspace-shell";
import { useWorkspaceSnapshot } from "@/lib/workspace-data";

export default function DashboardPage() {
  const profile = useWorkspaceProfile();
  const { snapshot, isLoading, errorMessage } = useWorkspaceSnapshot(profile.id);

  const teamCount = snapshot?.teamMembers.length ?? 0;
  const progressValue = getProjectProgress(snapshot?.currentProject?.status);
  const contributionSummary =
    snapshot?.currentProjectMember?.membership.contribution_summary?.trim() ||
    "Your contribution summary becomes available once your team adds project role details.";
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
          <CardDescription className="mt-2 text-lg leading-8 text-white/82">
            Keep your matchmaking, team, project, and contribution proof aligned in one place.
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
              Repo & progress
            </Badge>
            <CardTitle className="text-3xl tracking-[-0.05em] text-[#1f1c38]">
              Project progress panel
            </CardTitle>
            <CardDescription className="text-base leading-7 text-[#6a6683]">
              See the shared repository, current status, and where the project is headed next.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="rounded-[1.5rem] bg-[#faf8ff] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">GitHub repo</p>
                  <p className="mt-1 text-xl font-medium text-[#1f1c38]">
                    {snapshot?.currentProject?.github_repo_url
                      ? getRepoLabel(snapshot.currentProject.github_repo_url)
                      : "Not linked yet"}
                  </p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-sm font-medium text-[#7650ff]">
                  {snapshot?.currentProject?.github_repo_url ? "Linked" : "Not linked"}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 text-sm text-[#6a6683]">
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
                ) : (
                  hasTeam
                    ? "The repository will appear once your team creates and links the project setup."
                    : "Add the shared GitHub repository once your team creates it."
                )}
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-[#faf8ff] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">Project progression</p>
                  <p className="mt-1 text-xl font-medium text-[#1f1c38]">
                    {snapshot?.currentProject
                      ? formatLabel(snapshot.currentProject.status)
                      : "Kickoff pending"}
                  </p>
                </div>
                <span className="text-sm font-medium text-[#7650ff]">{progressValue}%</span>
              </div>
              <Progress value={progressValue} className="mt-4 h-3 bg-[#ece8f8]" />
              <p className="mt-3 text-sm leading-7 text-[#6a6683]">
                {snapshot?.currentProject?.description ||
                  "Once a team is active, this block will reflect the live project scope and milestone status."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#ece8f8] bg-white shadow-none">
          <CardHeader>
            <Badge variant="outline" className="w-fit rounded-full bg-[#f6f2ff] text-[#7650ff]">
              Contribution snapshot
            </Badge>
            <CardTitle className="text-3xl tracking-[-0.05em] text-[#1f1c38]">
              Your contributions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ContributionRow
              icon={Activity}
              title="Project role"
              value={snapshot?.currentProjectMember?.membership.project_role
                ? formatLabel(snapshot.currentProjectMember.membership.project_role)
                : "Not assigned"}
              detail="This reflects your current role inside the active project."
            />
            <ContributionRow
              icon={GitBranch}
              title="Stack focus"
              value={snapshot?.currentProject?.stack.slice(0, 3).join(" · ") || "Not defined"}
              detail="These are the main technologies currently attached to the shared project."
            />
            <ContributionRow
              icon={ArrowUpRight}
              title="Contribution summary"
              value={snapshot?.currentProjectMember ? "Available" : "Not yet"}
              detail={contributionSummary}
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
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#ece4ff] p-2 text-[#7650ff]">
            <Icon className="size-4" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">{title}</p>
            <div className="mt-1 flex items-center gap-2">
              {loading ? <Loader2 className="size-4 animate-spin text-[#7650ff]" /> : null}
              <p className="text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">{value}</p>
            </div>
            <p className="mt-2 text-sm leading-7 text-[#6a6683]">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContributionRow({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: typeof Activity;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.4rem] bg-[#faf8ff] p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#ece4ff] p-2 text-[#7650ff]">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-lg font-medium text-[#1f1c38]">{title}</p>
          <p className="mt-1 text-sm font-medium text-[#7650ff]">{value}</p>
          <p className="mt-1 text-sm leading-7 text-[#6a6683]">{detail}</p>
        </div>
      </div>
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

function getProjectProgress(status?: string | null) {
  if (status === "planning") return 18;
  if (status === "active") return 62;
  if (status === "completed") return 100;
  if (status === "cancelled") return 0;
  return 12;
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
