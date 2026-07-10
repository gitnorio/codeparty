"use client";

import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FeedbackBanner({
  tone,
  message,
}: {
  tone: "error" | "success" | "info";
  message: string;
}) {
  const Icon = tone === "error" ? AlertCircle : tone === "success" ? CheckCircle2 : Sparkles;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[1.2rem] border px-4 py-3 text-sm",
        tone === "error" && "border-red-200 bg-red-50 text-red-600",
        tone === "success" && "border-[#d8cff8] bg-[#f3eeff] text-[#5b45d9]",
        tone === "info" && "border-[#e3dafb] bg-[#faf8ff] text-[#6a6683]"
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

export function LoadingPanel({
  message = "Loading...",
  minHeight = "min-h-[220px]",
}: {
  message?: string;
  minHeight?: string;
}) {
  return (
    <Card className="border border-[#ece8f8] shadow-none">
      <CardContent className={cn("flex items-center justify-center", minHeight)}>
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-6 animate-spin text-[#7650ff]" />
          <p className="text-sm text-[#6a6683]">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyStatePanel({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
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
              <p className="text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">
                {title}
              </p>
              <p className="mt-2 text-sm leading-7 text-[#6a6683]">{description}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
