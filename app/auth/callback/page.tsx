"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useLanguage } from "@/components/app/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { completeOAuthSessionFromUrl } from "@/lib/supabase/oauth-callback";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const startedRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    let cancelled = false;

    async function completeSignIn() {
      const supabase = getSupabaseBrowserClient();
      const callbackResult = await completeOAuthSessionFromUrl(supabase);

      if (cancelled) {
        return;
      }

      if (callbackResult.error) {
        setErrorMessage(callbackResult.error);
        return;
      }

      const sessionResult = callbackResult.session
        ? { data: { session: callbackResult.session }, error: null }
        : await supabase.auth.getSession();

      if (sessionResult.error || !sessionResult.data.session?.user) {
        setErrorMessage(
          sessionResult.error?.message ??
            (language === "fr"
              ? "La connexion GitHub n’a pas pu être finalisée. Veuillez réessayer."
              : "GitHub sign-in could not be completed. Please try again.")
        );
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", sessionResult.data.session.user.id)
        .maybeSingle<{ id: string }>();

      if (cancelled) {
        return;
      }

      if (profileError) {
        setErrorMessage(profileError.message);
        return;
      }

      router.replace(profile ? "/dashboard" : "/onboarding");
    }

    void completeSignIn();

    return () => {
      cancelled = true;
    };
  }, [language, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfaff] px-4 py-8 text-[#1f1c38] dark:bg-[#0d0d12] dark:text-[#f2f2f5]">
      <div className="w-full max-w-md rounded-[1.5rem] border border-[#ece8f8] bg-white p-7 text-center shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
        {errorMessage ? (
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-red-600 dark:text-red-400">{errorMessage}</p>
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="mx-auto rounded-full bg-[#7650ff] px-5 py-2.5 text-sm font-medium text-white"
            >
              {language === "fr" ? "Retour à l’accueil" : "Back to home"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="size-5 animate-spin text-[#7650ff]" />
            <p className="text-sm text-[#6a6683] dark:text-[#b3b4c2]">
              {language === "fr" ? "Connexion à GitHub..." : "Signing in with GitHub..."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
