import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

export type MatchmakingQueueRow =
  Database["public"]["Tables"]["matchmaking_queue"]["Row"];

type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowserClient>;

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
  const latestResult = await getLatestMatchmakingEntry(supabase, userId);

  if (latestResult.error) {
    return {
      data: null,
      error: latestResult.error,
      created: false,
    };
  }

  if (
    latestResult.data?.status === "waiting" ||
    latestResult.data?.status === "matched"
  ) {
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
