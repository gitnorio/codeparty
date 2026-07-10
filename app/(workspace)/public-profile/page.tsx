"use client";

import { UserSquare2 } from "lucide-react";

import { FeedbackBanner } from "@/components/app/feedback";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspaceProfile } from "@/components/app/workspace-shell";
import { useWorkspaceSnapshot } from "@/lib/workspace-data";

export default function PublicProfilePage() {
  const profile = useWorkspaceProfile();
  const { snapshot, errorMessage } = useWorkspaceSnapshot(profile.id);

  const summary =
    snapshot?.currentProjectMember?.membership.contribution_summary?.trim() ||
    `Building toward ${formatLabel(profile.goal)} work with a focus on ${profile.skills.slice(0, 3).join(", ") || "hands-on team collaboration"}.`;

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none">
        <CardHeader>
          <Badge className="w-fit rounded-full bg-white/14 text-white hover:bg-white/14">
            Public Profile
          </Badge>
          <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
            Share your teamwork story.
          </CardTitle>
          <CardDescription className="mt-2 text-lg leading-8 text-white/82">
            Turn your current stack, collaboration context, and delivered work into visible proof.
          </CardDescription>
        </CardHeader>
      </Card>

      {errorMessage ? <FeedbackBanner tone="error" message={errorMessage} /> : null}

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border border-[#ece8f8] shadow-none">
          <CardContent className="pt-6">
            <div className="rounded-[1.5rem] bg-[#faf8ff] p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#ece4ff] p-2 text-[#7650ff]">
                  <UserSquare2 className="size-4" />
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">
                    {profile.display_name}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#6a6683]">
                    {formatLabel(profile.level)} · {formatLabel(profile.goal)} · {formatLabel(profile.language)}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-white px-3 py-1 text-sm text-[#5b45d9]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#ece8f8] shadow-none">
          <CardHeader>
            <CardTitle className="text-3xl tracking-[-0.05em] text-[#1f1c38]">
              Public profile preview
            </CardTitle>
            <CardDescription className="text-base leading-7 text-[#6a6683]">
              This is the kind of narrative your future public profile can surface from real team work.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ProfileSignal
              title="Current project"
              value={snapshot?.currentProject?.name ?? "No active project yet"}
              detail={
                snapshot?.currentProject
                  ? `${formatLabel(snapshot.currentProject.status)} · ${snapshot.currentProject.stack.join(", ")}`
                  : "Join a team and ship a project to start building a stronger public profile."
              }
            />
            <ProfileSignal
              title="Current role"
              value={
                snapshot?.currentProjectMember?.membership.project_role
                  ? formatLabel(snapshot.currentProjectMember.membership.project_role)
                  : "Role pending"
              }
              detail="This role can later power your public profile headline and contribution summary."
            />
            <ProfileSignal
              title="Contribution summary"
              value="Teamwork narrative"
              detail={summary}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileSignal({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.4rem] bg-[#faf8ff] p-4">
      <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">{title}</p>
      <p className="mt-2 text-xl font-medium text-[#1f1c38]">{value}</p>
      <p className="mt-2 text-sm leading-7 text-[#6a6683]">{detail}</p>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
