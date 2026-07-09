"use client";

import { UserSquare2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspaceProfile } from "@/components/app/workspace-shell";

export default function PublicProfilePage() {
  const profile = useWorkspaceProfile();

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
            This page will turn completed projects and contributions into a public profile for {profile.display_name}.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border border-[#ece8f8] shadow-none">
        <CardContent className="pt-6">
          <div className="rounded-[1.5rem] bg-[#faf8ff] p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-[#ece4ff] p-2 text-[#7650ff]">
                <UserSquare2 className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">Public proof builder</p>
                <p className="mt-2 text-sm leading-7 text-[#6a6683]">
                  The completed projects, role summaries and collaboration proof will be assembled here.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
