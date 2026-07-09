"use client";

import { FolderGit2, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectPage() {
  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none">
        <CardHeader>
          <Badge className="w-fit rounded-full bg-white/14 text-white hover:bg-white/14">
            My Project
          </Badge>
          <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
            Track the real project your team is building.
          </CardTitle>
          <CardDescription className="mt-2 text-lg leading-8 text-white/82">
            This screen is reserved for repo link, milestones, stack, roles and delivery progress.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-[#ece8f8] shadow-none">
          <CardContent className="pt-6">
            <div className="rounded-[1.5rem] bg-[#faf8ff] p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#ece4ff] p-2 text-[#7650ff]">
                  <FolderGit2 className="size-4" />
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">Project details</p>
                  <p className="mt-2 text-sm leading-7 text-[#6a6683]">
                    Name, description, stack, scope and milestones will land here.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#ece8f8] shadow-none">
          <CardContent className="pt-6">
            <div className="rounded-[1.5rem] bg-[#faf8ff] p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#ece4ff] p-2 text-[#7650ff]">
                  <Link2 className="size-4" />
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">GitHub repository</p>
                  <p className="mt-2 text-sm leading-7 text-[#6a6683]">
                    The shared repo URL and contribution activity will be shown here.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
