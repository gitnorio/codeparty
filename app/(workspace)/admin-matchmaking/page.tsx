"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";

import {
  useWorkspaceAccess,
  useWorkspaceProfile,
} from "@/components/app/workspace-shell";
import { FeedbackBanner } from "@/components/app/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FormedTeam, WaitingCandidate } from "@/lib/admin-matchmaking";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatProjectLabel } from "@/lib/team-projects";

const minTeamSize = 3;
const maxTeamSize = 4;

export default function AdminMatchmakingPage() {
  const profile = useWorkspaceProfile();
  const { isAdmin } = useWorkspaceAccess();
  const supabase = getSupabaseBrowserClient();
  const [waitingCandidates, setWaitingCandidates] = useState<WaitingCandidate[]>([]);
  const [cancelledCandidates, setCancelledCandidates] = useState<WaitingCandidate[]>([]);
  const [formedTeams, setFormedTeams] = useState<FormedTeam[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [teamName, setTeamName] = useState("");
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
      throw new Error("Missing authenticated session.");
    }

    return session.access_token;
  }, [supabase]);

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
        setErrorMessage(error instanceof Error ? error.message : "Missing session.");
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
        cancelledCandidates?: WaitingCandidate[];
        formedTeams?: FormedTeam[];
      };

      if (!response.ok) {
        setErrorMessage(payload.error ?? "Failed to load admin matchmaking data.");
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      setWaitingCandidates(payload.waitingCandidates ?? []);
      setCancelledCandidates(payload.cancelledCandidates ?? []);
      setFormedTeams(payload.formedTeams ?? []);
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [getAccessToken, isAdmin]
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

  const suggestedTeamName = useMemo(() => {
    if (selectedCandidates.length === 0) {
      return "";
    }

    const primaryProjectType = selectedCandidates[0]?.profile.project_type
      ?.replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

    return `${primaryProjectType ?? "CodeParty"} Squad`;
  }, [selectedCandidates]);

  function toggleCandidate(userId: string) {
    setSuccessMessage(null);
    setErrorMessage(null);

    setSelectedUserIds((current) => {
      const exists = current.includes(userId);

      if (exists) {
        return current.filter((item) => item !== userId);
      }

      if (current.length >= maxTeamSize) {
        setErrorMessage(`You can select up to ${maxTeamSize} members for one team.`);
        return current;
      }

      return [...current, userId];
    });
  }

  async function handleCreateTeam() {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (selectedCandidates.length < minTeamSize) {
      setErrorMessage(`Select at least ${minTeamSize} members to create a team.`);
      return;
    }

    const finalTeamName = teamName.trim() || suggestedTeamName || "CodeParty Squad";

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
        teamName: finalTeamName,
        queueIds: selectedCandidates.map((candidate) => candidate.queue.id),
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      team?: { name?: string | null };
    };

    if (!response.ok) {
      setErrorMessage(payload.error ?? "Failed to create team.");
      setIsCreating(false);
      return;
    }

    setSelectedUserIds([]);
    setTeamName("");
    setIsCreating(false);
    setSuccessMessage(`Team "${payload.team?.name}" created successfully.`);
    await loadAdminData({ silent: true });
  }

  async function sendAdminAction(
    body:
      | { action: "cancelQueue" | "reopenQueue"; queueIds: string[] }
      | {
          action: "markTeamAbandoned";
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
      setErrorMessage(payload.error ?? "Admin action failed.");
      setActionKey(null);
      return;
    }

    options.onSuccess?.();
    setSuccessMessage(options.successMessage);
    setActionKey(null);
    await loadAdminData({ silent: true });
  }

  async function handleCancelSelectedQueue() {
    if (selectedCandidates.length === 0) {
      setErrorMessage("Select at least one waiting developer to cancel.");
      return;
    }

    await sendAdminAction(
      {
        action: "cancelQueue",
        queueIds: selectedCandidates.map((candidate) => candidate.queue.id),
      },
      {
        pendingKey: "cancel-selected",
        successMessage: "Selected queue entries were cancelled.",
        onSuccess: () => {
          setSelectedUserIds([]);
          setTeamName("");
        },
      }
    );
  }

  async function handleReopenQueue(queueId: string, displayName: string) {
    await sendAdminAction(
      {
        action: "reopenQueue",
        queueIds: [queueId],
      },
      {
        pendingKey: `reopen-${queueId}`,
        successMessage: `${displayName} is back in the waiting queue.`,
      }
    );
  }

  async function handleMarkAbandoned(teamId: string, teamName: string) {
    await sendAdminAction(
      {
        action: "markTeamAbandoned",
        teamId,
      },
      {
        pendingKey: `abandon-${teamId}`,
        successMessage: `${teamName} was marked as abandoned.`,
      }
    );
  }

  return (
    <div className="grid gap-4">
      {!isAdmin ? (
        <Card className="border border-red-200 shadow-none">
          <CardContent className="pt-5">
            <h1 className="text-2xl font-semibold tracking-[-0.05em] text-[#1f1c38]">
              Access denied
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#6a6683]">
              This admin matchmaking screen is restricted to approved admin email addresses.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {isAdmin ? (
        <>
          <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none">
            <CardHeader>
              <Badge className="w-fit rounded-full bg-white/14 text-white hover:bg-white/14">
                Admin Matchmaking
              </Badge>
              <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
                Build teams manually, supervise lightly.
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-base leading-7 text-white/82">
                Admins create teams from the queue, then teams create their own project setup in self-service.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border border-[#ece8f8] shadow-none">
              <CardHeader>
                <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">
                  Waiting profiles
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-[#6a6683]">
                  Every user currently marked as `waiting` appears here for manual team creation.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center justify-between rounded-[1.2rem] bg-[#faf8ff] p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8f84bc]">
                      Waiting users
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">
                      {waitingCandidates.length}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadAdminData({ silent: true })}
                    disabled={isRefreshing}
                    className="rounded-full border-[#e8e2f7] bg-white text-[#1f1c38]"
                  >
                    {isRefreshing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="size-4" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex min-h-[180px] items-center justify-center rounded-[1.5rem] bg-[#faf8ff]">
                    <Loader2 className="size-6 animate-spin text-[#7650ff]" />
                  </div>
                ) : waitingCandidates.length === 0 ? (
                  <div className="rounded-[1.5rem] bg-[#faf8ff] p-6 text-sm text-[#6a6683]">
                    No profiles are currently waiting in the queue.
                  </div>
                ) : (
                  waitingCandidates.map((candidate) => {
                    const selected = selectedUserIds.includes(candidate.profile.id);
                    return (
                      <button
                        key={candidate.profile.id}
                        type="button"
                        onClick={() => toggleCandidate(candidate.profile.id)}
                        className={`rounded-[1.2rem] border p-4 text-left transition ${
                          selected
                            ? "border-[#8d78ff] bg-[#f1ebff] shadow-[0_18px_42px_rgba(123,97,255,0.10)]"
                            : "border-[#ece8f8] bg-[#fcfbff] hover:bg-[#faf8ff]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-lg font-medium text-[#1f1c38]">
                              {candidate.profile.display_name}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-[#6a6683]">
                              {candidate.profile.goal} · {candidate.profile.language} ·{" "}
                              {candidate.profile.availability_per_week}h / week
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="rounded-full bg-white text-[#7650ff]"
                          >
                            {candidate.profile.project_type.replaceAll("_", " ")}
                          </Badge>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {candidate.profile.skills.slice(0, 6).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-white px-2.5 py-1 text-xs text-[#5b45d9]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="border border-[#ece8f8] shadow-none">
              <CardHeader>
                <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">
                  Team builder
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-[#6a6683]">
                  Build a team from the waiting queue, pause candidates when needed, and leave project setup to the team itself.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="rounded-[1.2rem] bg-[#faf8ff] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8f84bc]">
                    Selected members
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">
                    {selectedCandidates.length} / {maxTeamSize}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#6a6683]">
                    Recommended team size: {minTeamSize} to {maxTeamSize} members.
                  </p>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-[#4f496e]">
                    Team name
                  </label>
                  <Input
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    placeholder={suggestedTeamName || "CodeParty Squad"}
                    className="h-11 rounded-[1rem] border-[#e8e2f7] bg-[#fcfbff] px-3.5"
                  />
                </div>

                <div className="grid gap-3">
                  {selectedCandidates.length > 0 ? (
                    selectedCandidates.map((candidate) => (
                      <div
                        key={candidate.profile.id}
                        className="rounded-[1.1rem] bg-[#faf8ff] p-3.5"
                      >
                        <p className="text-base font-medium text-[#1f1c38]">
                          {candidate.profile.display_name}
                        </p>
                        <p className="mt-1 text-sm text-[#6a6683]">
                          {candidate.profile.goal} · {candidate.profile.language}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.3rem] bg-[#faf8ff] p-4 text-sm text-[#6a6683]">
                      Select 3 to 4 waiting developers to build a team.
                    </div>
                  )}
                </div>

                {errorMessage ? <FeedbackBanner tone="error" message={errorMessage} /> : null}

                {successMessage ? <FeedbackBanner tone="success" message={successMessage} /> : null}

                <Button
                  type="button"
                  onClick={handleCreateTeam}
                  disabled={isCreating || !canCreateTeam}
                  className="h-11 rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#947cff_100%)] text-white hover:opacity-95"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating team...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" />
                      Create team match
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleCancelSelectedQueue()}
                  disabled={selectedCandidates.length === 0 || actionKey === "cancel-selected"}
                  className="h-11 rounded-full border-[#f1d4dc] bg-white text-[#a14b63] hover:bg-[#fff7f9]"
                >
                  {actionKey === "cancel-selected" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Cancelling selection...
                    </>
                  ) : (
                    <>
                      <XCircle className="size-4" />
                      Cancel selected queue entries
                    </>
                  )}
                </Button>

                <div className="grid gap-3 md:grid-cols-2">
                  <CriteriaCard
                    icon={Sparkles}
                    title="Review criteria"
                    detail="Language, availability, project type, goal and stack."
                  />
                  <CriteriaCard
                    icon={Users}
                    title="Admin action"
                    detail={`Created by ${profile.display_name} with manual approval.`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-[#ece8f8] shadow-none">
              <CardHeader>
                <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">
                  Cancelled queue
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-[#6a6683]">
                  Reopen any paused profile and send it back into the active waiting queue.
                </CardDescription>
              </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {isLoading ? (
                <div className="flex min-h-[160px] items-center justify-center rounded-[1.5rem] bg-[#faf8ff] lg:col-span-2">
                  <Loader2 className="size-6 animate-spin text-[#7650ff]" />
                </div>
              ) : cancelledCandidates.length === 0 ? (
                <div className="rounded-[1.5rem] bg-[#faf8ff] p-6 text-sm text-[#6a6683] lg:col-span-2">
                  No cancelled queue entries right now.
                </div>
              ) : (
                cancelledCandidates.map((candidate) => (
                  <div
                    key={candidate.queue.id}
                    className="rounded-[1.2rem] border border-[#ece8f8] bg-[#fcfbff] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-medium text-[#1f1c38]">
                          {candidate.profile.display_name}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#6a6683]">
                          {candidate.profile.goal} · {candidate.profile.language} ·{" "}
                          {candidate.profile.availability_per_week}h / week
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          void handleReopenQueue(
                            candidate.queue.id,
                            candidate.profile.display_name
                          )
                        }
                        disabled={actionKey === `reopen-${candidate.queue.id}`}
                        className="rounded-full border-[#e8e2f7] bg-white text-[#5b45d9]"
                      >
                        {actionKey === `reopen-${candidate.queue.id}` ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Reopening...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="size-4" />
                            Reopen queue
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {candidate.profile.skills.slice(0, 6).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-white px-2.5 py-1 text-xs text-[#5b45d9]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border border-[#ece8f8] shadow-none">
              <CardHeader>
              <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">
                Formed teams
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-[#6a6683]">
                Supervise every team already created through the manual admin workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {isLoading ? (
                <div className="flex min-h-[160px] items-center justify-center rounded-[1.5rem] bg-[#faf8ff] lg:col-span-2">
                  <Loader2 className="size-6 animate-spin text-[#7650ff]" />
                </div>
              ) : formedTeams.length === 0 ? (
                <div className="rounded-[1.5rem] bg-[#faf8ff] p-6 text-sm text-[#6a6683] lg:col-span-2">
                  No teams have been formed yet.
                </div>
              ) : (
                formedTeams.map((item) => (
                  <div
                    key={item.team.id}
                    className="rounded-[1.2rem] border border-[#ece8f8] bg-[#fcfbff] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-medium text-[#1f1c38]">{item.team.name}</p>
                        <p className="mt-1 text-sm text-[#6a6683]">
                          Status: {formatProjectLabel(item.team.status)}
                        </p>
                      </div>
                      <Badge variant="outline" className="rounded-full bg-white text-[#7650ff]">
                        {item.members.length} members
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.members.map((member) => (
                        <span
                          key={member.id}
                          className="rounded-full bg-[#f3eeff] px-2.5 py-1 text-xs text-[#5b45d9]"
                        >
                          {member.display_name}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 rounded-[1.2rem] bg-[#faf8ff] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[#8f84bc]">
                            Project supervision
                          </p>
                          <p className="mt-1 text-base font-medium text-[#1f1c38]">
                            {item.project?.name ?? "Project not created yet"}
                          </p>
                        </div>
                        <Badge variant="outline" className="rounded-full bg-white text-[#7650ff]">
                          {formatProjectLabel(item.project?.status ?? "pending")}
                        </Badge>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-[#6a6683]">
                        {item.project
                          ? item.project.description || "No project description has been added yet."
                          : "The team will create its own project setup from the workspace once ready."}
                      </p>

                      {item.project?.github_repo_url ? (
                        <a
                          href={item.project.github_repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex text-sm font-medium text-[#5b45d9] underline-offset-4 hover:underline"
                        >
                          {item.project.github_repo_url}
                        </a>
                      ) : null}

                      {item.project?.stack.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.project.stack.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-white px-2.5 py-1 text-xs text-[#5b45d9]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {item.projectMembers.length > 0 ? (
                        <div className="mt-4 grid gap-3">
                          {item.projectMembers.map((member) => (
                            <div
                              key={member.membership.id}
                              className="rounded-[1rem] border border-[#ece8f2] bg-white p-3.5"
                            >
                              <p className="text-sm font-medium text-[#1f1c38]">
                                {member.profile.display_name}
                              </p>
                              <p className="mt-1 text-sm text-[#6a6683]">
                                {formatProjectLabel(member.membership.project_role)}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-[#6a6683]">
                                {member.membership.contribution_summary ||
                                  "No contribution summary written yet."}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleMarkAbandoned(item.team.id, item.team.name)}
                        disabled={
                          actionKey === `abandon-${item.team.id}` ||
                          item.team.status === "cancelled"
                        }
                        className="mt-4 rounded-full border-[#f1d4dc] bg-white text-[#a14b63] hover:bg-[#fff7f9]"
                      >
                        {actionKey === `abandon-${item.team.id}` ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Mark as abandoned"
                        )}
                      </Button>
                    </div>
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

function CriteriaCard({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Sparkles;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.1rem] bg-[#faf8ff] p-3.5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#ece4ff] p-2 text-[#7650ff]">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-base font-medium text-[#1f1c38]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[#6a6683]">{detail}</p>
        </div>
      </div>
    </div>
  );
}
