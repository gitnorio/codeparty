import { createClient } from "@supabase/supabase-js";

import { isAdminEmail } from "@/lib/admin-access";
import type { Database } from "@/lib/supabase/database.types";

export function getSupabaseServerAnonClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function getSupabaseServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getUserFromBearerToken(authorizationHeader: string | null) {
  const token = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return {
      user: null,
      error: "Missing bearer token.",
      status: 401,
    };
  }

  const supabase = getSupabaseServerAnonClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      user: null,
      error: error?.message ?? "Invalid session.",
      status: 401,
    };
  }

  return {
    user,
    error: null,
    status: 200,
  };
}

export async function getAdminUserFromBearerToken(authorizationHeader: string | null) {
  const auth = await getUserFromBearerToken(authorizationHeader);

  if (!auth.user) {
    return auth;
  }

  if (!isAdminEmail(auth.user.email)) {
    return {
      user: null,
      error: "Admin access required.",
      status: 403,
    };
  }

  return {
    user: auth.user,
    error: null,
    status: 200,
  };
}
