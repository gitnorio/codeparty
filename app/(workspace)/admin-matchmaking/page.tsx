"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, RefreshCcw, ShieldCheck, XCircle } from "lucide-react";

import {
  useWorkspaceAccess,
} from "@/components/app/workspace-shell";
import { FeedbackBanner } from "@/components/app/feedback";
import { useLanguage } from "@/components/app/language-provider";
import { Mascot } from "@/components/app/mascot";
import { ProfileAvatar } from "@/components/app/profile-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FormedTeam, WaitingCandidate } from "@/lib/admin-matchmaking";
import { formatLanguageValue, formatProjectTypeList, formatTimezoneValue } from "@/lib/profile-options";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const minTeamSize = 3;
const maxTeamSize = 4;

export default function AdminMatchmakingPage() {
  const { isAdmin } = useWorkspaceAccess();
  const { language } = useLanguage();
  const supabase = getSupabaseBrowserClient();
  const [waitingCandidates, setWaitingCandidates] = useState<WaitingCandidate[]>([]);
  const [formedTeams, setFormedTeams] = useState<FormedTeam[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    if (!session?.access_token) {
      throw new Error(
        language === "fr" ? "Session authentifiée manquante." : "Missing authenticated session."
      );
    }

    return session.access_token;
  }, [language, supabase]);

  const loadAdminData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!isAdmin) {
        return;
      }

      if (options?.silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage(null);

      let accessToken = "";
      try {
        accessToken = await getAccessToken();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : language === "fr"
              ? "Session manquante."
              : "Missing session."
        );
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const response = await fetch("/api/admin-matchmaking", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const payload = (await response.json()) as {
        error?: string;
        waitingCandidates?: WaitingCandidate[];
        formedTeams?: FormedTeam[];
      };

      if (!response.ok) {
        setErrorMessage(
          payload.error ??
            (language === "fr"
              ? "Impossible de charger les données admin du matchmaking."
              : "Failed to load admin matchmaking data.")
        );
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      setWaitingCandidates(payload.waitingCandidates ?? []);
      setFormedTeams(payload.formedTeams ?? []);
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [getAccessToken, isAdmin, language]
  );

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isAdmin, loadAdminData]);

  const selectedCandidates = useMemo(
    () =>
      waitingCandidates.filter((candidate) =>
        selectedUserIds.includes(candidate.profile.id)
      ),
    [selectedUserIds, waitingCandidates]
  );

  const canCreateTeam = selectedCandidates.length >= minTeamSize;

  function toggleCandidate(userId: string) {
    setSuccessMessage(null);
    setErrorMessage(null);

    setSelectedUserIds((current) => {
      const exists = current.includes(userId);

      if (exists) {
        return current.filter((item) => item !== userId);
      }

      if (current.length >= maxTeamSize) {
        setErrorMessage(
          language === "fr"
            ? `Vous pouvez sélectionner jusqu’à ${maxTeamSize} membres pour un party.`
            : `You can select up to ${maxTeamSize} members for one team.`
        );
        return current;
      }

      return [...current, userId];
    });
  }

  async function handleCreateTeam() {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (selectedCandidates.length < minTeamSize) {
      setErrorMessage(
        language === "fr"
          ? `Sélectionnez au moins ${minTeamSize} membres pour créer un party.`
          : `Select at least ${minTeamSize} members to create a team.`
      );
      return;
    }

    setIsCreating(true);

    let accessToken = "";
    try {
      accessToken = await getAccessToken();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Missing session.");
      setIsCreating(false);
      return;
    }

    const response = await fetch("/api/admin-matchmaking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        queueIds: selectedCandidates.map((candidate) => candidate.queue.id),
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      team?: { name?: string | null; party_id?: string | null };
    };

    if (!response.ok) {
      setErrorMessage(
        payload.error ??
          (language === "fr" ? "Impossible de créer le party." : "Failed to create team.")
      );
      setIsCreating(false);
      return;
    }

    setSelectedUserIds([]);
    setIsCreating(false);
    setSuccessMessage(
      language === "fr"
        ? `Le party ${payload.team?.party_id ?? payload.team?.name} a été créé avec succès.`
        : `Party ${payload.team?.party_id ?? payload.team?.name} created successfully.`
    );
    await loadAdminData({ silent: true });
  }

  async function sendAdminAction(
    body:
      | { action: "cancelQueue" | "reopenQueue"; queueIds: string[] }
      | {
          action: "updateTeamStatus";
          teamId: string;
          status: "completed" | "cancelled";
        }
      | {
          action: "rejectTeamCompletionRequest";
          teamId: string;
        },
    options: {
      pendingKey: string;
      successMessage: string;
      onSuccess?: () => void;
    }
  ) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setActionKey(options.pendingKey);

    let accessToken = "";
    try {
      accessToken = await getAccessToken();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Missing session.");
      setActionKey(null);
      return;
    }

    const response = await fetch("/api/admin-matchmaking", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as {
      error?: string;
    };

    if (!response.ok) {
      setErrorMessage(
        payload.error ??
          (language === "fr" ? "L’action admin a échoué." : "Admin action failed.")
      );
      setActionKey(null);
      return;
    }

    options.onSuccess?.();
    setSuccessMessage(options.successMessage);
    setActionKey(null);
    await loadAdminData({ silent: true });
  }

  async function handleUpdateTeamStatus(
    teamId: string,
    teamName: string,
    status: "completed" | "cancelled"
  ) {
    await sendAdminAction(
      {
        action: "updateTeamStatus",
        teamId,
        status,
      },
      {
        pendingKey: `${status}-${teamId}`,
        successMessage:
          language === "fr"
            ? `Le party ${teamName} a été marqué comme ${formatPartyStatus(status, language).toLowerCase()}.`
            : `${teamName} was marked as ${status}.`,
      }
    );
  }

  async function handleRejectCompletionRequest(teamId: string, teamName: string) {
    await sendAdminAction(
      {
        action: "rejectTeamCompletionRequest",
        teamId,
      },
      {
        pendingKey: `reject-${teamId}`,
        successMessage:
          language === "fr"
            ? `La demande de complétion pour le party ${teamName} a été refusée.`
            : `Completion request for ${teamName} was rejected.`,
      }
    );
  }

  return (
    <div className="grid gap-4">
      {!isAdmin ? (
        <Card className="border border-red-200 shadow-none dark:border-red-500/20 dark:bg-[#1a1a22]">
          <CardContent className="pt-5">
            <h1 className="text-2xl font-semibold tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
              {language === "fr" ? "Accès refusé" : "Access denied"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-app-secondary">
              {language === "fr"
                ? "Cet écran admin matchmaking est réservé aux adresses email admin approuvées."
                : "This admin matchmaking screen is restricted to approved admin email addresses."}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {isAdmin ? (
        <>
          <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none dark:bg-[linear-gradient(135deg,#6d5ce8_0%,#5f50d2_100%)]">
            <CardHeader>
              <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
                {language === "fr"
                  ? "Créez les équipes manuellement, supervisez légèrement."
                  : "Build teams manually, supervise lightly."}
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-base leading-7 text-white/82">
                {language === "fr"
                  ? "Les admins créent les équipes depuis la file, puis les équipes configurent leur projet en libre-service."
                  : "Admins create teams from the queue, then teams create their own project setup in self-service."}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border border-[#ece8f8] shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
              <CardHeader>
                <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
                  {language === "fr" ? "Profils en attente" : "Waiting profiles"}
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-app-secondary">
                  {language === "fr"
                    ? "Chaque utilisateur marqué `waiting` apparaît ici pour la création manuelle d’équipe."
                    : "Every user currently marked as `waiting` appears here for manual team creation."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center justify-between rounded-[1.2rem] bg-[#faf8ff] p-4 dark:bg-[#16161d]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-app-overline">
                      {language === "fr" ? "Utilisateurs en attente" : "Waiting users"}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38] dark:text-[#f2f2f5]">
                      {waitingCandidates.length}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadAdminData({ silent: true })}
                    disabled={isRefreshing}
                    className="rounded-full border-[#e8e2f7] bg-white text-[#1f1c38] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#f2f2f5] dark:hover:bg-[#23232c]"
                  >
                    {isRefreshing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {language === "fr" ? "Actualisation..." : "Refreshing..."}
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="size-4" />
                        {language === "fr" ? "Actualiser" : "Refresh"}
                      </>
                    )}
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex min-h-[180px] items-center justify-center rounded-[1.5rem] bg-[#faf8ff] dark:bg-[#16161d]">
                    <Loader2 className="size-6 animate-spin text-[#7650ff]" />
                  </div>
                ) : waitingCandidates.length === 0 ? (
                  <div className="rounded-[1.5rem] bg-[#faf8ff] p-6 text-sm text-app-secondary dark:bg-[#16161d] dark:text-muted-foreground">
                    {language === "fr"
                      ? "Aucun profil n’est actuellement en attente dans la file."
                      : "No profiles are currently waiting in the queue."}
                  </div>
                ) : (
                  <div className="rounded-[1rem] border border-[#ece8f8] bg-[#fcfbff] dark:border-[#27272f] dark:bg-[#1a1a22]">
                  {waitingCandidates.map((candidate) => {
                    const selected = selectedUserIds.includes(candidate.profile.id);
                    const queuedDays = getQueuedDays(candidate.queue.created_at);
                    return (
                      <button
                        key={candidate.profile.id}
                        type="button"
                        onClick={() => toggleCandidate(candidate.profile.id)}
                        className={`flex w-full items-center justify-between gap-3 border-b px-3 py-2.5 text-left transition last:border-b-0 ${
                          selected
                            ? "border-[#e8defd] bg-[#f1ebff] dark:border-[#3a3450] dark:bg-[#262235]"
                            : "border-[#ece8f8] bg-[#fcfbff] hover:bg-[#faf8ff] dark:border-[#27272f] dark:bg-[#1a1a22] dark:hover:bg-[#23232c]"
                        }`}
                      >
                        <div className="min-w-0 flex flex-1 items-center gap-3">
                          <ProfileAvatar
                            name={candidate.profile.display_name}
                            avatarUrl={candidate.profile.avatar_url}
                            className="size-9 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">
                              {candidate.profile.display_name}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-app-secondary">
                              {formatLanguageValue(candidate.profile.language, language)} · {formatTimezoneValue(candidate.profile.timezone)}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] text-app-overline dark:text-[#a698ff]">
                              {candidate.profile.skills.slice(0, 3).join(" · ") ||
                                (language === "fr" ? "Aucune stack sélectionnée" : "No stack selected")}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full border border-[#e8e2f7] bg-white px-2 py-1 text-[10px] font-medium text-[#7650ff] dark:border-[#27272f] dark:bg-[#23232c] dark:text-[#a698ff]">
                            {formatProjectTypeList(candidate.profile.project_type, language)}
                          </span>
                          <span className="text-[10px] text-app-overline">
                            {queuedDays}d
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-[#ece8f8] shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
              <CardHeader>
                <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
                  {language === "fr" ? "Créateur de party" : "Party builder"}
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-app-secondary">
                  {language === "fr"
                    ? "Sélectionnez les membres, puis créez le party."
                    : "Select members, then create the party."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="rounded-[1rem] bg-[#faf8ff] p-3.5 dark:bg-[#16161d]">
                  <p className="text-xs uppercase tracking-[0.18em] text-app-overline">
                    {language === "fr" ? "Membres sélectionnés" : "Selected members"}
                  </p>
                  <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#1f1c38] dark:text-[#f2f2f5]">
                    {selectedCandidates.length} / {maxTeamSize}
                  </p>
                  <p className="mt-1 text-xs text-app-secondary">
                    {minTeamSize} {language === "fr" ? "à" : "to"} {maxTeamSize} {language === "fr" ? "membres recommandés." : "members recommended."}
                  </p>
                </div>

                <div className="grid gap-3">
                  {selectedCandidates.length > 0 ? (
                    selectedCandidates.map((candidate) => (
                      <div
                        key={candidate.profile.id}
                        className="rounded-[0.95rem] bg-[#faf8ff] px-3 py-2.5 dark:bg-[#16161d]"
                      >
                        <div className="flex items-center gap-3">
                          <ProfileAvatar
                            name={candidate.profile.display_name}
                            avatarUrl={candidate.profile.avatar_url}
                            className="size-8 shrink-0"
                          />
                          <p className="text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">
                            {candidate.profile.display_name}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1rem] bg-[#faf8ff] p-4 text-sm text-app-secondary dark:bg-[#16161d] dark:text-muted-foreground">
                      {language === "fr"
                        ? "Sélectionnez 3 à 4 développeurs en attente pour créer un party."
                        : "Select 3 to 4 waiting developers to build a party."}
                    </div>
                  )}
                </div>

                {errorMessage ? <FeedbackBanner tone="error" message={errorMessage} /> : null}

                {successMessage ? (
                  <div className="grid gap-3">
                    {successMessage.includes("marked as completed") ? (
                      <Mascot pose="celebration" size="lg" animate centered />
                    ) : null}
                    <FeedbackBanner tone="success" message={successMessage} />
                  </div>
                ) : null}

                <Button
                  type="button"
                  onClick={handleCreateTeam}
                  disabled={isCreating || !canCreateTeam}
                  className="h-11 rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#947cff_100%)] text-white hover:opacity-95"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {language === "fr" ? "Création du party..." : "Creating party..."}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" />
                      {language === "fr" ? "Créer le party" : "Create party"}
                    </>
                  )}
                </Button>

              </CardContent>
            </Card>
          </div>

          <Card className="border border-[#ece8f8] shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
            <CardHeader>
              <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
                {language === "fr" ? "Historique des parties" : "Party history"}
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-app-secondary">
                {language === "fr"
                  ? "Contrôles admin minimaux pour les parties actives, complétées et annulées."
                  : "Minimal admin controls for active, completed, and cancelled parties."}
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {isLoading ? (
                <div className="flex min-h-[160px] items-center justify-center rounded-[1.5rem] bg-[#faf8ff] dark:bg-[#16161d]">
                  <Loader2 className="size-6 animate-spin text-[#7650ff]" />
                </div>
              ) : formedTeams.length === 0 ? (
                <div className="rounded-[1.5rem] bg-[#faf8ff] p-6 text-sm text-app-secondary dark:bg-[#16161d] dark:text-muted-foreground">
                  {language === "fr" ? "Aucun party n’a encore été formé." : "No parties have been formed yet."}
                </div>
              ) : (
                formedTeams.map((item) => (
                  <div
                    key={item.team.id}
                    className="rounded-[1rem] border border-[#ece8f8] bg-[#fcfbff] p-3.5 dark:border-[#27272f] dark:bg-[#16161d]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#1f1c38] dark:text-[#f2f2f5]">
                          Party ID {item.team.party_id}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getPartyStatusClasses(item.team.status)}`}>
                            {formatPartyStatus(item.team.status, language)}
                          </span>
                          <span className="text-xs text-app-secondary">
                            {language === "fr" ? "Créée" : "Created"} {formatCreatedDate(item.team.created_at, language)}
                          </span>
                        </div>
                        {item.team.completion_requested_at ? (
                          <p className="mt-1 text-[11px] text-[#5b45d9] dark:text-[#a698ff]">
                            {language === "fr" ? "Complétion demandée" : "Completion requested"} {formatCreatedDate(item.team.completion_requested_at, language)}
                            {item.team.completion_requested_by
                              ? language === "fr"
                                ? ` par ${item.members.find((member) => member.id === item.team.completion_requested_by)?.display_name ?? "un membre"}`
                                : ` by ${item.members.find((member) => member.id === item.team.completion_requested_by)?.display_name ?? "a member"}`
                              : ""}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void handleUpdateTeamStatus(item.team.id, item.team.party_id, "completed")}
                          disabled={
                            actionKey === `completed-${item.team.id}` ||
                            item.team.status === "completed"
                          }
                          className="h-8 rounded-full border-[#d6efdf] bg-white px-3 text-[#208a52] hover:bg-[#f7fff9] dark:border-[#244a35] dark:bg-[#1a1a22] dark:text-[#7dd7a4] dark:hover:bg-[#1f2a24]"
                        >
                            {actionKey === `completed-${item.team.id}` ? (
                            language === "fr" ? "Mise à jour..." : "Updating..."
                          ) : (
                            <>
                              <CheckCircle2 className="size-3.5" />
                              {language === "fr" ? "Compléter" : "Complete"}
                            </>
                          )}
                        </Button>
                        {item.team.completion_requested_at ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void handleRejectCompletionRequest(item.team.id, item.team.party_id)}
                            disabled={actionKey === `reject-${item.team.id}`}
                            className="h-8 rounded-full border-[#e8e2f7] bg-white px-3 text-[#5f587f] hover:bg-[#faf8ff] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#c2bdd8] dark:hover:bg-[#23232c]"
                          >
                            {actionKey === `reject-${item.team.id}`
                              ? language === "fr"
                                ? "Mise à jour..."
                                : "Updating..."
                              : language === "fr"
                                ? "Refuser"
                                : "Reject"}
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void handleUpdateTeamStatus(item.team.id, item.team.party_id, "cancelled")}
                          disabled={
                            actionKey === `cancelled-${item.team.id}` ||
                            item.team.status === "cancelled"
                          }
                          className="h-8 rounded-full border-[#f1d4dc] bg-white px-3 text-[#a14b63] hover:bg-[#fff7f9] dark:border-[#4a2731] dark:bg-[#1a1a22] dark:text-[#f09ab0] dark:hover:bg-[#2a1d22]"
                        >
                            {actionKey === `cancelled-${item.team.id}` ? (
                            language === "fr" ? "Mise à jour..." : "Updating..."
                          ) : (
                            <>
                              <XCircle className="size-3.5" />
                              {language === "fr" ? "Annuler" : "Cancel"}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.members.map((member) => (
                        <span
                          key={member.id}
                          className="rounded-full bg-[#f3eeff] px-2 py-1 text-[11px] text-[#5b45d9] dark:bg-[#23232c] dark:text-[#a698ff]"
                        >
                          {member.display_name}
                        </span>
                      ))}
                    </div>

                    <p className="mt-2 text-xs text-app-secondary">
                      {item.project?.github_repo_url ? (
                        <a
                          href={item.project.github_repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#5b45d9] underline-offset-4 hover:underline dark:text-[#a698ff]"
                        >
                          {item.project.github_repo_url}
                        </a>
                      ) : (
                        language === "fr" ? "Aucun repo GitHub lié pour le moment." : "No GitHub repo linked yet."
                      )}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function formatPartyStatus(
  status: "active" | "completed" | "cancelled",
  language: "en" | "fr" = "en"
) {
  if (language === "fr") {
    if (status === "active") return "Active";
    if (status === "completed") return "Complétée";
    return "Annulée";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getPartyStatusClasses(status: "active" | "completed" | "cancelled") {
  if (status === "active") return "bg-[#ece4ff] text-[#5b45d9] dark:bg-[#272138] dark:text-[#a698ff]";
  if (status === "completed") return "bg-[#e9f9ef] text-[#208a52] dark:bg-[#1f2a24] dark:text-[#7dd7a4]";
  return "bg-[#fff0f3] text-[#b84b66] dark:bg-[#2a1d22] dark:text-[#f09ab0]";
}

function getQueuedDays(createdAt: string) {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const difference = now.getTime() - createdDate.getTime();
  return Math.max(1, Math.ceil(difference / (1000 * 60 * 60 * 24)));
}

function formatCreatedDate(createdAt: string, language: "en" | "fr" = "en") {
  return new Intl.DateTimeFormat(language === "fr" ? "fr-CA" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(createdAt));
}
