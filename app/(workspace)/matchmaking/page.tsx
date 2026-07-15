"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Code2, Globe2, Layers3, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/app/language-provider";
import { Mascot } from "@/components/app/mascot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/app/feedback";
import { useWorkspaceProfile } from "@/components/app/workspace-shell";
import {
  getActivePartyCount,
  ensureWaitingMatchmakingEntry,
  updateMatchmakingEntryStatus,
} from "@/lib/matchmaking";
import { formatLanguageValue, formatProjectTypeList, formatTimezoneValue } from "@/lib/profile-options";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useWorkspaceSnapshot } from "@/lib/workspace-data";

export default function MatchmakingPage() {
  const profile = useWorkspaceProfile();
  const { language } = useLanguage();
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
      setActionError(
        language === "fr"
          ? "Vous appartenez déjà à un party actif."
          : "You already belong to an active party."
      );
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

  const queueStatusLabel = getQueueStatusLabel(
    snapshot?.queueEntry?.status,
    activePartyCount,
    language
  );
  const isWaiting = snapshot?.queueEntry?.status === "waiting";
  const canJoinAnotherParty = activePartyCount < 1;

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none dark:bg-[linear-gradient(135deg,#6d5ce8_0%,#5f50d2_100%)]">
        <CardHeader>
          <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
            {language === "fr"
              ? "Trouvez la bonne party, puis continuez à construire."
              : "Match into the right party, then keep building."}
          </CardTitle>
          <CardDescription className="mt-2 max-w-2xl text-base leading-7 text-white/82">
            {language === "fr"
              ? "Rejoignez la file, suivez votre statut actuel et restez prêt pour votre prochain party."
              : "Join the queue, track your current status, and stay ready for your next party."}
          </CardDescription>
        </CardHeader>
      </Card>

      {errorMessage || actionError ? (
        <FeedbackBanner
          tone="error"
          message={actionError ?? errorMessage ?? (language === "fr" ? "Erreur inconnue." : "Unknown error.")}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-[#ece8f8] shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
              {language === "fr" ? "Statut de file" : "Queue status"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-[1rem] bg-[#faf8ff] px-4 py-3 dark:bg-[#16161d]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-app-overline">
                {language === "fr" ? "Statut actuel" : "Current status"}
              </p>
              <p className="mt-1 text-lg font-semibold text-[#1f1c38] dark:text-[#f2f2f5]">
                {isLoading ? (language === "fr" ? "Chargement..." : "Loading...") : queueStatusLabel}
              </p>
              <p className="mt-1 text-xs leading-5 text-app-secondary">
                {isLoading
                  ? language === "fr"
                    ? "Vérification de votre entrée dans la file..."
                    : "Checking your queue entry..."
                  : getQueueStatusDescription(snapshot?.queueEntry?.status, activePartyCount, language)}
              </p>
              {isWaiting ? (
                <Mascot pose="waiting" size="md" float centered className="mt-4" />
              ) : null}
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
                    {language === "fr" ? "Mise à jour..." : "Updating..."}
                  </>
                ) : isWaiting ? (
                  language === "fr" ? "Déjà dans la file" : "Already in queue"
                ) : (
                  language === "fr" ? "Rejoindre la file" : "Join queue"
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
                    {language === "fr" ? "Annulation..." : "Cancelling..."}
                  </>
                ) : (
                  language === "fr" ? "Quitter la file" : "Pause queue"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#ece8f8] shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
              {language === "fr" ? "Ce qui influence votre prochain party" : "What shapes your next party"}
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-app-secondary">
              {language === "fr"
                ? "Le matchmaking combine vos langues, votre fuseau horaire, vos intérêts de projet et votre stack."
                : "Matchmaking combines your language, timezone, project interests, and stack focus."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Criteria label={language === "fr" ? "Langue" : "Language"} value={formatLanguageValue(profile.language, language)} icon={Globe2} />
            <Criteria label={language === "fr" ? "Fuseau horaire" : "Timezone"} value={formatTimezoneValue(profile.timezone)} icon={Clock3} />
            <Criteria label={language === "fr" ? "Types de projet" : "Project types"} value={formatProjectTypeList(profile.project_type, language)} icon={Layers3} />
            <Criteria
              label={language === "fr" ? "Stack sélectionnée" : "Selected stack"}
              value={
                profile.skills.slice(0, 5).join(", ") ||
                (language === "fr" ? "Aucune technologie sélectionnée" : "No technologies selected")
              }
              icon={Code2}
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

function getQueueStatusLabel(status?: string | null, activePartyCount = 0, language: "en" | "fr" = "en") {
  if (status === "waiting") return language === "fr" ? "En attente d’un party" : "Waiting for a party";
  if (activePartyCount >= 1) return language === "fr" ? "Party active en cours" : "Active party in progress";
  return language === "fr" ? "Hors file" : "Not in queue";
}

function getQueueStatusDescription(status?: string | null, activePartyCount = 0, language: "en" | "fr" = "en") {
  if (status === "waiting") {
    return language === "fr"
      ? "Votre profil est actuellement visible pour un matching manuel ou futur."
      : "Your profile is currently visible for manual or future party matching.";
  }

  if (activePartyCount >= 1) {
    return language === "fr"
      ? "Vous appartenez déjà à un party actif. Un admin doit le marquer comme complété ou annulé avant que vous puissiez revenir dans la file."
      : "You already belong to an active party. An admin must mark it completed or cancelled before you rejoin the queue.";
  }

  return language === "fr"
    ? "Vous n’êtes pas encore dans la file de matchmaking."
    : "You are not in the matchmaking queue yet.";
}
