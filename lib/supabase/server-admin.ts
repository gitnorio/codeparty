import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export function getSupabaseServerAnonClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export function getSupabaseServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function isAdminUser(userId: string) {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle<{ user_id: string }>();

  return {
    isAdmin: Boolean(data),
    error,
  };
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

  const adminResult = await isAdminUser(auth.user.id);

  if (adminResult.error) {
    return {
      user: null,
      error: "Unable to verify admin access.",
      status: 500,
    };
  }

  if (!adminResult.isAdmin) {
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
