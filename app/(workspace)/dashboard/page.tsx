"use client";

import {
  Activity,
  ArrowUpRight,
  FolderGit2,
  GitBranch,
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
import { Progress } from "@/components/ui/progress";
import { useWorkspaceProfile } from "@/components/app/workspace-shell";

export default function DashboardPage() {
  const profile = useWorkspaceProfile();

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
            Here is the connected overview of your matchmaking, team, project,
            GitHub repo, progress and contributions.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          title="Matchmaking status"
          value="Ready to join"
          description="Your profile is complete and can enter the queue."
          icon={Sparkles}
        />
        <StatCard
          title="Current team"
          value="No team yet"
          description="You will see active members here after matching."
          icon={Users}
        />
        <StatCard
          title="Current project"
          value="Waiting"
          description="Your first shared project will appear once a team forms."
          icon={FolderGit2}
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
              This is where the current repo, project milestone status and contribution metrics live.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="rounded-[1.5rem] bg-[#faf8ff] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">GitHub repo</p>
                  <p className="mt-1 text-xl font-medium text-[#1f1c38]">Not linked yet</p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-sm font-medium text-[#7650ff]">
                  Pending
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 text-sm text-[#6a6683]">
                <GitBranch className="size-4 text-[#7650ff]" />
                Add the shared GitHub repository once the team creates it.
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-[#faf8ff] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">Project progression</p>
                  <p className="mt-1 text-xl font-medium text-[#1f1c38]">Kickoff pending</p>
                </div>
                <span className="text-sm font-medium text-[#7650ff]">12%</span>
              </div>
              <Progress value={12} className="mt-4 h-3 bg-[#ece8f8]" />
              <p className="mt-3 text-sm leading-7 text-[#6a6683]">
                Once a team is active, this block can show sprint progress, deliverables and completion rate.
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
              title="Pull requests"
              value="0"
              detail="Will populate after the first project starts."
            />
            <ContributionRow
              icon={GitBranch}
              title="Commits"
              value="0"
              detail="Connected to the shared repository once linked."
            />
            <ContributionRow
              icon={ArrowUpRight}
              title="Contribution summary"
              value="Pending"
              detail="A clear written summary for the future public profile."
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
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Sparkles;
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
            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">{value}</p>
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
