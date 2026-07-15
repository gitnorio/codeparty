"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Link2, Loader2, Search, Sparkles, Users } from "lucide-react";

import { EmptyStatePanel, FeedbackBanner, LoadingPanel } from "@/components/app/feedback";
import { ProfileAvatar } from "@/components/app/profile-avatar";
import { useWorkspaceProfile } from "@/components/app/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLanguageValue } from "@/lib/profile-options";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatProjectLabel } from "@/lib/team-projects";
import { useWorkspaceSnapshot } from "@/lib/workspace-data";

export default function WorkspacePage() {
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const profile = useWorkspaceProfile();
  const selectedPartyId = searchParams.get("party");
  const { snapshot, isLoading, errorMessage, refreshSnapshot } = useWorkspaceSnapshot(
    profile.id,
    selectedPartyId
  );
  const parties = useMemo(() => snapshot?.allTeams ?? [], [snapshot?.allTeams]);
  const [partySearchInput, setPartySearchInput] = useState("");
  const [partySearchQuery, setPartySearchQuery] = useState("");
  const [currentPartyPage, setCurrentPartyPage] = useState(1);
  const [showPartySuggestions, setShowPartySuggestions] = useState(false);
  const partiesPerPage = 5;

  const [formData, setFormData] = useState({
    description: "",
    githubRepoUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingCompletion, setIsRequestingCompletion] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const defaultProjectName = snapshot?.currentTeam
    ? `Party ${snapshot.currentTeam.party_id} Project`
    : "";
  const completionRequester = useMemo(
    () =>
      snapshot?.teamMembers.find(
        (member) => member.profile.id === snapshot.currentTeam?.completion_requested_by
      )?.profile.display_name ?? null,
    [snapshot]
  );
  const filteredParties = useMemo(() => {
    const normalizedQuery = partySearchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return parties;
    }

    return parties.filter((party) => party.party_id.toLowerCase().includes(normalizedQuery));
  }, [parties, partySearchQuery]);
  const partySuggestions = useMemo(() => {
    const normalizedInput = partySearchInput.trim().toLowerCase();

    if (!normalizedInput) {
      return [];
    }

    return [...parties]
      .filter((party) => party.party_id.toLowerCase().includes(normalizedInput))
      .sort((firstParty, secondParty) => {
        const firstStartsWith = firstParty.party_id.toLowerCase().startsWith(normalizedInput);
        const secondStartsWith = secondParty.party_id.toLowerCase().startsWith(normalizedInput);

        if (firstStartsWith && !secondStartsWith) return -1;
        if (!firstStartsWith && secondStartsWith) return 1;
        return firstParty.party_id.localeCompare(secondParty.party_id);
      })
      .slice(0, 5);
  }, [parties, partySearchInput]);
  const totalPartyPages = Math.max(1, Math.ceil(filteredParties.length / partiesPerPage));
  const effectiveCurrentPartyPage = Math.min(currentPartyPage, totalPartyPages);
  const activeCurrentTeam =
    snapshot?.currentTeam?.status === "active" ? snapshot.currentTeam : null;
  const paginatedParties = useMemo(() => {
    const startIndex = (effectiveCurrentPartyPage - 1) * partiesPerPage;
    return filteredParties.slice(startIndex, startIndex + partiesPerPage);
  }, [effectiveCurrentPartyPage, filteredParties]);

  function handlePartySearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPartySearchQuery(partySearchInput);
    setCurrentPartyPage(1);
    setShowPartySuggestions(false);
  }

  function handlePartySearchChange(value: string) {
    setPartySearchInput(value);
    setPartySearchQuery(value);
    setCurrentPartyPage(1);
    setShowPartySuggestions(true);
  }

  function handlePartySuggestionSelect(partyId: string) {
    setPartySearchInput(partyId);
    setPartySearchQuery(partyId);
    setCurrentPartyPage(1);
    setShowPartySuggestions(false);
  }

  function handleClearPartySearch() {
    setPartySearchInput("");
    setPartySearchQuery("");
    setCurrentPartyPage(1);
    setShowPartySuggestions(false);
  }

  async function handleCreateProject() {
    if (!snapshot?.currentTeam) {
      setSubmitError("You need an active team before creating a project.");
      return;
    }

    if (!formData.githubRepoUrl.trim()) {
      setSubmitError("Paste your public GitHub repository URL before creating the project.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      setSubmitError(sessionError?.message ?? "Missing authenticated session.");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/team-project", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        name: defaultProjectName || "CodeParty Project",
        description: formData.description.trim() || null,
        githubRepoUrl: formData.githubRepoUrl.trim(),
      }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setSubmitError(payload.error ?? "Failed to create the project.");
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("Your team project is now live in the workspace.");
    setIsSubmitting(false);
    await refreshSnapshot();
  }

  async function handleRequestCompletion() {
    if (!snapshot?.currentTeam) {
      setSubmitError("You need an active party before requesting completion.");
      return;
    }

    setIsRequestingCompletion(true);
    setSubmitError(null);
    setSuccessMessage(null);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      setSubmitError(sessionError?.message ?? "Missing authenticated session.");
      setIsRequestingCompletion(false);
      return;
    }

    const response = await fetch(`/api/teams/${snapshot.currentTeam.id}/completion-request`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setSubmitError(payload.error ?? "Failed to request completion.");
      setIsRequestingCompletion(false);
      return;
    }

    setSuccessMessage("Completion request sent to admin for review.");
    setIsRequestingCompletion(false);
    await refreshSnapshot();
  }

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none dark:bg-[linear-gradient(135deg,#6d5ce8_0%,#5f50d2_100%)]">
        <CardHeader>
          <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
            Keep the team and project in one place.
          </CardTitle>
          <CardDescription className="mt-2 max-w-2xl text-base leading-7 text-white/82">
            This is the operational view for your current team, your shared repository, and the project setup your group owns together.
          </CardDescription>
        </CardHeader>
      </Card>

      {errorMessage ? <FeedbackBanner tone="error" message={errorMessage} /> : null}
      {submitError ? <FeedbackBanner tone="error" message={submitError} /> : null}
      {successMessage ? <FeedbackBanner tone="success" message={successMessage} /> : null}

      {isLoading ? (
        <LoadingPanel message="Loading workspace..." />
      ) : !selectedPartyId ? (
        <Card className="border border-[#ece8f8] shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
              All parties
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-app-secondary">
              Select a party to open its dedicated workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parties.length === 0 ? (
              <div className="rounded-[1rem] bg-[#faf8ff] p-4 text-sm text-app-secondary dark:bg-[#16161d] dark:text-muted-foreground">
                No parties available yet.
              </div>
            ) : (
              <div className="grid gap-3">
                <form
                  onSubmit={handlePartySearchSubmit}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center"
                >
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-app-secondary" />
                    <Input
                      value={partySearchInput}
                      onChange={(event) => handlePartySearchChange(event.target.value)}
                      onFocus={() => setShowPartySuggestions(true)}
                      onBlur={() => {
                        window.setTimeout(() => setShowPartySuggestions(false), 120);
                      }}
                      placeholder="Search by Party ID"
                      className="h-10 rounded-[0.9rem] border-[#e8e2f7] bg-[#fcfbff] pl-9 dark:border-[#27272f] dark:bg-[#16161d] dark:text-[#f2f2f5]"
                    />
                    {showPartySuggestions && partySuggestions.length > 0 ? (
                      <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-20 overflow-hidden rounded-[1rem] border border-[#e8e2f7] bg-white shadow-[0_18px_45px_rgba(113,87,255,0.12)] dark:border-[#27272f] dark:bg-[#1a1a22] dark:shadow-[0_18px_45px_rgba(0,0,0,0.3)]">
                        {partySuggestions.map((party) => (
                          <button
                            key={party.id}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handlePartySuggestionSelect(party.party_id)}
                            className="flex w-full items-center justify-between border-b border-[#f0ebfb] px-3 py-2.5 text-left transition hover:bg-[#faf8ff] dark:border-[#27272f] dark:hover:bg-[#23232c] last:border-b-0"
                          >
                            <span className="text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">
                              Party {party.party_id}
                            </span>
                            <span className="text-[11px] text-app-secondary">
                              {formatProjectLabel(party.status)}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="h-10 rounded-full bg-[#7650ff] px-4 text-white hover:bg-[#6744f0]"
                    >
                      Search
                    </Button>
                    {(partySearchInput || partySearchQuery) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClearPartySearch}
                        className="h-10 rounded-full border-[#e8e2f7] bg-white px-4 text-[#1f1c38] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#f2f2f5]"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </form>

                {filteredParties.length === 0 ? (
                  <div className="rounded-[1rem] bg-[#faf8ff] p-4 text-sm text-app-secondary dark:bg-[#16161d] dark:text-muted-foreground">
                    No party matches this ID.
                  </div>
                ) : (
                  <>
                    <div className="rounded-[1rem] border border-[#ece8f8] bg-[#fcfbff] dark:border-[#27272f] dark:bg-[#16161d]">
                      {paginatedParties.map((party) => (
                        <Link
                          key={party.id}
                          href={`/workspace?party=${party.id}`}
                          className="flex items-center justify-between gap-3 border-b px-4 py-3 transition hover:bg-[#faf8ff] dark:border-[#27272f] dark:hover:bg-[#1a1a22] last:border-b-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">Party {party.party_id}</p>
                            <p className="mt-0.5 text-[11px] text-app-secondary">
                              {formatProjectLabel(party.status)}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-[#5b45d9]">Open</span>
                        </Link>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-app-secondary">
                        Showing {(effectiveCurrentPartyPage - 1) * partiesPerPage + 1}–{Math.min(effectiveCurrentPartyPage * partiesPerPage, filteredParties.length)} of {filteredParties.length} parties
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentPartyPage((page) => Math.max(1, page - 1))}
                          disabled={effectiveCurrentPartyPage === 1}
                          className="h-9 rounded-full border-[#e8e2f7] bg-white px-3 text-[#1f1c38] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#f2f2f5]"
                        >
                          Previous
                        </Button>
                        <div className="rounded-full bg-[#f6f2ff] px-3 py-1 text-xs font-medium text-[#7650ff] dark:bg-[#23232c] dark:text-[#a698ff]">
                          Page {effectiveCurrentPartyPage} / {totalPartyPages}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentPartyPage((page) => Math.min(totalPartyPages, page + 1))}
                          disabled={effectiveCurrentPartyPage === totalPartyPages}
                          className="h-9 rounded-full border-[#e8e2f7] bg-white px-3 text-[#1f1c38] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#f2f2f5]"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : !snapshot?.currentTeam ? (
        <EmptyStatePanel
          icon={Users}
          title="Party not found"
          description="This party is unavailable or no longer attached to your account."
        />
      ) : (
        <>
          <div className="grid gap-4">
            <SignalCard
              label="Current team"
              value={activeCurrentTeam ? `Party ${activeCurrentTeam.party_id}` : "No active party"}
              detail={
                activeCurrentTeam
                  ? `${snapshot.teamMembers.length} members · ${formatProjectLabel(activeCurrentTeam.status)}`
                  : "You do not currently belong to an active party."
              }
            />
          </div>

          <div>
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#5b45d9] underline-offset-4 hover:underline"
            >
              <ArrowLeft className="size-4" />
              Back to all parties
            </Link>
          </div>

          {!snapshot.currentProject ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <Card className="border border-[#ece8f8] shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
                    Team members
                  </CardTitle>
                  <CardDescription className="text-sm leading-6 text-app-secondary">
                    Everyone currently active in the team and ready for the first shared build.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CompactTeamMemberList members={snapshot.teamMembers} />
                </CardContent>
              </Card>

              <Card className="border border-[#ece8f8] shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
                    Create your team project
                  </CardTitle>
                  <CardDescription className="text-sm leading-6 text-app-secondary">
                    Keep the setup lean: add the repo and a short project description.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="rounded-[1rem] bg-[linear-gradient(135deg,rgba(116,72,255,0.12)_0%,rgba(142,107,255,0.16)_100%)] p-3.5 dark:bg-[linear-gradient(135deg,rgba(109,92,232,0.16)_0%,rgba(95,80,210,0.22)_100%)]">
                    <p className="text-xs uppercase tracking-[0.18em] text-app-overline">Before you paste the repo URL</p>
                    <div className="mt-2 grid gap-1.5">
                      {[
                        "1. One teammate creates the repository on GitHub.",
                        "2. Add the other teammates as collaborators.",
                        "3. Paste the public repository link here and complete the project setup.",
                      ].map((item) => (
                        <div
                          key={item}
                          className="rounded-[0.9rem] border border-white/60 bg-white/70 px-3 py-2 text-sm leading-5 text-[#5f587f] dark:border-[#3a3450] dark:bg-[#1f1f28] dark:text-[#d0cde0]"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Field label="Description and goals">
                    <textarea
                      value={formData.description}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, description: event.target.value }))
                      }
                      rows={3}
                      placeholder="Describe the project scope, what the team wants to ship, and the main objectives."
                      className="w-full rounded-[0.9rem] border border-[#e8e2f7] bg-[#fcfbff] px-3.5 py-2.5 text-sm text-[#1f1c38] outline-none transition placeholder:text-[#a9a3c2] focus:border-[#7b61ff]/45 dark:border-[#27272f] dark:bg-[#16161d] dark:text-[#f2f2f5] dark:placeholder:text-[#747482]"
                    />
                  </Field>

                  <Field label="GitHub repository URL">
                    <Input
                      value={formData.githubRepoUrl}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, githubRepoUrl: event.target.value }))
                      }
                      placeholder="https://github.com/owner/repo"
                      className="h-10 rounded-[0.9rem] border-[#e8e2f7] bg-[#fcfbff] px-3.5 dark:border-[#27272f] dark:bg-[#16161d] dark:text-[#f2f2f5]"
                    />
                  </Field>

                  <Button
                    type="button"
                    onClick={() => void handleCreateProject()}
                    disabled={isSubmitting}
                    className="h-11 rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#947cff_100%)] text-white hover:opacity-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creating project...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        Create team project
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
                <Card className="border border-[#ece8f8] shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
                  <CardHeader>
                    <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
                      Team members
                    </CardTitle>
                    <CardDescription className="text-sm leading-6 text-app-secondary">
                      The people currently attached to this team.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CompactTeamMemberList members={snapshot.teamMembers} />
                  </CardContent>
                </Card>

                <div className="grid gap-4">
                  <Card className="border border-[#ece8f8] shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
                    <CardHeader>
                      <Badge variant="outline" className="w-fit rounded-full bg-[#f6f2ff] text-[#7650ff] dark:border-[#27272f] dark:bg-[#23232c] dark:text-[#a698ff]">
                        Repository
                      </Badge>
                      <CardDescription className="text-sm leading-6 text-app-secondary">
                        The shared GitHub repository linked to this party.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-[1.15rem] bg-[#faf8ff] p-4 dark:bg-[#16161d]">
                        <p className="text-xs uppercase tracking-[0.18em] text-app-overline">Repository</p>
                        <p className="mt-1 text-base font-medium text-[#1f1c38] dark:text-[#f2f2f5]">
                          {snapshot.currentProject.github_repo_url
                            ? repoLabel(snapshot.currentProject.github_repo_url)
                            : "Not linked yet"}
                        </p>
                        {snapshot.currentProject.github_repo_url ? (
                          <a
                          href={snapshot.currentProject.github_repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#5b45d9] underline-offset-4 hover:underline dark:text-[#a698ff]"
                        >
                          <Link2 className="size-4" />
                          Open repository
                          </a>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>

                  {snapshot.currentTeam.status === "active" ? (
                    <Card className="border border-[#ece8f8] shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
                      <CardHeader>
                        <Badge variant="outline" className="w-fit rounded-full bg-[#f6f2ff] text-[#7650ff] dark:border-[#27272f] dark:bg-[#23232c] dark:text-[#a698ff]">
                          Completion
                        </Badge>
                        <CardDescription className="text-sm leading-6 text-app-secondary">
                          When the project is done, send a completion request to admin for review.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3">
                        <div className="rounded-[1.15rem] bg-[#faf8ff] p-4 dark:bg-[#16161d]">
                          <p className="text-xs uppercase tracking-[0.18em] text-app-overline">Status</p>
                          <p className="mt-1 text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">
                            {snapshot.currentTeam.completion_requested_at
                              ? "Completion review pending"
                              : "No completion request yet"}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-app-secondary">
                            {snapshot.currentTeam.completion_requested_at
                              ? `Requested ${formatInlineDate(snapshot.currentTeam.completion_requested_at)}${completionRequester ? ` by ${completionRequester}` : ""}.`
                              : "A party member can submit a completion request once the work is ready for admin review."}
                          </p>
                        </div>

                        <Button
                          type="button"
                          onClick={() => void handleRequestCompletion()}
                          disabled={isRequestingCompletion || Boolean(snapshot.currentTeam.completion_requested_at)}
                          className="h-11 rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#947cff_100%)] text-white hover:opacity-95"
                        >
                          {isRequestingCompletion ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Sending request...
                            </>
                          ) : snapshot.currentTeam.completion_requested_at ? (
                            "Completion request pending"
                          ) : (
                            <>
                              <CheckCircle2 className="size-4" />
                              Request completion
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              </div>
            </>
          )}

        </>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label className="mb-2 block text-sm font-medium text-[#4f496e] dark:text-[#d2cede]">{label}</Label>
      {children}
    </div>
  );
}

function SignalCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border border-[#ece8f8] shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
      <CardContent className="pt-5">
        <p className="text-sm uppercase tracking-[0.18em] text-app-overline">{label}</p>
        <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#1f1c38] dark:text-[#f2f2f5]">{value}</p>
        <p className="mt-1 text-sm leading-6 text-app-secondary">{detail}</p>
      </CardContent>
    </Card>
  );
}

function CompactTeamMemberList({
  members,
}: {
  members: Array<{
    membership: {
      id: string;
      member_status: string;
    };
    profile: {
      id: string;
      display_name: string;
      avatar_url?: string | null;
      language: string;
      timezone: string;
      skills: string[];
    };
  }>;
}) {
  return (
    <div className="rounded-[1rem] border border-[#ece8f8] bg-[#fcfbff] dark:border-[#27272f] dark:bg-[#16161d]">
      {members.map((member) => (
        <div
          key={member.membership.id}
          className="flex items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0 dark:border-[#27272f]"
        >
          <div className="min-w-0 flex flex-1 items-center gap-3">
            <ProfileAvatar
              name={member.profile.display_name}
              avatarUrl={member.profile.avatar_url}
              className="size-9 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">
                {member.profile.display_name}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-app-secondary">
                {formatLanguageValue(member.profile.language)} · {member.profile.timezone}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-app-overline">
                {member.profile.skills.slice(0, 3).join(" · ") || "No stack selected"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 rounded-full bg-white text-[#7650ff] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#a698ff]">
            {formatProjectLabel(member.membership.member_status)}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function repoLabel(repoUrl: string) {
  try {
    const url = new URL(repoUrl);
    return url.pathname.replace(/^\//, "");
  } catch {
    return repoUrl;
  }
}

function formatInlineDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
