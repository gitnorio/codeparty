"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/app/feedback";
import { useWorkspaceProfile } from "@/components/app/workspace-shell";
import {
  getActivePartyCount,
  ensureWaitingMatchmakingEntry,
  updateMatchmakingEntryStatus,
} from "@/lib/matchmaking";
import { formatLanguageValue, formatProjectTypeList } from "@/lib/profile-options";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useWorkspaceSnapshot } from "@/lib/workspace-data";

export default function MatchmakingPage() {
  const profile = useWorkspaceProfile();
  const supabase = getSupabaseBrowserClient();
  const { snapshot, isLoading, errorMessage, refreshSnapshot } = useWorkspaceSnapshot(profile.id);
  const [isMutating, setIsMutating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const activePartyCount = useMemo(() => {
    if (!snapshot) return 0;

    const activeTeamIds = new Set(
      snapshot.allTeams
        .filter((team) => team.status === "active")
        .map((team) => team.id)
    );

    return snapshot.allMemberships.filter(
      (membership) =>
        membership.member_status === "active" && activeTeamIds.has(membership.team_id)
    ).length;
  }, [snapshot]);

  useEffect(() => {
    const channel = supabase
      .channel(`matchmaking-live-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matchmaking_queue",
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          void refreshSnapshot();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_members",
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          void refreshSnapshot();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile.id, refreshSnapshot, supabase]);

  async function handleJoinMatchmaking() {
    setIsMutating(true);
    setActionError(null);

    const activePartyCountResult = await getActivePartyCount(supabase, profile.id);

    if (activePartyCountResult.error) {
      setActionError(activePartyCountResult.error.message);
      setIsMutating(false);
      return;
    }

    if (activePartyCountResult.count >= 1) {
      setActionError("You already belong to an active party.");
      setIsMutating(false);
      return;
    }

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

  const queueStatusLabel = getQueueStatusLabel(snapshot?.queueEntry?.status, activePartyCount);
  const isWaiting = snapshot?.queueEntry?.status === "waiting";
  const canJoinAnotherParty = activePartyCount < 1;

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none dark:bg-[linear-gradient(135deg,#6d5ce8_0%,#5f50d2_100%)]">
        <CardHeader>
          <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
            Match into the right party, then keep building.
          </CardTitle>
          <CardDescription className="mt-2 max-w-2xl text-base leading-7 text-white/82">
            Join the queue, track your current status, and stay ready for your next party.
          </CardDescription>
        </CardHeader>
      </Card>

      {errorMessage || actionError ? (
        <FeedbackBanner tone="error" message={actionError ?? errorMessage ?? "Unknown error."} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-[#ece8f8] shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">Queue status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-[1rem] bg-[#faf8ff] px-4 py-3 dark:bg-[#16161d]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-app-overline">Current status</p>
              <p className="mt-1 text-lg font-semibold text-[#1f1c38] dark:text-[#f2f2f5]">
                {isLoading ? "Loading..." : queueStatusLabel}
              </p>
              <p className="mt-1 text-xs leading-5 text-app-secondary">
                {isLoading
                  ? "Checking your queue entry..."
                  : getQueueStatusDescription(snapshot?.queueEntry?.status, activePartyCount)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                onClick={() => void handleJoinMatchmaking()}
                disabled={isLoading || isMutating || isWaiting || !canJoinAnotherParty}
                className="h-11 rounded-full bg-[#7650ff] text-white hover:bg-[#6744f0]"
              >
                {isMutating && !isWaiting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Updating...
                  </>
                ) : isWaiting ? (
                  "Already in queue"
                ) : (
                  "Join queue"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCancelQueue()}
                disabled={isLoading || isMutating || !isWaiting}
                className="h-11 rounded-full border-[#e8e2f7] bg-white text-[#1f1c38] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#f2f2f5]"
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
          </CardContent>
        </Card>

        <Card className="border border-[#ece8f8] shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">Profile signals</CardTitle>
            <CardDescription className="text-sm leading-6 text-app-secondary">
              Matchmaking combines your language, timezone, project interests, and stack focus.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Criteria label="Language" value={formatLanguageValue(profile.language)} icon={Users} />
            <Criteria label="Timezone" value={profile.timezone} icon={Users} />
            <Criteria label="Project types" value={formatProjectTypeList(profile.project_type)} icon={Sparkles} />
            <Criteria
              label="Selected stack"
              value={profile.skills.slice(0, 5).join(", ") || "No technologies selected"}
              icon={Sparkles}
            />
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
    <div className="rounded-[1.1rem] bg-[#faf8ff] p-3.5 dark:bg-[#16161d]">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#ece4ff] p-2 text-[#7650ff] dark:bg-[#272138] dark:text-[#a698ff]">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-app-overline">{label}</p>
          <p className="mt-1 text-sm font-medium leading-6 text-[#1f1c38] dark:text-[#f2f2f5]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function getQueueStatusLabel(status?: string | null, activePartyCount = 0) {
  if (status === "waiting") return "Waiting for a party";
  if (activePartyCount >= 1) return "Active party in progress";
  return "Not in queue";
}

function getQueueStatusDescription(status?: string | null, activePartyCount = 0) {
  if (status === "waiting") {
    return "Your profile is currently visible for manual or future party matching.";
  }

  if (activePartyCount >= 1) {
    return "You already belong to an active party. An admin must mark it completed or cancelled before you rejoin the queue.";
  }

  return "You are not in the matchmaking queue yet.";
}
