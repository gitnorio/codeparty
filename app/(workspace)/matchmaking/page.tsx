"use client";

import { Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspaceProfile } from "@/components/app/workspace-shell";

export default function MatchmakingPage() {
  const profile = useWorkspaceProfile();

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none">
        <CardHeader>
          <Badge className="w-fit rounded-full bg-white/14 text-white hover:bg-white/14">
            Matchmaking
          </Badge>
          <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
            Let’s find your first serious team.
          </CardTitle>
          <CardDescription className="mt-2 text-lg leading-8 text-white/82">
            Your current profile says {profile.goal}, {profile.language} and {profile.availability_per_week}h per week.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-[#ece8f8] shadow-none">
          <CardHeader>
            <CardTitle className="text-3xl tracking-[-0.05em] text-[#1f1c38]">Queue status</CardTitle>
            <CardDescription className="text-base leading-7 text-[#6a6683]">
              This route is ready for the next feature implementation.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-[1.5rem] bg-[#faf8ff] p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">Current status</p>
              <p className="mt-2 text-2xl font-semibold text-[#1f1c38]">Not in queue</p>
              <p className="mt-2 text-sm leading-7 text-[#6a6683]">
                The join queue action will create your first `matchmaking_queue` row.
              </p>
            </div>
            <Button className="h-12 rounded-full bg-[#7650ff] text-white hover:bg-[#6744f0]">
              Join matchmaking
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-[#ece8f8] shadow-none">
          <CardHeader>
            <CardTitle className="text-3xl tracking-[-0.05em] text-[#1f1c38]">Matching criteria</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Criteria label="Goal" value={profile.goal} icon={Sparkles} />
            <Criteria label="Availability" value={`${profile.availability_per_week} h / week`} icon={Users} />
            <Criteria label="Language" value={profile.language} icon={Users} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Criteria({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Sparkles;
}) {
  return (
    <div className="rounded-[1.3rem] bg-[#faf8ff] p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#ece4ff] p-2 text-[#7650ff]">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">{label}</p>
          <p className="mt-1 text-lg font-medium text-[#1f1c38]">{value}</p>
        </div>
      </div>
    </div>
  );
}
