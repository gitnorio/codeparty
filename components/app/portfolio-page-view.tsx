"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  Clock3,
  Copy,
  ExternalLink,
  Globe,
  MapPin,
  Moon,
  PencilLine,
  Share2,
  Sun,
  Users,
} from "lucide-react";

import { ProfileAvatar } from "@/components/app/profile-avatar";
import { useTheme } from "@/components/app/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PortfolioPageData } from "@/lib/portfolio";

export function PortfolioPageView({
  data,
  isOwner = false,
  feedback,
  editor,
  headerActions,
}: {
  data: PortfolioPageData;
  isOwner?: boolean;
  feedback?: ReactNode;
  editor?: ReactNode;
  headerActions?: {
    primaryButtonLabel: string;
    copiedLabel?: string;
    onPrimaryAction: () => void;
  };
}) {
  const [copied, setCopied] = useState(false);
  const { theme, toggleTheme } = useTheme();

  function getAbsolutePublicUrl() {
    return `${window.location.origin}${data.publicUrlPath}`;
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(getAbsolutePublicUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  const visibleSkills = data.skills.slice(0, 6);
  const hiddenSkillsCount = Math.max(0, data.skills.length - visibleSkills.length);

  return (
    <main className="min-h-screen bg-[#fbfaff] px-4 py-4 text-[#1f1c38] dark:bg-[#0d0d12] dark:text-[#f2f2f5] md:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 rounded-[2rem] border border-[#ece8f8] bg-white px-5 py-4 shadow-[0_20px_70px_rgba(113,87,255,0.08)] dark:border-[#27272f] dark:bg-[#16161d] md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#7650ff] text-lg font-bold text-white">
              C
            </div>
            <p className="text-3xl font-bold tracking-tight text-[#1f1c38] dark:text-[#f2f2f5]">
              CodeParty
            </p>
            <nav className="hidden items-center gap-8 pl-6 text-[15px] text-[#4f496e] dark:text-muted-foreground md:flex">
              <Link href="/dashboard" className="transition hover:text-[#1f1c38] dark:hover:text-[#f2f2f5]">
                Dashboard
              </Link>
              <Link href="/matchmaking" className="transition hover:text-[#1f1c38] dark:hover:text-[#f2f2f5]">
                Matchmaking
              </Link>
              <Link href="/workspace" className="transition hover:text-[#1f1c38] dark:hover:text-[#f2f2f5]">
                Workspace
              </Link>
              <Link href="/settings" className="transition hover:text-[#1f1c38] dark:hover:text-[#f2f2f5]">
                Settings
              </Link>
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-full border-[#e8e2f7] bg-white text-[#1f1c38] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#f2f2f5]"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#947cff_100%)] px-5 text-sm font-medium text-white transition hover:opacity-95"
            >
              <Copy className="size-4" />
              {copied ? "Copied" : headerActions?.copiedLabel ?? "Copy portfolio link"}
            </button>
          </div>
        </header>

        {feedback ? <div className="mb-5">{feedback}</div> : null}

        <Card className="overflow-hidden border border-[#ece8f8] bg-white shadow-[0_30px_100px_rgba(113,87,255,0.08)] dark:border-[#27272f] dark:bg-[#16161d]">
          <CardContent className="relative p-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(118,80,255,0.32),transparent_55%),radial-gradient(circle_at_top_right,rgba(118,80,255,0.12),transparent_30%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(109,92,232,0.42),transparent_55%),radial-gradient(circle_at_top_right,rgba(109,92,232,0.16),transparent_30%)]" />
            <div className="relative grid gap-8 p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <ProfileAvatar
                    name={data.profile.display_name}
                    avatarUrl={data.profile.avatar_url}
                    className="size-32 border-4 border-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:border-[#1a1a22] md:size-40"
                  />
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-4xl font-semibold tracking-[-0.06em] text-[#1f1c38] dark:text-[#f2f2f5] md:text-5xl">
                        {data.profile.display_name}
                      </h1>
                      {isOwner && headerActions ? (
                        <button
                          type="button"
                          onClick={headerActions.onPrimaryAction}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[#d9cffb] bg-white/90 px-4 text-sm font-medium text-[#5b45d9] shadow-sm transition hover:bg-[#faf8ff] dark:border-[#3a3450] dark:bg-[#1a1a22]/90 dark:text-[#b8acff] dark:hover:bg-[#23232c]"
                        >
                          <PencilLine className="size-4" />
                          {headerActions.primaryButtonLabel}
                        </button>
                      ) : null}
                    </div>
                    <a
                      href={data.githubProfileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#5b45d9] transition hover:underline dark:text-[#b8acff]"
                    >
                      <ExternalLink className="size-4" />
                      {data.githubProfileUrl}
                    </a>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-[#66617f] dark:text-muted-foreground md:text-lg">
                      {data.bio}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px] text-[#5f587f] dark:text-muted-foreground">
                      {data.showLocation && data.location ? (
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="size-4" />
                          {data.location}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-2">
                        <Globe className="size-4" />
                        {data.languageLabel}
                      </span>
                      {data.showTimezone && data.timezoneLabel ? (
                        <span className="inline-flex items-center gap-2">
                          <Clock3 className="size-4" />
                          {data.timezoneLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="w-fit rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-[#5b45d9] shadow-sm backdrop-blur dark:border-[#3a3450] dark:bg-[#1a1a22]/80 dark:text-[#b8acff]">
                  <span className={`mr-2 inline-block size-2 rounded-full ${data.availableForOpportunities ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {data.availableForOpportunities
                    ? "Available for new opportunities"
                    : "Currently building with a party"}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {visibleSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-[#e8e2f7] bg-white px-4 py-2 text-sm font-medium text-[#5b45d9] shadow-sm dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#b8acff]"
                  >
                    {skill}
                  </span>
                ))}
                {hiddenSkillsCount > 0 ? (
                  <span className="rounded-full border border-[#e8e2f7] bg-white px-4 py-2 text-sm font-medium text-[#8b82b1] shadow-sm dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-muted-foreground">
                    +{hiddenSkillsCount} more
                  </span>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {editor}

        <Card className="mt-6 border border-[#ece8f8] bg-white shadow-[0_24px_80px_rgba(113,87,255,0.06)] dark:border-[#27272f] dark:bg-[#16161d]">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-3xl tracking-[-0.06em] text-[#1f1c38] dark:text-[#f2f2f5] md:text-4xl">
                Completed Projects
              </CardTitle>
              <CardDescription className="mt-2 text-base leading-8 text-app-secondary">
                Team projects you&apos;ve built and shipped.
              </CardDescription>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatBox value={String(data.completedProjectsCount)} label="Projects completed" />
              <StatBox value={String(data.collaboratorsCount)} label="Developers worked with" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {data.completedProjects.length === 0 ? (
              <div className="rounded-[1.5rem] border border-[#ece8f8] bg-[#fcfbff] p-6 text-sm text-app-secondary dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-muted-foreground">
                No completed parties yet.
              </div>
            ) : (
              data.completedProjects.map((project, index) => (
                <div
                  key={project.teamId}
                  className="grid gap-5 rounded-[1.6rem] border border-[#ece8f8] bg-[#fcfbff] p-5 dark:border-[#27272f] dark:bg-[#1a1a22] lg:grid-cols-[1.2fr_0.8fr_auto]"
                >
                  <div className="flex gap-4">
                    <div className="flex size-20 shrink-0 items-center justify-center rounded-[1.4rem] bg-[#efe9ff] text-[#7650ff] dark:bg-[#272138] dark:text-[#a698ff]">
                      <ProjectBadgeIcon index={index} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7650ff] dark:text-[#a698ff]">
                        Party {project.partyId}
                      </p>
                      <p className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[#1f1c38] dark:text-[#f2f2f5]">
                        {project.projectName}
                      </p>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-app-secondary md:text-base">
                        {project.description || "A completed team project shipped through CodeParty."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#e9f9ef] px-3 py-1 text-sm font-medium text-[#1d8d51]">
                          Completed
                        </span>
                        {project.stack.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-[#ece8f8] bg-white px-3 py-1 text-sm font-medium text-[#5b45d9] dark:border-[#27272f] dark:bg-[#16161d] dark:text-[#b8acff]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 text-sm text-[#5f587f] dark:text-muted-foreground">
                    <InfoRow
                      icon={<CalendarDays className="size-4" />}
                      label="Completed on"
                      value={formatPortfolioDate(project.completedAt)}
                    />
                    <InfoRow
                      icon={<Users className="size-4" />}
                      label="Team size"
                      value={`${project.teamSize} developer${project.teamSize === 1 ? "" : "s"}`}
                    />
                  </div>

                  <div className="flex items-center justify-start lg:justify-end">
                    <Link
                      href={project.githubRepoUrl || "#"}
                      target={project.githubRepoUrl ? "_blank" : undefined}
                      rel={project.githubRepoUrl ? "noreferrer" : undefined}
                      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition ${
                        project.githubRepoUrl
                          ? "border border-[#8d78ff] text-[#5b45d9] hover:bg-[#f7f3ff] dark:border-[#6d5ce8] dark:text-[#b8acff] dark:hover:bg-[#23232c]"
                          : "pointer-events-none border border-[#ece8f8] text-[#9d97b8] dark:border-[#27272f] dark:text-[#68657a]"
                      }`}
                    >
                      <ExternalLink className="size-4" />
                      {project.githubRepoUrl ? "View on GitHub" : "GitHub repo unavailable"}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 border border-[#ece8f8] bg-white shadow-[0_20px_60px_rgba(113,87,255,0.06)] dark:border-[#27272f] dark:bg-[#16161d]">
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-[#efe9ff] text-[#7650ff] dark:bg-[#272138] dark:text-[#b8acff]">
                <ExternalLink className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
                  Let&apos;s build awesome things together
                </p>
                <p className="mt-2 text-sm leading-7 text-app-secondary">
                  I&apos;m always open to joining new teams and building impactful projects.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              {data.resumeUrl ? (
                <a
                  href={data.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#947cff_100%)] px-5 text-sm font-medium text-white transition hover:opacity-95"
                >
                  <ExternalLink className="size-4" />
                  Get my resume
                </a>
              ) : isOwner ? (
                <p className="text-sm text-[#7a73a0] dark:text-muted-foreground">
                  Upload your resume in edit mode to publish it here.
                </p>
              ) : (
                <p className="text-sm text-[#7a73a0] dark:text-muted-foreground">
                  Resume not available.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function StatBox({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-[#ece8f8] bg-[#fcfbff] px-5 py-4 dark:border-[#27272f] dark:bg-[#1a1a22]">
      <p className="text-3xl font-semibold tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
        {value}
      </p>
      <p className="mt-1 text-sm text-app-secondary">{label}</p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-[#7650ff] dark:text-[#a698ff]">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-app-meta">{label}</p>
        <p className="mt-1 text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">{value}</p>
      </div>
    </div>
  );
}

function ProjectBadgeIcon({ index }: { index: number }) {
  if (index % 3 === 0) {
    return <Share2 className="size-8" />;
  }

  if (index % 3 === 1) {
    return <Clock3 className="size-8" />;
  }

  return <Globe className="size-8" />;
}

function formatPortfolioDate(value: string | null) {
  if (!value) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
