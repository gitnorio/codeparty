"use client";

import { Settings, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none">
        <CardHeader>
          <Badge className="w-fit rounded-full bg-white/14 text-white hover:bg-white/14">
            Settings
          </Badge>
          <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
            Control your profile and preferences.
          </CardTitle>
          <CardDescription className="mt-2 text-lg leading-8 text-white/82">
            Update your personal details, notification preferences and future privacy options here.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <SettingCard
          icon={Settings}
          title="Profile preferences"
          description="Later this can handle editable profile fields and matching preferences."
        />
        <SettingCard
          icon={ShieldCheck}
          title="Privacy and account"
          description="Later this can manage visibility, notifications and account safety."
        />
      </div>
    </div>
  );
}

function SettingCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Settings;
  title: string;
  description: string;
}) {
  return (
    <Card className="border border-[#ece8f8] shadow-none">
      <CardContent className="pt-6">
        <div className="rounded-[1.5rem] bg-[#faf8ff] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#ece4ff] p-2 text-[#7650ff]">
              <Icon className="size-4" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">{title}</p>
              <p className="mt-2 text-sm leading-7 text-[#6a6683]">{description}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
