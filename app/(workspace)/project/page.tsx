"use client";

import { useMemo, useState } from "react";
import { FolderGit2, Link2, Loader2, Sparkles } from "lucide-react";

import { EmptyStatePanel, FeedbackBanner, LoadingPanel } from "@/components/app/feedback";
import { useWorkspaceProfile } from "@/components/app/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  formatProjectLabel,
  mapGoalToProjectRole,
  normalizeProjectStack,
  projectRoleOptions,
  type ProjectRole,
} from "@/lib/team-projects";
import { useWorkspaceSnapshot } from "@/lib/workspace-data";

type ProjectFormAssignment = Record<
  string,
  {
    projectRole: ProjectRole;
    contributionSummary: string;
  }
>;

export default function ProjectPage() {
  const profile = useWorkspaceProfile();
  const supabase = getSupabaseBrowserClient();
  const { snapshot, isLoading, errorMessage, refreshSnapshot } = useWorkspaceSnapshot(profile.id);
  const currentUserProjectMember = snapshot?.projectMembers.find(
    (item) => item.profile.id === profile.id
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    stackInput: "",
    githubRepoUrl: "",
    startDate: "",
    endDate: "",
  });
  const [assignments, setAssignments] = useState<ProjectFormAssignment>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const stackPreview = useMemo(
    () => normalizeProjectStack(formData.stackInput),
    [formData.stackInput]
  );
  const defaultProjectName = snapshot?.currentTeam
    ? `${snapshot.currentTeam.name} Project`
    : "";

  async function handleCreateProject() {
    if (!snapshot?.currentTeam) {
      setSubmitError("You need an active team before creating a project.");
      return;
    }

    const stack = normalizeProjectStack(formData.stackInput);

    if (!formData.name.trim()) {
      setSubmitError("Project name is required.");
      return;
    }

    if (stack.length === 0) {
      setSubmitError("Add at least one technology to your project stack.");
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
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        stack,
        githubRepoUrl: formData.githubRepoUrl.trim(),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        assignments: snapshot.teamMembers.map((member) => ({
          userId: member.profile.id,
          projectRole: assignments[member.profile.id]?.projectRole ?? mapGoalToProjectRole(member.profile.goal),
          contributionSummary: assignments[member.profile.id]?.contributionSummary.trim() || null,
        })),
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

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none">
        <CardHeader>
          <Badge className="w-fit rounded-full bg-white/14 text-white hover:bg-white/14">
            My Project
          </Badge>
          <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
            Build the real project your team wants to ship.
          </CardTitle>
          <CardDescription className="mt-2 text-lg leading-8 text-white/82">
            Project scope, stack, repo link, and each teammate’s role should stay easy to read.
          </CardDescription>
        </CardHeader>
      </Card>

      {errorMessage ? <FeedbackBanner tone="error" message={errorMessage} /> : null}

      {submitError ? <FeedbackBanner tone="error" message={submitError} /> : null}

      {successMessage ? <FeedbackBanner tone="success" message={successMessage} /> : null}

      {isLoading ? (
        <LoadingPanel message="Loading project workspace..." />
      ) : !snapshot?.currentProject ? (
        snapshot?.currentTeam ? (
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="border border-[#ece8f8] shadow-none">
              <CardHeader>
                <Badge variant="outline" className="w-fit rounded-full bg-[#f6f2ff] text-[#7650ff]">
                  Team-owned setup
                </Badge>
                <CardTitle className="text-3xl tracking-[-0.05em] text-[#1f1c38]">
                  Create your team project
                </CardTitle>
                <CardDescription className="text-base leading-7 text-[#6a6683]">
                  Your team now owns project setup directly. Admins can supervise, but they no longer create the project for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="rounded-[1.6rem] bg-[linear-gradient(135deg,rgba(116,72,255,0.12)_0%,rgba(142,107,255,0.16)_100%)] p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">Before you paste the repo URL</p>
                  <div className="mt-4 grid gap-3">
                    {[
                      "1. One teammate creates the repository on GitHub.",
                      "2. Add the other teammates as collaborators on the repository.",
                      "3. Paste the public repository link here and complete the project details.",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-[1.1rem] border border-white/60 bg-white/70 px-4 py-3 text-sm leading-7 text-[#5f587f]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#ece8f8] bg-[#fcfbff] p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">Team context</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">
                    {snapshot.currentTeam.name}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#6a6683]">
                    {snapshot.teamMembers.length} active members · {formatProjectLabel(snapshot.currentTeam.status)} team status
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-[#ece8f8] bg-[#fcfbff] p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">Selected stack</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stackPreview.length > 0 ? (
                      stackPreview.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-[#f3eeff] px-3 py-1 text-sm text-[#5b45d9]"
                        >
                          {item}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-[#6a6683]">
                        Add the technologies your team wants to use in this build.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#ece8f8] shadow-none">
              <CardHeader>
                <CardTitle className="text-3xl tracking-[-0.05em] text-[#1f1c38]">
                  Project setup form
                </CardTitle>
                <CardDescription className="text-base leading-7 text-[#6a6683]">
                  This creates the first shared project for your current team. One team can have one active project at a time.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                <Field label="Project name">
                  <Input
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder={defaultProjectName || "CodeParty Project"}
                    className="h-12 rounded-[1rem] border-[#e8e2f7] bg-[#fcfbff] px-4"
                  />
                </Field>

                <Field label="Description and goals">
                  <textarea
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, description: event.target.value }))
                    }
                    rows={4}
                    placeholder="Describe the project scope, what the team wants to ship, and the main objectives."
                    className="w-full rounded-[1rem] border border-[#e8e2f7] bg-[#fcfbff] px-4 py-3 text-sm text-[#1f1c38] outline-none transition placeholder:text-[#a9a3c2] focus:border-[#7b61ff]/45"
                  />
                </Field>

                <Field label="Project stack">
                  <Input
                    value={formData.stackInput}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, stackInput: event.target.value }))
                    }
                    placeholder="Next.js, TypeScript, Supabase"
                    className="h-12 rounded-[1rem] border-[#e8e2f7] bg-[#fcfbff] px-4"
                  />
                </Field>

                <Field label="GitHub repository URL">
                  <>
                    <Input
                      value={formData.githubRepoUrl}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, githubRepoUrl: event.target.value }))
                      }
                      placeholder="https://github.com/owner/repo"
                      className="h-12 rounded-[1rem] border-[#e8e2f7] bg-[#fcfbff] px-4"
                    />
                    <p className="mt-2 text-sm text-[#6a6683]">
                      The repository must exist already and be public so CodeParty can validate it.
                    </p>
                  </>
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Planned start date">
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, startDate: event.target.value }))
                      }
                      className="h-12 rounded-[1rem] border-[#e8e2f7] bg-[#fcfbff] px-4"
                    />
                  </Field>
                  <Field label="Planned end date">
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, endDate: event.target.value }))
                      }
                      className="h-12 rounded-[1rem] border-[#e8e2f7] bg-[#fcfbff] px-4"
                    />
                  </Field>
                </div>

                <div className="grid gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#4f496e]">Member roles</p>
                    <p className="mt-1 text-sm leading-7 text-[#6a6683]">
                      Give every active teammate one clear role for the project kickoff.
                    </p>
                  </div>
                  {snapshot.teamMembers.map((member) => (
                    <div
                      key={member.profile.id}
                      className="rounded-[1.4rem] border border-[#ece8f8] bg-[#fcfbff] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-medium text-[#1f1c38]">
                            {member.profile.display_name}
                          </p>
                          <p className="mt-1 text-sm text-[#6a6683]">
                            {formatProjectLabel(member.profile.goal)} · {formatProjectLabel(member.profile.level)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="rounded-full bg-white text-[#7650ff]"
                        >
                          Active teammate
                        </Badge>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {projectRoleOptions.map((role) => {
                          const selected = assignments[member.profile.id]?.projectRole === role;
                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() =>
                                setAssignments((current) => ({
                                  ...current,
                                  [member.profile.id]: {
                                    projectRole: role,
                                    contributionSummary:
                                      current[member.profile.id]?.contributionSummary ?? "",
                                  },
                                }))
                              }
                              className={
                                selected
                                  ? "rounded-full border border-[#8d78ff] bg-[#f1ebff] px-4 py-2 text-sm font-medium text-[#5b45d9]"
                                  : "rounded-full border border-[#e8e2f7] bg-white px-4 py-2 text-sm font-medium text-[#5f587f]"
                              }
                            >
                              {formatProjectLabel(role)}
                            </button>
                          );
                        })}
                      </div>

                      <textarea
                        value={assignments[member.profile.id]?.contributionSummary ?? ""}
                        onChange={(event) =>
                          setAssignments((current) => ({
                            ...current,
                            [member.profile.id]: {
                              projectRole:
                                current[member.profile.id]?.projectRole ??
                                mapGoalToProjectRole(member.profile.goal),
                              contributionSummary: event.target.value,
                            },
                          }))
                        }
                        rows={2}
                        placeholder="Optional: outline the main contribution this teammate will own."
                        className="mt-4 w-full rounded-[1rem] border border-[#e8e2f7] bg-white px-4 py-3 text-sm text-[#1f1c38] outline-none transition placeholder:text-[#a9a3c2] focus:border-[#7b61ff]/45"
                      />
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={() => void handleCreateProject()}
                  disabled={isSubmitting}
                  className="h-12 rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#947cff_100%)] text-white hover:opacity-95"
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
          <div className="grid gap-4 lg:grid-cols-2">
            <EmptyStatePanel
              icon={FolderGit2}
              title="Project details"
              description="Your project scope, stack, and milestones will appear here once your team opens the first shared build."
            />
            <EmptyStatePanel
              icon={Link2}
              title="GitHub repository"
              description="The shared repo URL and contribution activity will appear here once your project is linked."
            />
          </div>
        )
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <ProjectSignal
              label="Project status"
              value={formatProjectLabel(snapshot.currentProject.status)}
              detail="This is the current lifecycle state of the shared build."
            />
            <ProjectSignal
              label="Your role"
              value={
                currentUserProjectMember
                  ? formatProjectLabel(currentUserProjectMember.membership.project_role)
                  : "Not assigned"
              }
              detail="This reflects your current responsibility inside the project."
            />
            <ProjectSignal
              label="Schedule"
              value={formatProjectDateRange(
                snapshot.currentProject.start_date,
                snapshot.currentProject.end_date
              )}
              detail="Dates remain optional until your team starts tracking milestones."
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border border-[#ece8f8] shadow-none">
              <CardContent className="pt-6">
                <div className="rounded-[1.5rem] bg-[#faf8ff] p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">Project details</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">
                    {snapshot.currentProject.name}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#6a6683]">
                    {snapshot.currentProject.description || "The team has not added a project description yet."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {snapshot.currentProject.stack.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-white px-3 py-1 text-sm text-[#5b45d9]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#ece8f8] shadow-none">
              <CardContent className="pt-6">
                <div className="rounded-[1.5rem] bg-[#faf8ff] p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">GitHub repository</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">
                    {snapshot.currentProject.github_repo_url
                      ? repoLabel(snapshot.currentProject.github_repo_url)
                      : "Not linked yet"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#6a6683]">
                    Status: {formatProjectLabel(snapshot.currentProject.status)}
                  </p>
                  {snapshot.currentProject.github_repo_url ? (
                    <a
                      href={snapshot.currentProject.github_repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center rounded-full border border-[#ddd4fb] bg-white px-4 py-2 text-sm font-medium text-[#5b45d9]"
                    >
                      Open repository
                    </a>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-[#ece8f8] shadow-none">
            <CardHeader>
              <CardTitle className="text-3xl tracking-[-0.05em] text-[#1f1c38]">
                Project roles
              </CardTitle>
              <CardDescription className="text-base leading-7 text-[#6a6683]">
                Clear ownership helps the team move faster and gives each member visible proof of work.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {snapshot.projectMembers.length > 0 ? (
                snapshot.projectMembers.map((item) => (
                  <div
                    key={item.membership.id}
                    className="rounded-[1.6rem] border border-[#ece8f8] bg-[#fcfbff] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xl font-medium text-[#1f1c38]">
                          {item.profile.display_name}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[#6a6683]">
                          {formatProjectLabel(item.membership.project_role)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="rounded-full bg-white text-[#7650ff]"
                      >
                        {formatProjectLabel(item.profile.level)}
                      </Badge>
                    </div>

                    <p className="mt-4 rounded-[1.2rem] bg-[#faf8ff] p-4 text-sm leading-7 text-[#6a6683]">
                      {item.membership.contribution_summary ||
                        "Contribution summary has not been written yet."}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] bg-[#faf8ff] p-6 text-sm text-[#6a6683] lg:col-span-2">
                  Project roles have not been assigned yet.
                </div>
              )}
            </CardContent>
          </Card>
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
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-3 block text-sm font-medium text-[#4f496e]">{label}</Label>
      {children}
    </div>
  );
}

function ProjectSignal({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border border-[#ece8f8] shadow-none">
      <CardContent className="pt-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">{value}</p>
        <p className="mt-2 text-sm leading-7 text-[#6a6683]">{detail}</p>
      </CardContent>
    </Card>
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

function formatProjectDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) {
    return "Not scheduled";
  }

  if (startDate && endDate) {
    return `${startDate} → ${endDate}`;
  }

  return startDate || endDate || "Not scheduled";
}
