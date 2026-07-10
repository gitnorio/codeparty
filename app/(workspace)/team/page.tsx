"use client";

import { Users } from "lucide-react";

import { EmptyStatePanel, FeedbackBanner, LoadingPanel } from "@/components/app/feedback";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspaceProfile } from "@/components/app/workspace-shell";
import { useWorkspaceSnapshot } from "@/lib/workspace-data";

export default function TeamPage() {
  const profile = useWorkspaceProfile();
  const { snapshot, isLoading, errorMessage } = useWorkspaceSnapshot(profile.id);
  const projectMembersByUserId = new Map(
    (snapshot?.projectMembers ?? []).map((item) => [item.profile.id, item] as const)
  );

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none">
        <CardHeader>
          <Badge className="w-fit rounded-full bg-white/14 text-white hover:bg-white/14">
            My Team
          </Badge>
          <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
            See the real people building with you.
          </CardTitle>
          <CardDescription className="mt-2 text-lg leading-8 text-white/82">
            Team identity, members, and collaboration fit should feel clear the moment you open this page.
          </CardDescription>
        </CardHeader>
      </Card>

      {errorMessage ? <FeedbackBanner tone="error" message={errorMessage} /> : null}

      {isLoading ? (
        <LoadingPanel message="Loading team context..." />
      ) : !snapshot?.currentTeam ? (
        <EmptyStatePanel
          icon={Users}
          title="No active team yet"
          description="Once matched, this page will show your full team, each member profile, and your current collaboration state."
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-4">
            <InfoCard
              label="Team name"
              value={snapshot.currentTeam.name}
              detail="The current team attached to your profile."
            />
            <InfoCard
              label="Team status"
              value={formatLabel(snapshot.currentTeam.status)}
              detail="Where the team sits in the current lifecycle."
            />
            <InfoCard
              label="Your member status"
              value={snapshot.currentMembership ? formatLabel(snapshot.currentMembership.member_status) : "Unknown"}
              detail="Your current state inside this team."
            />
            <InfoCard
              label="Linked project"
              value={snapshot.currentProject?.name ?? "Not created yet"}
              detail={
                snapshot.currentProject
                  ? `${formatLabel(snapshot.currentProject.status)} project`
                  : "Your team can create the first project directly from the project page."
              }
            />
          </div>

          <Card className="border border-[#ece8f8] shadow-none">
            <CardHeader>
              <CardTitle className="text-3xl tracking-[-0.05em] text-[#1f1c38]">
                Team members
              </CardTitle>
              <CardDescription className="text-base leading-7 text-[#6a6683]">
                Everyone currently active in the team, with the signals that matter for collaboration.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {snapshot.teamMembers.map((member) => {
                const projectMember = projectMembersByUserId.get(member.profile.id);

                return (
                  <div
                    key={member.profile.id}
                    className="rounded-[1.6rem] border border-[#ece8f8] bg-[#fcfbff] p-5"
                  >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xl font-medium text-[#1f1c38]">
                        {member.profile.display_name}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[#6a6683]">
                        {formatLabel(member.profile.level)} · {formatLabel(member.profile.goal)} · {formatLabel(member.profile.language)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="rounded-full bg-white text-[#7650ff]"
                    >
                      {formatLabel(member.membership.member_status)}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {member.profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-[#f3eeff] px-3 py-1 text-sm text-[#5b45d9]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 rounded-[1.2rem] bg-[#faf8ff] p-4 text-sm leading-7 text-[#6a6683]">
                    {member.profile.availability_per_week}h / week · {formatLabel(member.profile.project_type)}
                  </div>
                  <div className="mt-3 rounded-[1.2rem] bg-white p-4 text-sm leading-7 text-[#6a6683]">
                    <p className="font-medium text-[#1f1c38]">
                      {projectMember
                        ? `Project role: ${formatLabel(projectMember.membership.project_role)}`
                        : "Project role not assigned yet"}
                    </p>
                    <p className="mt-1">
                      {projectMember?.membership.contribution_summary ||
                        "Contribution summary has not been written yet."}
                    </p>
                  </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function InfoCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border border-[#ece8f8] shadow-none">
      <CardContent className="pt-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">{value}</p>
        <p className="mt-2 text-sm leading-7 text-[#6a6683]">{detail}</p>
      </CardContent>
    </Card>
  );
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
