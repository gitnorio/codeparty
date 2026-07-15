import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

export type MatchmakingQueueRow =
  Database["public"]["Tables"]["matchmaking_queue"]["Row"];

type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowserClient>;

export async function getActivePartyCount(
  supabase: SupabaseBrowserClient,
  userId: string
) {
  const { data: memberships, error } = await supabase
    .from("team_members")
    .select("team_id, member_status")
    .eq("user_id", userId)
    .eq("member_status", "active");

  if (error) {
    return {
      count: 0,
      error,
    };
  }

  if (!memberships || memberships.length === 0) {
    return {
      count: 0,
      error: null,
    };
  }

  const teamIds = [...new Set(memberships.map((membership) => membership.team_id))];
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, status")
    .in("id", teamIds)
    .eq("status", "active");

  if (teamsError) {
    return {
      count: 0,
      error: teamsError,
    };
  }

  return {
    count: teams?.length ?? 0,
    error: null,
  };
}

export async function getLatestMatchmakingEntry(
  supabase: SupabaseBrowserClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("matchmaking_queue")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  return {
    data: data?.[0] ?? null,
    error,
  };
}

export async function ensureWaitingMatchmakingEntry(
  supabase: SupabaseBrowserClient,
  userId: string
) {
  const activePartyCountResult = await getActivePartyCount(supabase, userId);

  if (activePartyCountResult.error) {
    return {
      data: null,
      error: activePartyCountResult.error,
      created: false,
    };
  }

  if (activePartyCountResult.count >= 1) {
    return {
      data: null,
      error: new Error("You already belong to an active party. Complete or cancel it before joining the queue again."),
      created: false,
    };
  }

  const latestResult = await getLatestMatchmakingEntry(supabase, userId);

  if (latestResult.error) {
    return {
      data: null,
      error: latestResult.error,
      created: false,
    };
  }

  if (latestResult.data?.status === "waiting") {
    return {
      data: latestResult.data,
      error: null,
      created: false,
    };
  }

  const { data, error } = await supabase
    .from("matchmaking_queue")
    .insert({
      user_id: userId,
      status: "waiting",
    })
    .select("*")
    .single();

  if (error?.code === "23505") {
    const retryResult = await getLatestMatchmakingEntry(supabase, userId);
    return {
      data: retryResult.data,
      error: retryResult.error,
      created: false,
    };
  }

  return {
    data,
    error,
    created: !error,
  };
}

export async function updateMatchmakingEntryStatus(
  supabase: SupabaseBrowserClient,
  queueId: string,
  status: MatchmakingQueueRow["status"]
) {
  const { data, error } = await supabase
    .from("matchmaking_queue")
    .update({ status })
    .eq("id", queueId)
    .select("*")
    .single();

  return {
    data,
    error,
  };
}
