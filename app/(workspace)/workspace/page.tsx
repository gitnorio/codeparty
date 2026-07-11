"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Link2, Loader2, Sparkles, Users } from "lucide-react";

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

export default function WorkspacePage() {
  const supabase = getSupabaseBrowserClient();
  const profile = useWorkspaceProfile();
  const { snapshot, isLoading, errorMessage, refreshSnapshot } = useWorkspaceSnapshot(profile.id);
  const currentUserProjectMember = snapshot?.projectMembers.find(
    (item) => item.profile.id === profile.id
  );
  const projectMembersByUserId = new Map(
    (snapshot?.projectMembers ?? []).map((item) => [item.profile.id, item] as const)
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
          projectRole:
            assignments[member.profile.id]?.projectRole ??
            mapGoalToProjectRole(member.profile.goal),
          contributionSummary:
            assignments[member.profile.id]?.contributionSummary.trim() || null,
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
            Workspace
          </Badge>
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
      ) : !snapshot?.currentTeam ? (
        <EmptyStatePanel
          icon={Users}
          title="No active team yet"
          description="Once you are matched, this screen becomes the single place for your team members, project setup, and GitHub link."
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <SignalCard
              label="Current team"
              value={snapshot.currentTeam.name}
              detail={`${snapshot.teamMembers.length} members · ${formatProjectLabel(snapshot.currentTeam.status)}`}
            />
            <SignalCard
              label="Current project"
              value={snapshot.currentProject?.name ?? "Not created yet"}
              detail={
                snapshot.currentProject
                  ? formatProjectLabel(snapshot.currentProject.status)
                  : "Create the first shared project for this team."
              }
            />
            <SignalCard
              label="Your role"
              value={
                currentUserProjectMember
                  ? formatProjectLabel(currentUserProjectMember.membership.project_role)
                  : "Not assigned"
              }
              detail="Roles stay visible here once the project is created."
            />
          </div>

          {!snapshot.currentProject ? (
            <div className="grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
              <Card className="border border-[#ece8f8] shadow-none">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">
                    Team members
                  </CardTitle>
                  <CardDescription className="text-sm leading-6 text-[#6a6683]">
                    Everyone currently active in the team and ready for the first shared build.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {snapshot.teamMembers.map((member) => {
                    const projectMember = projectMembersByUserId.get(member.profile.id);

                    return (
                      <div
                        key={member.profile.id}
                        className="rounded-[1.1rem] border border-[#ece8f8] bg-[#fcfbff] p-3.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-medium text-[#1f1c38]">
                              {member.profile.display_name}
                            </p>
                            <p className="mt-1 text-sm text-[#6a6683]">
                              {formatProjectLabel(member.profile.level)} · {formatProjectLabel(member.profile.goal)}
                            </p>
                          </div>
                          <Badge variant="outline" className="rounded-full bg-white text-[#7650ff]">
                            {formatProjectLabel(member.membership.member_status)}
                          </Badge>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {member.profile.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-[#f3eeff] px-2.5 py-1 text-xs text-[#5b45d9]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        <p className="mt-3 text-sm leading-6 text-[#6a6683]">
                          {member.profile.availability_per_week}h / week · {formatProjectLabel(member.profile.project_type)}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-[#6a6683]">
                          {projectMember
                            ? `Planned role: ${formatProjectLabel(projectMember.membership.project_role)}`
                            : "Project role will be set during project creation."}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border border-[#ece8f8] shadow-none">
                <CardHeader>
                  <Badge variant="outline" className="w-fit rounded-full bg-[#f6f2ff] text-[#7650ff]">
                    Team-owned setup
                  </Badge>
                  <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">
                    Create your team project
                  </CardTitle>
                  <CardDescription className="text-sm leading-6 text-[#6a6683]">
                    Keep the setup lean: define the repo, the stack, and one role per teammate.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="rounded-[1.15rem] bg-[linear-gradient(135deg,rgba(116,72,255,0.12)_0%,rgba(142,107,255,0.16)_100%)] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8f84bc]">Before you paste the repo URL</p>
                    <div className="mt-3 grid gap-2">
                      {[
                        "1. One teammate creates the repository on GitHub.",
                        "2. Add the other teammates as collaborators.",
                        "3. Paste the public repository link here and complete the project setup.",
                      ].map((item) => (
                        <div
                          key={item}
                          className="rounded-[1rem] border border-white/60 bg-white/70 px-3 py-2 text-sm leading-6 text-[#5f587f]"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Field label="Project name">
                    <Input
                      value={formData.name}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder={defaultProjectName || "CodeParty Project"}
                      className="h-10 rounded-[0.9rem] border-[#e8e2f7] bg-[#fcfbff] px-3.5"
                    />
                  </Field>

                  <Field label="Description and goals">
                    <textarea
                      value={formData.description}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, description: event.target.value }))
                      }
                      rows={3}
                      placeholder="Describe the project scope, what the team wants to ship, and the main objectives."
                      className="w-full rounded-[0.9rem] border border-[#e8e2f7] bg-[#fcfbff] px-3.5 py-2.5 text-sm text-[#1f1c38] outline-none transition placeholder:text-[#a9a3c2] focus:border-[#7b61ff]/45"
                    />
                  </Field>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Project stack">
                      <Input
                        value={formData.stackInput}
                        onChange={(event) =>
                          setFormData((current) => ({ ...current, stackInput: event.target.value }))
                        }
                        placeholder="Next.js, TypeScript, Supabase"
                        className="h-10 rounded-[0.9rem] border-[#e8e2f7] bg-[#fcfbff] px-3.5"
                      />
                    </Field>

                    <Field label="GitHub repository URL">
                      <Input
                        value={formData.githubRepoUrl}
                        onChange={(event) =>
                          setFormData((current) => ({ ...current, githubRepoUrl: event.target.value }))
                        }
                        placeholder="https://github.com/owner/repo"
                        className="h-10 rounded-[0.9rem] border-[#e8e2f7] bg-[#fcfbff] px-3.5"
                      />
                    </Field>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {stackPreview.length > 0
                      ? stackPreview.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-[#f3eeff] px-2.5 py-1 text-xs text-[#5b45d9]"
                          >
                            {item}
                          </span>
                        ))
                      : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Planned start date">
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(event) =>
                          setFormData((current) => ({ ...current, startDate: event.target.value }))
                        }
                        className="h-10 rounded-[0.9rem] border-[#e8e2f7] bg-[#fcfbff] px-3.5"
                      />
                    </Field>
                    <Field label="Planned end date">
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(event) =>
                          setFormData((current) => ({ ...current, endDate: event.target.value }))
                        }
                        className="h-10 rounded-[0.9rem] border-[#e8e2f7] bg-[#fcfbff] px-3.5"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#4f496e]">Member roles</p>
                      <p className="mt-1 text-sm leading-6 text-[#6a6683]">
                        Assign one clear role per teammate for kickoff.
                      </p>
                    </div>
                    {snapshot.teamMembers.map((member) => (
                      <div
                        key={member.profile.id}
                        className="rounded-[1.1rem] border border-[#ece8f8] bg-[#fcfbff] p-3.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-medium text-[#1f1c38]">
                              {member.profile.display_name}
                            </p>
                            <p className="mt-1 text-sm text-[#6a6683]">
                              {formatProjectLabel(member.profile.goal)} · {formatProjectLabel(member.profile.level)}
                            </p>
                          </div>
                          <Badge variant="outline" className="rounded-full bg-white text-[#7650ff]">
                            Active teammate
                          </Badge>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
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
                                    ? "rounded-full border border-[#8d78ff] bg-[#f1ebff] px-3 py-1.5 text-xs font-medium text-[#5b45d9]"
                                    : "rounded-full border border-[#e8e2f7] bg-white px-3 py-1.5 text-xs font-medium text-[#5f587f]"
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
                          className="mt-3 w-full rounded-[0.9rem] border border-[#e8e2f7] bg-white px-3.5 py-2.5 text-sm text-[#1f1c38] outline-none transition placeholder:text-[#a9a3c2] focus:border-[#7b61ff]/45"
                        />
                      </div>
                    ))}
                  </div>

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
                <Card className="border border-[#ece8f8] shadow-none">
                  <CardHeader>
                    <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">
                      Team members
                    </CardTitle>
                    <CardDescription className="text-sm leading-6 text-[#6a6683]">
                      The people currently attached to this team and the roles visible in the project.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {snapshot.teamMembers.map((member) => {
                      const projectMember = projectMembersByUserId.get(member.profile.id);

                      return (
                        <div
                          key={member.profile.id}
                          className="rounded-[1.1rem] border border-[#ece8f8] bg-[#fcfbff] p-3.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-medium text-[#1f1c38]">
                                {member.profile.display_name}
                              </p>
                              <p className="mt-1 text-sm text-[#6a6683]">
                                {formatProjectLabel(member.profile.level)} · {formatProjectLabel(member.profile.goal)}
                              </p>
                            </div>
                            <Badge variant="outline" className="rounded-full bg-white text-[#7650ff]">
                              {projectMember
                                ? formatProjectLabel(projectMember.membership.project_role)
                                : formatProjectLabel(member.membership.member_status)}
                            </Badge>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {member.profile.skills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="rounded-full bg-[#f3eeff] px-2.5 py-1 text-xs text-[#5b45d9]"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <div className="grid gap-4">
                  <Card className="border border-[#ece8f8] shadow-none">
                    <CardHeader>
                      <Badge variant="outline" className="w-fit rounded-full bg-[#f6f2ff] text-[#7650ff]">
                        Project details
                      </Badge>
                      <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">
                        {snapshot.currentProject.name}
                      </CardTitle>
                      <CardDescription className="text-sm leading-6 text-[#6a6683]">
                        {snapshot.currentProject.description || "The team has not added a description yet."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      <div className="rounded-[1.15rem] bg-[#faf8ff] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#8f84bc]">Repository</p>
                        <p className="mt-1 text-base font-medium text-[#1f1c38]">
                          {snapshot.currentProject.github_repo_url
                            ? repoLabel(snapshot.currentProject.github_repo_url)
                            : "Not linked yet"}
                        </p>
                        {snapshot.currentProject.github_repo_url ? (
                          <a
                            href={snapshot.currentProject.github_repo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#5b45d9] underline-offset-4 hover:underline"
                          >
                            <Link2 className="size-4" />
                            Open repository
                          </a>
                        ) : null}
                      </div>

                      <div className="rounded-[1.15rem] bg-[#faf8ff] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#8f84bc]">Core stack</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {snapshot.currentProject.stack.map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-white px-2.5 py-1 text-xs text-[#5b45d9]"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-[#ece8f8] shadow-none">
                    <CardHeader>
                      <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">
                        Project roles
                      </CardTitle>
                      <CardDescription className="text-sm leading-6 text-[#6a6683]">
                        The visible project responsibilities attached to the current team build.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      {snapshot.projectMembers.length > 0 ? (
                        snapshot.projectMembers.map((item) => (
                          <div
                            key={item.membership.id}
                            className="rounded-[1.1rem] border border-[#ece8f8] bg-[#fcfbff] p-3.5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-base font-medium text-[#1f1c38]">
                                  {item.profile.display_name}
                                </p>
                                <p className="mt-1 text-sm text-[#6a6683]">
                                  {formatProjectLabel(item.membership.project_role)}
                                </p>
                              </div>
                              <Badge variant="outline" className="rounded-full bg-white text-[#7650ff]">
                                {formatProjectLabel(item.profile.level)}
                              </Badge>
                            </div>
                            {item.membership.contribution_summary ? (
                              <p className="mt-2 text-sm leading-6 text-[#6a6683]">
                                {item.membership.contribution_summary}
                              </p>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[1.15rem] bg-[#faf8ff] p-4 text-sm text-[#6a6683]">
                          Project roles have not been assigned yet.
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
      <Label className="mb-2 block text-sm font-medium text-[#4f496e]">{label}</Label>
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
    <Card className="border border-[#ece8f8] shadow-none">
      <CardContent className="pt-5">
        <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">{label}</p>
        <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#1f1c38]">{value}</p>
        <p className="mt-1 text-sm leading-6 text-[#6a6683]">{detail}</p>
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
