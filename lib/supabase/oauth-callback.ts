import type { Session, SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type OAuthCompletionResult = {
  error: string | null;
  session: Session | null;
};

export async function completeOAuthSessionFromUrl(
  supabase: SupabaseClient<Database>
): Promise<OAuthCompletionResult> {
  if (typeof window === "undefined") {
    return { error: null, session: null };
  }

  const url = new URL(window.location.href);
  const oauthError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (oauthError) {
    clearOAuthParameters(url.pathname);
    return { error: oauthError, session: null };
  }

  const code = url.searchParams.get("code");
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    clearOAuthParameters(url.pathname);

    return {
      error: error?.message ?? null,
      session: data.session,
    };
  }

  const fragment = new URLSearchParams(url.hash.slice(1));
  const accessToken = fragment.get("access_token");
  const refreshToken = fragment.get("refresh_token");
  const fragmentError = fragment.get("error_description") ?? fragment.get("error");

  if (fragmentError) {
    clearOAuthParameters(url.pathname);
    return { error: fragmentError, session: null };
  }

  if (!accessToken || !refreshToken) {
    return { error: null, session: null };
  }

  clearOAuthParameters(url.pathname);

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return {
    error: error?.message ?? null,
    session: data.session,
  };
}

function clearOAuthParameters(pathname: string) {
  window.history.replaceState({}, document.title, pathname);
}
