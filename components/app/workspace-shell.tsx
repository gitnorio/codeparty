"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  LayoutDashboard,
  Loader2,
  LogOut,
  Moon,
  Share2,
  Settings,
  Sparkles,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";

import { LanguageToggleButton } from "@/components/app/language-toggle-button";
import { useLanguage } from "@/components/app/language-provider";
import { Mascot } from "@/components/app/mascot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/app/feedback";
import { ProfileAvatar } from "@/components/app/profile-avatar";
import { useTheme } from "@/components/app/theme-provider";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AppProfile } from "@/lib/profile";

type WorkspaceContextValue = {
  profile: AppProfile;
  isAdmin: boolean;
  updateProfile: (profile: AppProfile) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/matchmaking", label: "Matchmaking", icon: Sparkles },
  { href: "/admin-matchmaking", label: "Admin Matchmaking", icon: ShieldCheck },
  { href: "/workspace", label: "Workspace", icon: Users },
  { href: "/portfolio", label: "Portfolio", icon: Share2 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient();
  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSessionAndProfile() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (sessionError) {
        setErrorMessage(sessionError.message);
        setIsLoading(false);
        return;
      }

      if (!session?.user) {
        setProfile(null);
        setIsLoading(false);
        router.replace("/");
        return;
      }

      const { data: adminRecord, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle<{ user_id: string }>();

      if (adminError) {
        setErrorMessage(adminError.message);
        setIsLoading(false);
        return;
      }

      const userIsAdmin = Boolean(adminRecord);
      setIsAdmin(userIsAdmin);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle<AppProfile>();

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (!data) {
        setProfile(null);
        setIsLoading(false);
        router.replace("/onboarding");
        return;
      }

      if (pathname === "/admin-matchmaking" && !userIsAdmin) {
        router.replace("/dashboard");
        return;
      }

      setProfile(data);
      setIsLoading(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) {
        return;
      }

      if (!session?.user) {
        setProfile(null);
        setIsLoading(false);
        router.replace("/");
        return;
      }

      window.setTimeout(() => {
        if (!cancelled) {
          void loadSessionAndProfile();
        }
      }, 0);
    });

    void loadSessionAndProfile();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname, router, supabase]);

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      console.error("Unable to sign out from CodeParty", error);
    }

    window.location.replace("/");
  }

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => item.href !== "/admin-matchmaking" || isAdmin),
    [isAdmin]
  );

  const contextValue = useMemo(
    () =>
      profile
        ? {
            profile,
            isAdmin,
            updateProfile: (nextProfile: AppProfile) => setProfile(nextProfile),
          }
        : null,
    [isAdmin, profile]
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fbfaff] px-4 py-4 dark:bg-[#0d0d12] md:px-6">
        <div className="mx-auto flex min-h-[18rem] max-w-7xl items-center justify-center rounded-[2.25rem] border border-[#ece8f8] bg-white dark:border-[#27272f] dark:bg-[#16161d]">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="size-8 animate-spin text-[#7650ff]" />
            <p className="text-sm tracking-wide text-app-secondary">
              {language === "fr" ? "Chargement de l’espace..." : "Loading workspace..."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#fbfaff] px-4 py-4 dark:bg-[#0d0d12] md:px-6">
        <div className="mx-auto flex min-h-[18rem] max-w-7xl items-center justify-center rounded-[2.25rem] border border-[#ece8f8] bg-white dark:border-[#27272f] dark:bg-[#16161d]">
          <Card className="w-full max-w-md rounded-[1.8rem] border border-red-200 shadow-none">
            <CardContent className="pt-6 text-center">
              <h1 className="text-2xl font-semibold text-red-600">
                {language === "fr" ? "Erreur d’espace de travail" : "Workspace error"}
              </h1>
              <div className="mt-4 text-left">
                <FeedbackBanner tone="error" message={errorMessage} />
              </div>
              <Button
                onClick={() => window.location.reload()}
                className="mt-5 rounded-full bg-[#7650ff] text-white"
              >
                {language === "fr" ? "Réessayer" : "Try again"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!profile || !contextValue) {
    return null;
  }

  return (
    <WorkspaceContext.Provider value={contextValue}>
      <main className="min-h-screen bg-[#fbfaff] px-4 py-4 dark:bg-[#0d0d12] md:px-6">
        <div className="mx-auto grid w-full max-w-7xl gap-5 rounded-[2.25rem] border border-[#ece8f8] bg-white p-4 shadow-[0_30px_100px_rgba(113,87,255,0.08)] dark:border-[#27272f] dark:bg-[#16161d] dark:shadow-[0_30px_100px_rgba(0,0,0,0.45)] lg:grid-cols-[280px_1fr] lg:p-5">
          <aside className="rounded-[1.8rem] border border-transparent bg-[#f6f3ff] p-4 dark:border-[#27272f] dark:bg-[#121218]">
            <div className="flex items-center gap-3 px-2 py-3">
              <Mascot pose="icon" size="sm" className="rounded-xl bg-[#7650ff] p-1 dark:bg-[#6d5ce8]" />
              <div>
                <p className="text-2xl font-bold tracking-tight text-[#1f1c38] dark:text-white">CodeParty</p>
                <p className="text-sm text-app-meta">{language === "fr" ? "Espace" : "Workspace"}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-1">
              {visibleNavItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  label={translateNavLabel(item.label, language)}
                  icon={item.icon}
                  active={pathname === item.href}
                />
              ))}
            </div>

            <div className="mt-6 rounded-[1.35rem] bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] p-4 text-white dark:bg-[linear-gradient(135deg,#6d5ce8_0%,#5f50d2_100%)]">
              <p className="mt-3 text-xl font-semibold leading-tight tracking-[-0.04em]">
                {language === "fr"
                  ? "Gardez votre équipe et votre projet dans un flux simple."
                  : "Keep your team and project setup in one clean flow."}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/82">
                {language === "fr"
                  ? "Match, formez une équipe, liez le repo et gardez un contexte de build clair."
                  : "Match, form a team, link the repo, and keep the build context easy to follow."}
              </p>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center justify-between rounded-[1.4rem] border border-[#ece8f8] bg-[#fcfbff] px-4 py-3.5 dark:border-[#27272f] dark:bg-[#1a1a22]">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-app-overline">
                  {language === "fr" ? "Espace" : "Workspace"}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38] dark:text-[#f2f2f5]">
                  {translateNavLabel(
                    navItems.find((item) => item.href === pathname)?.label ?? "Dashboard",
                    language
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
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

                <div className="hidden items-center gap-3 rounded-full border border-[#e8e2f7] bg-white px-3.5 py-2 dark:border-[#27272f] dark:bg-[#1a1a22] md:flex">
                  <ProfileAvatar
                    name={profile.display_name}
                    avatarUrl={profile.avatar_url}
                    className="size-9"
                  />
                  <p className="text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">{profile.display_name}</p>
                </div>

                <Button
                  type="button"
                  onClick={handleSignOut}
                  variant="outline"
                  className="rounded-full border-[#e8e2f7] bg-white text-[#1f1c38] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#f2f2f5]"
                >
                  <LogOut className="size-4" />
                  {language === "fr" ? "Déconnexion" : "Logout"}
                </Button>
              </div>
            </div>

            <div className="min-h-0">{children}</div>
          </div>
        </div>
      </main>
    </WorkspaceContext.Provider>
  );
}

function translateNavLabel(label: string, language: "en" | "fr") {
  if (language === "en") {
    return label;
  }

  if (label === "Dashboard") return "Tableau de bord";
  if (label === "Matchmaking") return "Matchmaking";
  if (label === "Admin Matchmaking") return "Admin matchmaking";
  if (label === "Workspace") return "Espace";
  if (label === "Portfolio") return "Portfolio";
  if (label === "Settings") return "Paramètres";
  return label;
}

function SidebarItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-[1.1rem] px-4 py-3 text-[15px] font-medium transition",
        active
          ? "bg-[#7650ff] text-white shadow-[0_16px_40px_rgba(118,80,255,0.24)]"
          : "text-[#4a4567] hover:bg-white hover:text-[#1f1c38] dark:text-muted-foreground dark:hover:bg-[#1a1a22] dark:hover:text-[#f2f2f5]"
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

export function useWorkspaceProfile() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspaceProfile must be used inside WorkspaceShell");
  }

  return context.profile;
}

export function useWorkspaceAccess() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspaceAccess must be used inside WorkspaceShell");
  }

  return {
    isAdmin: context.isAdmin,
  };
}

export function useWorkspaceProfileActions() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspaceProfileActions must be used inside WorkspaceShell");
  }

  return {
    updateProfile: context.updateProfile,
  };
}
