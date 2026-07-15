import { useCallback, useEffect, useState } from "react";

import type { AppProfile } from "@/lib/profile";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getLatestMatchmakingEntry, type MatchmakingQueueRow } from "@/lib/matchmaking";

type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowserClient>;

export type TeamMemberWithProfile = {
  membership: TeamMemberRow;
  profile: AppProfile;
};

export type WorkspaceSnapshot = {
  queueEntry: MatchmakingQueueRow | null;
  allMemberships: TeamMemberRow[];
  allTeams: TeamRow[];
  currentTeam: TeamRow | null;
  currentMembership: TeamMemberRow | null;
  teamMembers: TeamMemberWithProfile[];
  currentProject: ProjectRow | null;
};

export async function getWorkspaceSnapshot(
  supabase: SupabaseBrowserClient,
  userId: string,
  selectedTeamId?: string | null
) {
  const queueResult = await getLatestMatchmakingEntry(supabase, userId);

  if (queueResult.error) {
    return {
      data: null,
      error: queueResult.error,
    };
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("team_members")
    .select("*")
    .eq("user_id", userId)
    .in("member_status", ["active", "completed"])
    .order("joined_at", { ascending: false });

  if (membershipsError) {
    return {
      data: null,
      error: membershipsError,
    };
  }

  if (!memberships || memberships.length === 0) {
    return {
      data: {
        queueEntry: queueResult.data,
        allMemberships: [],
        allTeams: [],
        currentTeam: null,
        currentMembership: null,
        teamMembers: [],
        currentProject: null,
      } satisfies WorkspaceSnapshot,
      error: null,
    };
  }

  const teamIds = [...new Set(memberships.map((membership) => membership.team_id))];
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("*")
    .in("id", teamIds);

  if (teamsError) {
    return {
      data: null,
      error: teamsError,
    };
  }

  const teamsById = new Map((teams ?? []).map((team) => [team.id, team] as const));
  const availableTeams = memberships
    .map((membership) => teamsById.get(membership.team_id) ?? null)
    .filter((team): team is TeamRow => Boolean(team));

  const selectedMembership =
    selectedTeamId
      ? memberships.find((membership) => membership.team_id === selectedTeamId) ?? null
      : null;

  const currentMembership =
    selectedMembership ??
    memberships.find((membership) => {
      const team = teamsById.get(membership.team_id);
      return membership.member_status === "active" && team?.status === "active";
    }) ??
    null;

  const currentTeam = currentMembership
    ? teamsById.get(currentMembership.team_id) ?? null
    : null;

  if (!currentTeam || !currentMembership) {
    return {
      data: {
        queueEntry: queueResult.data,
        allMemberships: memberships,
        allTeams: availableTeams,
        currentTeam: null,
        currentMembership: null,
        teamMembers: [],
        currentProject: null,
      } satisfies WorkspaceSnapshot,
      error: null,
    };
  }

  const { data: teamMembers, error: teamMembersError } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", currentTeam.id)
    .in("member_status", ["active", "completed"])
    .order("joined_at", { ascending: true });

  if (teamMembersError) {
    return {
      data: null,
      error: teamMembersError,
    };
  }

  const teamUserIds = [...new Set((teamMembers ?? []).map((item) => item.user_id))];
  const { data: teamProfiles, error: teamProfilesError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", teamUserIds);

  if (teamProfilesError) {
    return {
      data: null,
      error: teamProfilesError,
    };
  }

  const teamProfilesById = new Map(
    (teamProfiles ?? []).map((profile) => [profile.id, profile] as const)
  );

  const teamMemberList = (teamMembers ?? [])
    .map((membership) => {
      const profile = teamProfilesById.get(membership.user_id);
      if (!profile) return null;
      return { membership, profile };
    })
    .filter((item): item is TeamMemberWithProfile => Boolean(item));

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("team_id", currentTeam.id)
    .maybeSingle<ProjectRow>();

  if (projectError) {
    return {
      data: null,
      error: projectError,
    };
  }

  if (!project) {
    return {
      data: {
        queueEntry: queueResult.data,
        allMemberships: memberships,
        allTeams: availableTeams,
        currentTeam,
        currentMembership,
        teamMembers: teamMemberList,
        currentProject: null,
      } satisfies WorkspaceSnapshot,
      error: null,
    };
  }

  return {
    data: {
      queueEntry: queueResult.data,
      allMemberships: memberships,
      allTeams: availableTeams,
      currentTeam,
      currentMembership,
      teamMembers: teamMemberList,
      currentProject: project,
    } satisfies WorkspaceSnapshot,
    error: null,
  };
}

export function useWorkspaceSnapshot(userId: string, selectedTeamId?: string | null) {
  const supabase = getSupabaseBrowserClient();
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshSnapshot = useCallback(async () => {
    setErrorMessage(null);
    setIsLoading(true);

    const result = await getWorkspaceSnapshot(supabase, userId, selectedTeamId);

    if (result.error) {
      setErrorMessage(result.error.message);
      setSnapshot(null);
      setIsLoading(false);
      return;
    }

    setSnapshot(result.data);
    setIsLoading(false);
  }, [selectedTeamId, supabase, userId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshSnapshot();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshSnapshot]);

  return {
    snapshot,
    isLoading,
    errorMessage,
    refreshSnapshot,
  };
}
