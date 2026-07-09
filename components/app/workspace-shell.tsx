"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  FolderGit2,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  Sparkles,
  Users,
  UserSquare2,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AppProfile } from "@/lib/profile";

type WorkspaceContextValue = {
  profile: AppProfile;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/matchmaking", label: "Matchmaking", icon: Sparkles },
  { href: "/team", label: "My Team", icon: Users },
  { href: "/project", label: "My Project", icon: FolderGit2 },
  { href: "/public-profile", label: "Public Profile", icon: UserSquare2 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient();
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSessionAndProfile() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        setErrorMessage(sessionError.message);
        setIsLoading(false);
        return;
      }

      if (!session?.user) {
        router.replace("/");
        return;
      }

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
        router.replace("/onboarding");
        return;
      }

      setProfile(data);
      setIsLoading(false);
    }

    void loadSessionAndProfile();
  }, [router, supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  const contextValue = useMemo(() => (profile ? { profile } : null), [profile]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fbfaff] px-4 py-4 md:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl items-center justify-center rounded-[2.25rem] border border-[#ece8f8] bg-white">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="size-8 animate-spin text-[#7650ff]" />
            <p className="text-sm tracking-wide text-[#6a6683]">Loading workspace...</p>
          </div>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#fbfaff] px-4 py-4 md:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl items-center justify-center rounded-[2.25rem] border border-[#ece8f8] bg-white">
          <Card className="w-full max-w-md rounded-[1.8rem] border border-red-200 shadow-none">
            <CardContent className="pt-6 text-center">
              <h1 className="text-2xl font-semibold text-red-600">Workspace error</h1>
              <p className="mt-3 text-sm text-[#6a6683]">{errorMessage}</p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-5 rounded-full bg-[#7650ff] text-white"
              >
                Try again
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
      <main className="min-h-screen bg-[#fbfaff] px-4 py-4 md:px-6">
        <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-5 rounded-[2.25rem] border border-[#ece8f8] bg-white p-4 shadow-[0_30px_100px_rgba(113,87,255,0.08)] lg:grid-cols-[280px_1fr] lg:p-5">
          <aside className="rounded-[1.8rem] bg-[#f6f3ff] p-4">
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#7650ff] text-lg font-bold text-white">
                C
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-[#1f1c38]">CodeParty</p>
                <p className="text-sm text-[#7d7896]">Workspace</p>
              </div>
            </div>

            <div className="mt-5 grid gap-1">
              {navItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={pathname === item.href}
                />
              ))}
            </div>

            <div className="mt-8 rounded-[1.5rem] bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] p-4 text-white">
              <Badge className="rounded-full bg-white/14 text-white hover:bg-white/14">
                Connected
              </Badge>
              <p className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.04em]">
                Turn your GitHub work into visible teamwork proof.
              </p>
              <p className="mt-3 text-sm leading-7 text-white/82">
                Every screen in this shell is preparing the next step of the MVP.
              </p>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center justify-between rounded-[1.6rem] border border-[#ece8f8] bg-[#fcfbff] px-5 py-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[#8f84bc]">Workspace</p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#1f1c38]">
                  {navItems.find((item) => item.href === pathname)?.label ?? "Dashboard"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button className="relative flex size-11 items-center justify-center rounded-full border border-[#e8e2f7] bg-white text-[#5f587f]">
                  <Bell className="size-4" />
                  <span className="absolute right-3 top-3 size-2 rounded-full bg-[#7650ff]" />
                </button>

                <div className="hidden items-center gap-3 rounded-full border border-[#e8e2f7] bg-white px-4 py-2 md:flex">
                  <div className="flex size-9 items-center justify-center rounded-full bg-[#e9e0ff] text-sm font-semibold text-[#7650ff]">
                    {profile.display_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#1f1c38]">{profile.display_name}</p>
                    <p className="text-xs text-[#7a7493]">{profile.level}</p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleSignOut}
                  variant="outline"
                  className="rounded-full border-[#e8e2f7] bg-white text-[#1f1c38]"
                >
                  <LogOut className="size-4" />
                  Logout
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1">{children}</div>
          </div>
        </div>
      </main>
    </WorkspaceContext.Provider>
  );
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
          : "text-[#4a4567] hover:bg-white hover:text-[#1f1c38]"
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
