"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Loader2, RefreshCcw, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/app/feedback";
import { useWorkspaceProfile } from "@/components/app/workspace-shell";
import {
  ensureWaitingMatchmakingEntry,
  updateMatchmakingEntryStatus,
} from "@/lib/matchmaking";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useWorkspaceSnapshot } from "@/lib/workspace-data";

export default function MatchmakingPage() {
  const profile = useWorkspaceProfile();
  const supabase = getSupabaseBrowserClient();
  const { snapshot, isLoading, errorMessage, refreshSnapshot } = useWorkspaceSnapshot(profile.id);
  const [isMutating, setIsMutating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleJoinMatchmaking() {
    setIsMutating(true);
    setActionError(null);

    const result = await ensureWaitingMatchmakingEntry(supabase, profile.id);

    if (result.error) {
      setActionError(result.error.message);
      setIsMutating(false);
      return;
    }

    setIsMutating(false);
    await refreshSnapshot();
  }

  async function handleCancelQueue() {
    if (!snapshot?.queueEntry) {
      return;
    }

    setIsMutating(true);
    setActionError(null);

    const result = await updateMatchmakingEntryStatus(
      supabase,
      snapshot.queueEntry.id,
      "cancelled"
    );

    if (result.error) {
      setActionError(result.error.message);
      setIsMutating(false);
      return;
    }

    setIsMutating(false);
    await refreshSnapshot();
  }

  const queueStatusLabel = getQueueStatusLabel(snapshot?.queueEntry?.status);
  const queueStatusDescription = getQueueStatusDescription(snapshot?.queueEntry?.status);
  const isWaiting = snapshot?.queueEntry?.status === "waiting";
  const isMatched = snapshot?.queueEntry?.status === "matched";
  const hasAssignedTeam = Boolean(snapshot?.currentTeam);
  const hasAssignedProject = Boolean(snapshot?.currentProject);

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none">
        <CardHeader>
          <Badge className="w-fit rounded-full bg-white/14 text-white hover:bg-white/14">
            Matchmaking
          </Badge>
          <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
            Match into the right team, then move fast.
          </CardTitle>
          <CardDescription className="mt-2 max-w-2xl text-base leading-7 text-white/82">
            Your profile currently highlights {formatLabel(profile.goal)}, {formatLabel(profile.language)}, and {profile.availability_per_week} hours per week.
          </CardDescription>
        </CardHeader>
      </Card>

      {errorMessage || actionError ? (
        <FeedbackBanner tone="error" message={actionError ?? errorMessage ?? "Unknown error."} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-[#ece8f8] shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">Queue status</CardTitle>
            <CardDescription className="text-sm leading-6 text-[#6a6683]">
              Join the queue, pause your availability, or confirm that your match is already in motion.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-[1.2rem] bg-[#faf8ff] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8f84bc]">Current status</p>
              <p className="mt-1 text-xl font-semibold text-[#1f1c38]">
                {isLoading ? "Loading..." : queueStatusLabel}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#6a6683]">
                {isLoading ? "Checking your queue entry..." : queueStatusDescription}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                onClick={() => void handleJoinMatchmaking()}
                disabled={isLoading || isMutating || isWaiting || isMatched}
                className="h-11 rounded-full bg-[#7650ff] text-white hover:bg-[#6744f0]"
              >
                {isMutating && !isWaiting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Updating...
                  </>
                ) : isWaiting ? (
                  "Already in queue"
                ) : isMatched ? (
                  "Already matched"
                ) : (
                  "Join matchmaking"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCancelQueue()}
                disabled={isLoading || isMutating || !isWaiting}
                className="h-11 rounded-full border-[#e8e2f7] bg-white text-[#1f1c38]"
              >
                {isMutating && isWaiting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Pause queue"
                )}
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => void refreshSnapshot()}
              disabled={isLoading}
              className="h-11 rounded-full border-[#e8e2f7] bg-white text-[#5b45d9]"
            >
              <RefreshCcw className="size-4" />
              Refresh status
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-[#ece8f8] shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">Profile signals</CardTitle>
            <CardDescription className="text-sm leading-6 text-[#6a6683]">
              Matchmaking combines your preferences, project direction, availability, and stack focus.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Criteria label="Goal" value={formatLabel(profile.goal)} icon={Sparkles} />
            <Criteria label="Availability" value={`${profile.availability_per_week} h / week`} icon={Users} />
            <Criteria label="Language" value={formatLabel(profile.language)} icon={Users} />
            <Criteria label="Project type" value={formatLabel(profile.project_type)} icon={Sparkles} />
            <Criteria
              label="Selected stack"
              value={profile.skills.slice(0, 5).join(", ") || "No technologies selected"}
              icon={Sparkles}
            />
          </CardContent>
        </Card>
      </div>

      {isMatched ? (
        <Card className="border border-[#d8cff8] bg-[#f8f4ff] shadow-none">
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8f84bc]">
              Match confirmed
            </p>
            <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#1f1c38]">
              {hasAssignedTeam
                ? `You are now in ${snapshot?.currentTeam?.name}.`
                : "Your profile has been matched."}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#6a6683]">
              {hasAssignedProject
                ? `Your team is already linked to ${snapshot?.currentProject?.name}.`
                : "Your team exists, and the project setup is the next step."}
            </p>
            <Link
              href="/workspace"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#5b45d9] underline-offset-4 hover:underline"
            >
              Open workspace
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {!isMatched ? (
        <Card className="border border-[#ece8f8] shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">What happens next</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Criteria label="Queue visibility" value="Your profile becomes visible to matching." icon={Sparkles} />
            <Criteria label="Team creation" value="An admin can place you into a serious team." icon={Users} />
            <Criteria label="Workspace handoff" value="Your team then creates the project in the workspace." icon={Sparkles} />
          </CardContent>
        </Card>
      ) : null}
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
    <div className="rounded-[1.1rem] bg-[#faf8ff] p-3.5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#ece4ff] p-2 text-[#7650ff]">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8f84bc]">{label}</p>
          <p className="mt-1 text-sm font-medium leading-6 text-[#1f1c38]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function getQueueStatusLabel(status?: string | null) {
  if (!status) return "Not in queue";
  if (status === "waiting") return "Waiting for a team";
  if (status === "matched") return "Matched";
  return "Queue paused";
}

function getQueueStatusDescription(status?: string | null) {
  if (!status) return "You are not in the matchmaking queue yet.";
  if (status === "waiting") return "Your profile is currently visible for manual or future automatic team matching.";
  if (status === "matched") return "A team has already been formed for your profile.";
  return "Your previous queue entry is paused. You can rejoin whenever you are ready.";
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
