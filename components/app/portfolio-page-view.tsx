"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  MapPin,
  Moon,
  PencilLine,
  Share2,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";

import { LanguageToggleButton } from "@/components/app/language-toggle-button";
import { useLanguage } from "@/components/app/language-provider";
import { Mascot } from "@/components/app/mascot";
import { ProfileAvatar } from "@/components/app/profile-avatar";
import { useTheme } from "@/components/app/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLanguageValue } from "@/lib/profile-options";
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
  const { language } = useLanguage();
  const pathname = usePathname();

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
            <Mascot pose="icon" size="sm" className="rounded-xl bg-[#7650ff] p-1" />
            <p className="text-3xl font-bold tracking-tight text-[#1f1c38] dark:text-[#f2f2f5]">
              CodeParty
            </p>
            <nav className="hidden items-center gap-8 pl-6 text-[15px] text-[#4f496e] dark:text-muted-foreground md:flex">
              <Link
                href="/dashboard"
                className="transition hover:text-[#1f1c38] dark:hover:text-[#f2f2f5]"
              >
                {language === "fr" ? "Tableau de bord" : "Dashboard"}
              </Link>
              <Link
                href="/matchmaking"
                className="transition hover:text-[#1f1c38] dark:hover:text-[#f2f2f5]"
              >
                {language === "fr" ? "Matchmaking" : "Matchmaking"}
              </Link>
              <Link
                href="/workspace"
                className="transition hover:text-[#1f1c38] dark:hover:text-[#f2f2f5]"
              >
                {language === "fr" ? "Espace" : "Workspace"}
              </Link>
              <Link
                href="/portfolio"
                className={
                  pathname === "/portfolio" || pathname.startsWith("/p/")
                    ? "rounded-full bg-[#f3eeff] px-3 py-1.5 font-medium text-[#7650ff] dark:bg-[#272138] dark:text-[#b8acff]"
                    : "transition hover:text-[#1f1c38] dark:hover:text-[#f2f2f5]"
                }
              >
                {language === "fr" ? "Portfolio" : "Portfolio"}
              </Link>
              <Link
                href="/settings"
                className="transition hover:text-[#1f1c38] dark:hover:text-[#f2f2f5]"
              >
                {language === "fr" ? "Paramètres" : "Settings"}
              </Link>
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LanguageToggleButton />
            <Button
              type="button"
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              title={
                theme === "dark"
                  ? language === "fr"
                    ? "Passer en mode clair"
                    : "Switch to light mode"
                  : language === "fr"
                    ? "Passer en mode sombre"
                    : "Switch to dark mode"
              }
              aria-label={
                theme === "dark"
                  ? language === "fr"
                    ? "Passer en mode clair"
                    : "Switch to light mode"
                  : language === "fr"
                    ? "Passer en mode sombre"
                    : "Switch to dark mode"
              }
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
              {copied
                ? language === "fr"
                  ? "Copié"
                  : "Copied"
                : headerActions?.copiedLabel ??
                  (language === "fr" ? "Copier le lien du portfolio" : "Copy portfolio link")}
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
                        {formatLanguageValue(data.profile.language, language)}
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
                    +{hiddenSkillsCount} {language === "fr" ? "de plus" : "more"}
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
                {language === "fr" ? "Projets complétés" : "Completed Projects"}
              </CardTitle>
              <CardDescription className="mt-2 text-base leading-8 text-app-secondary">
                {language === "fr"
                  ? "Les projets d’équipe que vous avez construits et livrés."
                  : "Team projects you've built and shipped."}
              </CardDescription>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatBox
                value={String(data.completedProjectsCount)}
                label={language === "fr" ? "Projets complétés" : "Projects completed"}
              />
              <StatBox
                value={String(data.collaboratorsCount)}
                label={language === "fr" ? "Développeurs rencontrés" : "Developers worked with"}
              />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {data.completedProjects.length === 0 ? (
              <div className="rounded-[1.5rem] border border-[#ece8f8] bg-[#fcfbff] p-6 text-center text-sm text-app-secondary dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-muted-foreground">
                <Mascot pose="sad" size="md" centered className="mb-3" />
                {language === "fr" ? "Aucun projet complété pour le moment." : "No completed projects yet."}
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
                        {project.description ||
                          (language === "fr"
                            ? "Un projet d’équipe complété et livré via CodeParty."
                            : "A completed team project shipped through CodeParty.")}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#e9f9ef] px-3 py-1 text-sm font-medium text-[#1d8d51]">
                          {language === "fr" ? "Complété" : "Completed"}
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
                      label={language === "fr" ? "Complété le" : "Completed on"}
                      value={formatPortfolioDate(project.completedAt, language)}
                    />
                    <InfoRow
                      icon={<Users className="size-4" />}
                      label={language === "fr" ? "Taille de l’équipe" : "Team size"}
                      value={
                        language === "fr"
                          ? `${project.teamSize} développeur${project.teamSize === 1 ? "" : "s"}`
                          : `${project.teamSize} developer${project.teamSize === 1 ? "" : "s"}`
                      }
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
                      {project.githubRepoUrl
                        ? language === "fr"
                          ? "Voir sur GitHub"
                          : "View on GitHub"
                        : language === "fr"
                          ? "Repo GitHub indisponible"
                          : "GitHub repo unavailable"}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <section className="relative mt-6 min-h-[220px] overflow-hidden rounded-[1.7rem] border border-[#ddd3fa] bg-[linear-gradient(115deg,#f1ebff_0%,#f8f5ff_48%,#e7ddff_100%)] shadow-[0_24px_70px_rgba(113,87,255,0.12)] dark:border-[#40365c] dark:bg-[linear-gradient(115deg,#211a33_0%,#1a1528_48%,#2a2042_100%)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          <div className="pointer-events-none absolute -bottom-24 left-[46%] size-56 rounded-full bg-white/65 dark:bg-[#58478f]/14" />
          <div className="pointer-events-none absolute -right-20 -top-16 size-56 rounded-full bg-white/45 dark:bg-[#7258bd]/12" />
          <Sparkles className="pointer-events-none absolute left-[55%] top-14 size-5 text-[#a991ff] dark:text-[#806bd0]" />
          <Sparkles className="pointer-events-none absolute right-12 top-8 size-4 text-[#b6a4ff] dark:text-[#725fc4]" />

          <div className="relative grid min-h-[220px] items-center gap-5 px-7 py-7 sm:grid-cols-[1fr_0.9fr] sm:px-10 md:px-12">
            <div className="relative z-10 max-w-lg">
              <h2 className="text-3xl leading-[1.02] font-semibold tracking-[-0.055em] text-[#1f1c38] dark:text-[#f2f2f5] sm:text-4xl">
                {language === "fr" ? (
                  <>
                    Construisons quelque chose
                    <br />
                    de formidable ensemble
                  </>
                ) : (
                  <>
                    Let&apos;s build something
                    <br />
                    great together
                  </>
                )}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#625b78] dark:text-[#aaa1b8] sm:text-base">
                {language === "fr"
                  ? "Ouvert aux opportunités pensées pour les juniors et aux équipes collaboratives."
                  : "Open to thoughtful junior-friendly opportunities and collaborative teams."}
              </p>

              <div className="mt-5 flex flex-col items-start gap-2">
                {data.resumeUrl ? (
                  <a
                    href={data.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-lg border border-[#8f7cff]/35 bg-[linear-gradient(135deg,#6f49ff_0%,#8f6dff_52%,#7958f4_100%)] px-6 text-sm font-semibold text-white shadow-[0_15px_36px_rgba(118,80,255,0.3)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(118,80,255,0.38)] dark:border-[#8d7cff]/30 dark:bg-[linear-gradient(135deg,#6b58e8_0%,#7b67ef_52%,#6958dc_100%)]"
                  >
                    <span className="pointer-events-none absolute inset-0 translate-x-[-130%] bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.28)_48%,transparent_72%)] transition-transform duration-700 group-hover:translate-x-[130%]" />
                    <span className="relative inline-flex items-center gap-2">
                      <FileText className="size-4 transition-transform group-hover:scale-105" />
                      {language === "fr" ? "Voir mon CV" : "Get my resume"}
                    </span>
                  </a>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#8c75e8] px-6 text-sm font-semibold text-white/80 shadow-[0_12px_28px_rgba(118,80,255,0.18)] dark:bg-[#5f51a4]"
                  >
                    <FileText className="size-4" />
                    {language === "fr" ? "Voir mon CV" : "Get my resume"}
                  </span>
                )}
                {!data.resumeUrl ? (
                  <p className="text-xs text-[#756d88] dark:text-[#9f96ad]">
                    {isOwner
                      ? language === "fr"
                        ? "Importez votre CV en mode édition pour activer ce bouton."
                        : "Upload your resume in edit mode to activate this button."
                      : language === "fr"
                        ? "CV non disponible."
                        : "Resume not available."}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="relative hidden h-full min-h-44 items-center justify-center sm:flex">
              <div className="absolute bottom-3 h-6 w-44 rounded-[50%] bg-[#6f49ff]/12 blur-md dark:bg-black/25" />
              <Mascot pose="celebration" size="xl" animate className="relative z-10" />
            </div>
          </div>
        </section>
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

function formatPortfolioDate(value: string | null, language: "en" | "fr") {
  if (!value) {
    return language === "fr" ? "Récemment" : "Recently";
  }

  return new Intl.DateTimeFormat(language === "fr" ? "fr-CA" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
