"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Clock3,
  FolderGit2,
  LogIn,
  MessageSquareMore,
  Moon,
  Play,
  Sparkles,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";

import { LanguageToggleButton } from "@/components/app/language-toggle-button";
import { useLanguage } from "@/components/app/language-provider";
import { Mascot } from "@/components/app/mascot";
import { useTheme } from "@/components/app/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const showDevLogin = process.env.NODE_ENV !== "production";
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveEntryRoute() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle<{ id: string }>();

      if (cancelled) {
        return;
      }

      if (profileError) {
        setErrorMessage(profileError.message);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);

      router.replace(profile ? "/dashboard" : "/onboarding");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) {
        return;
      }

      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      window.setTimeout(() => {
        if (!cancelled) {
          void resolveEntryRoute();
        }
      }, 0);
    });

    void resolveEntryRoute();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  async function handleGitHubLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaff] px-4 py-4 text-[#1f1c38] dark:bg-[#0d0d12] dark:text-[#f2f2f5] md:px-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.25rem] border border-[#ece8f8] bg-white shadow-[0_30px_100px_rgba(113,87,255,0.08)] dark:border-[#27272f] dark:bg-[#16161d] dark:shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
        <header className="flex items-center justify-between px-6 py-4 dark:border-b dark:border-[#27272f] md:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Mascot pose="icon" size="sm" className="rounded-xl bg-[#7650ff] p-1 dark:bg-[#6d5ce8]" />
              <div>
                <p className="text-2xl font-bold tracking-tight dark:text-[#f2f2f5]">
                  CodeParty
                </p>
              </div>
            </div>
            <nav className="hidden items-center gap-8 text-[15px] text-[#3f3a5b] dark:text-muted-foreground md:flex">
              <span>{language === "fr" ? "Matchmaking" : "Matchmaking"}</span>
              <span>{language === "fr" ? "Projets" : "Projects"}</span>
              <span>{language === "fr" ? "Preuve portfolio" : "Portfolio proof"}</span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {showDevLogin ? (
              <Link
                href="/dev-login"
                className="hidden text-[15px] font-medium dark:text-[#f2f2f5] md:inline-flex"
              >
                {language === "fr" ? "Connexion dev" : "Dev Login"}
              </Link>
            ) : null}
            <LanguageToggleButton />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="size-11 rounded-full border-[#e7e1f6] bg-white text-[#5f4c9b] hover:bg-[#f7f4ff] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#f2f2f5] dark:hover:bg-[#23232c]"
              aria-label={
                theme === "dark"
                  ? language === "fr"
                    ? "Passer en mode clair"
                    : "Switch to light mode"
                  : language === "fr"
                    ? "Passer en mode sombre"
                    : "Switch to dark mode"
              }
            >
              {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </Button>
            <Button
              type="button"
              onClick={handleGitHubLogin}
              disabled={isLoading}
              className="h-11 rounded-full bg-[#7650ff] px-6 text-white hover:bg-[#6744f0] dark:bg-[#6d5ce8] dark:hover:bg-[#5f50d2]"
            >
              {language === "fr" ? "Connexion avec GitHub" : "Login with GitHub"}
            </Button>
          </div>
        </header>

        <section className="grid gap-10 bg-[#fffefe] px-6 pb-16 pt-10 dark:bg-[#16161d] md:px-8 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:gap-16 lg:px-12 lg:pt-16">
          <div className="max-w-[620px]">
            <div className="mb-4 flex items-center gap-3">
              <Mascot pose="welcome" size="lg" priority className="-ml-3" />
              <div className="rounded-full border border-[#e8e2f7] bg-white/90 px-4 py-2 text-sm text-[#6a6683] shadow-sm dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-muted-foreground">
                {language === "fr" ? "Découvrez votre guide CodeParty" : "Meet your CodeParty guide"}
              </div>
            </div>
            <h1 className="text-[4rem] leading-[0.93] font-semibold tracking-[-0.06em] text-[#201d39] dark:text-[#f2f2f5] md:text-[6.6rem]">
              {language === "fr" ? "Transforme chaque" : "Build every"}
              <br />
              {language === "fr" ? "collaboration" : "collaboration"}
              <br />
              <span className="inline-block rounded-[1.1rem] bg-[#dcd1ff] px-3 pb-1 pt-0.5 dark:bg-[#2c2542] dark:text-[#f6dd78]">
                {language === "fr" ? "en preuve" : "into proof"}
              </span>
            </h1>

            <p className="mt-8 max-w-[540px] text-[1.15rem] leading-8 text-[#66617f] dark:text-muted-foreground">
              {language === "fr"
                ? "Rejoignez une vraie équipe de développeurs juniors, livrez un vrai projet GitHub et transformez ce travail en preuve portfolio pour votre CV."
                : "Join a serious junior dev team, ship a real GitHub project, and turn that work into portfolio proof for your CV."}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                type="button"
                onClick={handleGitHubLogin}
                disabled={isLoading}
                className="h-16 rounded-full bg-[#7650ff] px-10 text-xl text-white hover:bg-[#6744f0] dark:bg-[#6d5ce8] dark:hover:bg-[#5f50d2]"
              >
                <LogIn className="size-5" />
                {language === "fr" ? "Connexion avec GitHub" : "Login with GitHub"}
              </Button>

              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 text-[17px] font-medium text-[#1f1c38] dark:text-[#f2f2f5]"
              >
                {language === "fr" ? "En savoir plus" : "Learn more"}
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-5 flex items-center gap-3 text-[15px] font-medium text-[#1f1c38] dark:text-[#f2f2f5]">
              <div className="flex size-5 items-center justify-center rounded-md border border-[#7650ff]/25 text-[#7650ff] dark:border-[#6d5ce8]/30 dark:text-[#a698ff]">
                <Check className="size-3" />
              </div>
              {language === "fr" ? "Aucune carte de crédit requise" : "No credit card required"}
            </div>

            {errorMessage ? (
              <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
            ) : null}
          </div>

          <div className="rounded-[2rem] bg-[#f6f4fb] p-6 dark:bg-[#1a1a22] lg:p-9">
            <div className="mx-auto max-w-[360px] rounded-[1.4rem] bg-[#7650ff] p-4 text-white shadow-[0_30px_80px_rgba(118,80,255,0.35)] dark:bg-[linear-gradient(135deg,#6d5ce8_0%,#5f50d2_100%)]">
              <p className="text-[15px] leading-6 text-white/95">
                {language === "fr"
                  ? "CodeParty aide les développeurs juniors à rejoindre une petite équipe, créer un projet ensemble et garder une preuve portfolio claire."
                  : "CodeParty helps junior developers join a small team, build one project together, and keep clear portfolio proof."}
              </p>
              <div className="mt-4 overflow-hidden rounded-[1.4rem] bg-[#f6f2ff] p-5 dark:bg-[#1f1f28]">
                <div className="rounded-[1.2rem] bg-[#e9e0ff] p-5 text-[#1f1c38] dark:bg-[#23232c] dark:text-[#f2f2f5]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#6c5aa5] dark:text-[#a698ff]">
                        {language === "fr" ? "Flux MVP" : "MVP flow"}
                      </p>
                      <p className="mt-1 text-2xl font-semibold">
                        {language === "fr" ? "Former un party et livrer un projet réel" : "Form a party and ship one real project"}
                      </p>
                    </div>
                    <Badge className="rounded-full bg-white text-[#7650ff] hover:bg-white dark:bg-[#1a1a22] dark:text-[#a698ff] dark:hover:bg-[#1a1a22]">
                      {language === "fr" ? "Réel" : "Real"}
                    </Badge>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <MiniInfo
                      label={language === "fr" ? "Équipe" : "Team"}
                      value={language === "fr" ? "3 à 4 développeurs maximum par party" : "3 to 4 developers max per party"}
                    />
                    <MiniInfo
                      label={language === "fr" ? "Projet" : "Project"}
                      value={language === "fr" ? "Un repo GitHub partagé lié au workspace" : "One shared GitHub repo linked to the workspace"}
                    />
                    <MiniInfo
                      label={language === "fr" ? "Résultat" : "Outcome"}
                      value={language === "fr" ? "Un portfolio public avec projets complétés et contexte réel" : "A public portfolio with completed projects and real build context"}
                    />
                  </div>
                </div>

                <div className="mt-4 flex h-15 w-full items-center justify-center rounded-[1rem] bg-white text-lg font-medium text-[#7650ff] dark:bg-[#1a1a22] dark:text-[#a698ff]">
                  {language === "fr" ? "Aperçu du parcours produit" : "Product flow preview"}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="rounded-full border border-[#ddd7f0] bg-white p-3 text-[#6d63a2] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-muted-foreground">
                <Play className="size-4 fill-current" />
              </div>
              <div className="flex gap-3 text-right">
                <StatBubble value="3-4" label={language === "fr" ? "coéquipiers" : "teammates"} />
                <StatBubble value="1" label={language === "fr" ? "repo partagé" : "shared repo"} />
                <StatBubble value="PR" label={language === "fr" ? "flux" : "workflow"} />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f4edff] px-6 py-10 dark:bg-[#121218] md:px-8 lg:px-12">
          <div className="rounded-[2rem] bg-[linear-gradient(135deg,#6f44ff_0%,#8c67ff_100%)] p-6 text-white dark:bg-[linear-gradient(135deg,#6d5ce8_0%,#5f50d2_100%)] md:p-8">
            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr_0.9fr_0.9fr]">
              <Card className="border border-white/12 bg-white/6 text-white shadow-none ring-0">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
                      CP
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {language === "fr" ? "Équipes CodeParty" : "CodeParty teams"}
                      </CardTitle>
                      <CardDescription className="text-white/80">
                        {language === "fr"
                          ? "Développeurs juniors qui construisent ensemble"
                          : "Junior developers building together"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-2xl leading-10 font-medium text-white">
                  {language === "fr"
                    ? "Le but est simple : arrêter de construire seul, rejoindre une petite équipe sérieuse et finir avec un vrai projet GitHub que vous pouvez montrer."
                    : "The goal is simple: stop building alone, join a focused team, and finish with real GitHub work you can show."}
                </CardContent>
              </Card>

              <HighlightStat
                value="4"
                label={language === "fr" ? "Développeurs max" : "Developers max"}
                sublabel={language === "fr" ? "par party" : "per party"}
              />
              <HighlightStat
                value="1"
                label={language === "fr" ? "Projet partagé" : "Shared project"}
                sublabel={language === "fr" ? "par équipe" : "per team"}
              />
              <HighlightStat
                value="1"
                label={language === "fr" ? "Portfolio public" : "Public portfolio"}
                sublabel={language === "fr" ? "mis à jour avec les projets terminés" : "updated with completed projects"}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-white/95">
              <span className="text-[18px]">{language === "fr" ? "Conçu pour" : "Built for"}</span>
              <span className="rounded-full bg-[#ffdf94] px-4 py-1 text-[18px] text-[#8a4d00]">
                {language === "fr" ? "les développeurs juniors" : "junior developers"}
              </span>
              <span className="text-[18px]">
                {language === "fr"
                  ? "qui veulent une vraie preuve de travail d’équipe"
                  : "who want stronger teamwork proof"}
              </span>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-white px-6 py-14 dark:bg-[#16161d] md:px-8 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-3">
            <FeatureHeading
              title={
                <>
                  {language === "fr" ? "Créer une vraie" : "Build with real"}
                  <br />
                  {language === "fr" ? "preuve projet" : "project proof"}
                </>
              }
            />
            <FeatureHeading
              title={
                <>
                  {language === "fr" ? "Trouver la bonne" : "Find the right"}
                  <br />
                  {language === "fr" ? "petite équipe" : "small team"}
                </>
              }
              accent
            />
            <FeatureHeading
              title={
                <>
                  {language === "fr" ? "Garder un" : "Keep one"}
                  <br />
                  {language === "fr" ? "contexte clair" : "clear workspace"}
                </>
              }
            />
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <SoftFeatureCard
              icon={Sparkles}
              title={language === "fr" ? "Construire avec intention" : "Build with intention"}
              description={
                language === "fr"
                  ? "Rejoignez un projet avec un cadre clair, une ownership partagée et une stack que vous voulez vraiment utiliser."
                  : "Join a project with clear constraints, shared ownership, and a stack you genuinely want to use."
              }
            />
            <SoftFeatureCard
              icon={Users}
              title={language === "fr" ? "Trouver les bons teammates" : "Find the right teammates"}
              description={
                language === "fr"
                  ? "Le matchmaking s’appuie sur votre profil, vos langues, votre fuseau horaire, vos types de projet et votre stack."
                  : "Matchmaking uses your profile, languages, timezone, project types, and stack."
              }
            />
            <SoftFeatureCard
              icon={MessageSquareMore}
              title={language === "fr" ? "Montrer un vrai signal portfolio" : "Show real portfolio signal"}
              description={
                language === "fr"
                  ? "Gardez un workspace d’équipe, un repo lié et un portfolio public qui montre les projets complétés."
                  : "Keep a team workspace, a linked repo, and a public portfolio that shows completed projects."
              }
            />
          </div>
        </section>

        <section className="bg-white px-6 pb-14 dark:bg-[#16161d] md:px-8 lg:px-12">
          <div className="rounded-[2rem] bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] p-8 text-white dark:bg-[linear-gradient(135deg,#6d5ce8_0%,#5f50d2_100%)] md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-white/75">
                  {language === "fr" ? "Commencez votre prochain projet" : "Start your next build"}
                </p>
                <h2 className="mt-3 text-[3.4rem] leading-[0.95] font-semibold tracking-[-0.06em]">
                  {language === "fr" ? "Rejoignez une équipe," : "Join a team,"}
                  <br />
                  {language === "fr" ? "livrez un projet," : "ship a project,"}
                  <br />
                  {language === "fr" ? "gardez la preuve." : "keep the proof."}
                </h2>
                <p className="mt-5 max-w-[560px] text-[1.1rem] leading-8 text-white/82">
                  {language === "fr"
                    ? "CodeParty rend la collaboration visible du premier match jusqu’au portfolio final."
                    : "CodeParty is designed to make collaboration visible from the first match to the final portfolio."}
                </p>
              </div>

              <div className="grid gap-4">
                <CtaSignal
                  icon={Users}
                  title={language === "fr" ? "Matchmaking" : "Matchmaking"}
                  detail={
                    language === "fr"
                      ? "Petites équipes sérieuses construites depuis de vraies préférences de profil."
                      : "Small serious teams built from real profile preferences."
                  }
                />
                <CtaSignal
                  icon={FolderGit2}
                  title={language === "fr" ? "Projet partagé" : "Shared project"}
                  detail={
                    language === "fr"
                      ? "Un repo clair, un contexte projet simple et un workspace commun."
                      : "One clear repo, one simple project context, and one shared workspace."
                  }
                />
                <CtaSignal
                  icon={Clock3}
                  title={language === "fr" ? "Signal portfolio" : "Portfolio signal"}
                  detail={
                    language === "fr"
                      ? "Le projet terminé reste visible et plus facile à expliquer ensuite."
                      : "The finished project stays visible and easier to explain afterward."
                  }
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] bg-white px-4 py-3 dark:bg-[#1a1a22]">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8d7eb6] dark:text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[15px] leading-6 text-[#282548] dark:text-[#f2f2f5]">{value}</p>
    </div>
  );
}

function StatBubble({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[#e4dff1] bg-white px-4 py-3 text-center dark:border-[#27272f] dark:bg-[#1a1a22]">
      <p className="text-2xl font-semibold text-[#1f1c38] dark:text-[#f2f2f5]">{value}</p>
      <p className="text-xs uppercase tracking-[0.15em] text-app-meta">
        {label}
      </p>
    </div>
  );
}

function HighlightStat({
  value,
  label,
  sublabel,
}: {
  value: string;
  label: string;
  sublabel: string;
}) {
  return (
    <Card className="border border-white/12 bg-white/6 text-white shadow-none ring-0">
      <CardContent className="pt-8">
        <p className="text-7xl font-semibold tracking-[-0.06em] text-[#ffe07c]">{value}</p>
        <p className="mt-3 text-2xl font-medium">{label}</p>
        <p className="mt-1 text-xl text-white/80">{sublabel}</p>
      </CardContent>
    </Card>
  );
}

function FeatureHeading({
  title,
  accent = false,
}: {
  title: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <h2 className="text-[3.7rem] leading-[0.95] font-semibold tracking-[-0.06em] text-[#1f1c38] dark:text-[#f2f2f5]">
      <span
        className={
          accent
            ? "text-[#7650ff] dark:text-[#a698ff]"
            : "text-[#1f1c38] dark:text-[#f2f2f5]"
        }
      >
        {title}
      </span>
    </h2>
  );
}

function SoftFeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-[1.8rem] border border-[#ece8f8] bg-[#fcfbff] shadow-none ring-0 dark:border-[#27272f] dark:bg-[#1a1a22]">
      <CardContent className="pt-8">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#e8ddff] text-[#7650ff] dark:bg-[#272138] dark:text-[#a698ff]">
          <Icon className="size-5" />
        </div>
        <p className="mt-6 text-3xl font-semibold tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
          {title}
        </p>
        <p className="mt-4 text-[18px] leading-8 text-[#6b6784] dark:text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function CtaSignal({
  icon: Icon,
  title,
  detail,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/14 bg-white/8 p-5 dark:border-white/10 dark:bg-black/10">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-white/14 text-white">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xl font-semibold">{title}</p>
          <p className="mt-2 text-sm leading-7 text-white/82">{detail}</p>
        </div>
      </div>
    </div>
  );
}
