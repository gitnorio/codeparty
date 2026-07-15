import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppProfile } from "@/lib/profile";
import type { Database } from "@/lib/supabase/database.types";

type AppSupabaseClient = SupabaseClient<Database>;

export type QueueStatus = Database["public"]["Tables"]["matchmaking_queue"]["Row"]["status"];
export type QueueRow = Database["public"]["Tables"]["matchmaking_queue"]["Row"];
export type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
export type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectMemberRow = Database["public"]["Tables"]["project_members"]["Row"];

export type ProjectAssignment = {
  userId: string;
  projectRole: ProjectMemberRow["project_role"];
  contributionSummary: string | null;
};

export type WaitingCandidate = {
  profile: AppProfile;
  queue: QueueRow;
};

export type FormedTeam = {
  team: TeamRow;
  members: AppProfile[];
  project: ProjectRow | null;
  projectMembers: Array<{
    membership: ProjectMemberRow;
    profile: AppProfile;
  }>;
};

function generatePartyId() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

async function generateUniquePartyId(supabase: AppSupabaseClient) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const partyId = generatePartyId();
    const { data, error } = await supabase
      .from("teams")
      .select("id")
      .eq("party_id", partyId)
      .maybeSingle<{ id: string }>();

    if (error) {
      return { partyId: null, error };
    }

    if (!data) {
      return { partyId, error: null };
    }
  }

  return {
    partyId: null,
    error: new Error("Failed to generate a unique Party ID. Please try again."),
  };
}

async function getQueuedCandidatesByStatus(
  supabase: AppSupabaseClient,
  status: QueueStatus
) {
  const { data: queueRows, error: queueError } = await supabase
    .from("matchmaking_queue")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: true });

  if (queueError) {
    return {
      data: [] as WaitingCandidate[],
      error: queueError,
    };
  }

  if (!queueRows || queueRows.length === 0) {
    return {
      data: [] as WaitingCandidate[],
      error: null,
    };
  }

  const userIds = queueRows.map((row) => row.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  if (profilesError) {
    return {
      data: [] as WaitingCandidate[],
      error: profilesError,
    };
  }

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile] as const)
  );

  return {
    data: queueRows
      .map((queue) => {
        const profile = profilesById.get(queue.user_id);
        if (!profile) return null;
        return { queue, profile };
      })
      .filter((item): item is WaitingCandidate => Boolean(item)),
    error: null,
  };
}

export async function getWaitingCandidates(supabase: AppSupabaseClient) {
  return getQueuedCandidatesByStatus(supabase, "waiting");
}

export async function getCancelledCandidates(supabase: AppSupabaseClient) {
  return getQueuedCandidatesByStatus(supabase, "cancelled");
}

export async function createManualTeamMatch(
  supabase: AppSupabaseClient,
  options: {
    createdBy: string;
    queueEntries: QueueRow[];
  }
) {
  const { createdBy, queueEntries } = options;
  const candidateUserIds = [...new Set(queueEntries.map((entry) => entry.user_id))];

  const { data: activeMemberships, error: activeMembershipsError } = await supabase
    .from("team_members")
    .select("user_id, team_id, member_status")
    .in("user_id", candidateUserIds)
    .eq("member_status", "active");

  if (activeMembershipsError) {
    return {
      team: null,
      error: activeMembershipsError,
    };
  }

  if ((activeMemberships ?? []).length > 0) {
    const activeTeamIds = [...new Set((activeMemberships ?? []).map((membership) => membership.team_id))];
    const { data: activeTeams, error: activeTeamsError } = await supabase
      .from("teams")
      .select("id, status")
      .in("id", activeTeamIds)
      .eq("status", "active");

    if (activeTeamsError) {
      return {
        team: null,
        error: activeTeamsError,
      };
    }

    const activeTeamIdSet = new Set((activeTeams ?? []).map((team) => team.id));
    const activeCountsByUserId = new Map<string, number>();

    for (const membership of activeMemberships ?? []) {
      if (!activeTeamIdSet.has(membership.team_id)) continue;
      activeCountsByUserId.set(
        membership.user_id,
        (activeCountsByUserId.get(membership.user_id) ?? 0) + 1
      );
    }

    const blockedUserId = candidateUserIds.find(
      (userId) => (activeCountsByUserId.get(userId) ?? 0) >= 1
    );

    if (blockedUserId) {
      return {
        team: null,
        error: new Error("At least one selected developer already belongs to an active party."),
      };
    }
  }

  const generatedPartyId = await generateUniquePartyId(supabase);

  if (generatedPartyId.error || !generatedPartyId.partyId) {
    return {
      team: null,
      error: generatedPartyId.error ?? new Error("Failed to generate Party ID."),
    };
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      name: `Party ${generatedPartyId.partyId}`,
      party_id: generatedPartyId.partyId,
      created_by: createdBy,
      status: "active",
    })
    .select("*")
    .single();

  if (teamError) {
    return {
      team: null,
      error: teamError,
    };
  }

  const { error: membersError } = await supabase.from("team_members").insert(
    queueEntries.map((entry) => ({
      team_id: team.id,
      user_id: entry.user_id,
      member_status: "active",
    }))
  );

  if (membersError) {
    return {
      team: null,
      error: membersError,
    };
  }

  const queueIds = queueEntries.map((entry) => entry.id);
  const { error: queueError } = await supabase
    .from("matchmaking_queue")
    .update({ status: "matched" })
    .in("id", queueIds);

  if (queueError) {
    return {
      team: null,
      error: queueError,
    };
  }

  return {
    team: team as TeamRow,
    error: null,
  };
}

export async function getFormedTeams(supabase: AppSupabaseClient) {
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("*")
    .in("status", ["active", "completed", "cancelled"])
    .order("created_at", { ascending: false });

  if (teamsError) {
    return {
      data: [] as FormedTeam[],
      error: teamsError,
    };
  }

  if (!teams || teams.length === 0) {
    return {
      data: [] as FormedTeam[],
      error: null,
    };
  }

  const teamIds = teams.map((team) => team.id);
  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select("*")
    .in("team_id", teamIds)
    .in("member_status", ["active", "completed"]);

  if (membersError) {
    return {
      data: [] as FormedTeam[],
      error: membersError,
    };
  }

  const userIds = [...new Set((members ?? []).map((member) => member.user_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  if (profilesError) {
    return {
      data: [] as FormedTeam[],
      error: profilesError,
    };
  }

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile] as const)
  );

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .in("team_id", teamIds);

  if (projectsError) {
    return {
      data: [] as FormedTeam[],
      error: projectsError,
    };
  }

  const projectsByTeamId = new Map(
    (projects ?? []).map((project) => [project.team_id, project] as const)
  );

  const projectIds = (projects ?? []).map((project) => project.id);
  let projectMembers: ProjectMemberRow[] = [];

  if (projectIds.length > 0) {
    const { data, error } = await supabase
      .from("project_members")
      .select("*")
      .in("project_id", projectIds);

    if (error) {
      return {
        data: [] as FormedTeam[],
        error,
      };
    }

    projectMembers = data ?? [];
  }

  const membersByTeamId = new Map<string, TeamMemberRow[]>();
  for (const member of members ?? []) {
    const list = membersByTeamId.get(member.team_id) ?? [];
    list.push(member);
    membersByTeamId.set(member.team_id, list);
  }

  const projectMembersByProjectId = new Map<string, ProjectMemberRow[]>();
  for (const membership of projectMembers) {
    const list = projectMembersByProjectId.get(membership.project_id) ?? [];
    list.push(membership);
    projectMembersByProjectId.set(membership.project_id, list);
  }

  return {
    data: teams.map((team) => ({
      team,
      members:
        membersByTeamId
          .get(team.id)
          ?.map((member) => profilesById.get(member.user_id) ?? null)
          .filter((profile): profile is AppProfile => Boolean(profile)) ?? [],
      project: projectsByTeamId.get(team.id) ?? null,
      projectMembers:
        projectMembersByProjectId
          .get(projectsByTeamId.get(team.id)?.id ?? "")
          ?.map((membership) => {
            const profile = profilesById.get(membership.user_id);
            if (!profile) return null;
            return { membership, profile };
          })
          .filter(
            (
              item
            ): item is {
              membership: ProjectMemberRow;
              profile: AppProfile;
            } => Boolean(item)
          ) ?? [],
    })),
    error: null,
  };
}

export async function updateQueueEntriesStatus(
  supabase: AppSupabaseClient,
  options: {
    queueIds: string[];
    status: QueueStatus;
  }
) {
  const { data, error } = await supabase
    .from("matchmaking_queue")
    .update({ status: options.status })
    .in("id", options.queueIds)
    .select("*");

  return {
    data: data ?? [],
    error,
  };
}

export async function updateTeamLifecycle(
  supabase: AppSupabaseClient,
  options: {
    teamId: string;
    status: TeamRow["status"];
  }
) {
  const { teamId, status } = options;

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .update({
      status,
      completion_requested_at: status === "active" ? undefined : null,
      completion_requested_by: status === "active" ? undefined : null,
    })
    .eq("id", teamId)
    .select("*")
    .single();

  if (teamError) {
    return {
      team: null,
      error: teamError,
    };
  }

  if (status === "completed") {
    const { error: membersError } = await supabase
      .from("team_members")
      .update({ member_status: "completed" })
      .eq("team_id", teamId)
      .eq("member_status", "active");

    if (membersError) {
      return {
        team: null,
        error: membersError,
      };
    }
  }

  if (status === "active") {
    const { error: membersError } = await supabase
      .from("team_members")
      .update({ member_status: "active" })
      .eq("team_id", teamId)
      .in("member_status", ["active", "completed"]);

    if (membersError) {
      return {
        team: null,
        error: membersError,
      };
    }
  }

  if (status === "cancelled") {
    const { error: membersError } = await supabase
      .from("team_members")
      .update({ member_status: "completed" })
      .eq("team_id", teamId)
      .in("member_status", ["active", "completed"]);

    if (membersError) {
      return {
        team: null,
        error: membersError,
      };
    }
  }

  return {
    team: team as TeamRow,
    error: null,
  };
}

export async function rejectTeamCompletionRequest(
  supabase: AppSupabaseClient,
  options: {
    teamId: string;
  }
) {
  const { data: team, error } = await supabase
    .from("teams")
    .update({
      completion_requested_at: null,
      completion_requested_by: null,
    })
    .eq("id", options.teamId)
    .eq("status", "active")
    .select("*")
    .single();

  return {
    team: team as TeamRow | null,
    error,
  };
}

export async function updateTeamStatusByAdmin(
  supabase: AppSupabaseClient,
  options: {
    teamId: string;
    status: "completed" | "cancelled";
  }
) {
  const { teamId, status } = options;

  const { data: project, error: projectLookupError } = await supabase
    .from("projects")
    .select("*")
    .eq("team_id", teamId)
    .maybeSingle<ProjectRow>();

  if (projectLookupError) {
    return {
      project: null,
      error: projectLookupError,
    };
  }

  if (project) {
    const { error: projectError } = await supabase
      .from("projects")
      .update({ status })
      .eq("id", project.id);

    if (projectError) {
      return {
        project: null,
        error: projectError,
      };
    }
  }

  const lifecycleResult = await updateTeamLifecycle(supabase, {
    teamId,
    status,
  });

  if (lifecycleResult.error) {
    return {
      project: null,
      error: lifecycleResult.error,
    };
  }

  return {
    project: project ?? null,
    error: null,
  };
}
