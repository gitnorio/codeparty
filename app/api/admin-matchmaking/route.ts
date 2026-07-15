import { NextResponse } from "next/server";

import {
  createManualTeamMatch,
  getFormedTeams,
  rejectTeamCompletionRequest,
  updateTeamStatusByAdmin,
  getWaitingCandidates,
  updateQueueEntriesStatus,
} from "@/lib/admin-matchmaking";
import { getSupabaseServiceRoleClient, getAdminUserFromBearerToken } from "@/lib/supabase/server-admin";

export async function GET(request: Request) {
  const adminAuth = await getAdminUserFromBearerToken(
    request.headers.get("authorization")
  );

  if (!adminAuth.user) {
    return NextResponse.json(
      { error: adminAuth.error },
      { status: adminAuth.status }
    );
  }

  const supabase = getSupabaseServiceRoleClient();
  const [waitingResult, teamsResult] = await Promise.all([
    getWaitingCandidates(supabase),
    getFormedTeams(supabase),
  ]);

  if (waitingResult.error) {
    return NextResponse.json(
      { error: waitingResult.error.message },
      { status: 500 }
    );
  }

  if (teamsResult.error) {
    return NextResponse.json(
      { error: teamsResult.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    waitingCandidates: waitingResult.data,
    formedTeams: teamsResult.data,
  });
}

export async function POST(request: Request) {
  const adminAuth = await getAdminUserFromBearerToken(
    request.headers.get("authorization")
  );

  if (!adminAuth.user) {
    return NextResponse.json(
      { error: adminAuth.error },
      { status: adminAuth.status }
    );
  }

  const body = (await request.json()) as {
    queueIds?: string[];
  };

  if (!body.queueIds || body.queueIds.length === 0) {
    return NextResponse.json(
      { error: "Missing queueIds." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServiceRoleClient();
  const { data: queueEntries, error: queueError } = await supabase
    .from("matchmaking_queue")
    .select("*")
    .in("id", body.queueIds);

  if (queueError) {
    return NextResponse.json(
      { error: queueError.message },
      { status: 500 }
    );
  }

  if (!queueEntries || queueEntries.length !== body.queueIds.length) {
    return NextResponse.json(
      { error: "Some queue entries could not be found." },
      { status: 400 }
    );
  }

  const result = await createManualTeamMatch(supabase, {
    createdBy: adminAuth.user.id,
    queueEntries,
  });

  if (result.error) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ team: result.team });
}

export async function PATCH(request: Request) {
  const adminAuth = await getAdminUserFromBearerToken(
    request.headers.get("authorization")
  );

  if (!adminAuth.user) {
    return NextResponse.json(
      { error: adminAuth.error },
      { status: adminAuth.status }
    );
  }

  const body = (await request.json()) as
    | {
        action?: "cancelQueue" | "reopenQueue";
        queueIds?: string[];
      }
    | {
        action?: "updateTeamStatus";
        teamId?: string;
        status?: "completed" | "cancelled";
      }
    | {
        action?: "rejectTeamCompletionRequest";
        teamId?: string;
      };

  const supabase = getSupabaseServiceRoleClient();

  if (body.action === "cancelQueue" || body.action === "reopenQueue") {
    if (!body.queueIds || body.queueIds.length === 0) {
      return NextResponse.json(
        { error: "Missing queueIds." },
        { status: 400 }
      );
    }

    const nextStatus = body.action === "cancelQueue" ? "cancelled" : "waiting";
    const result = await updateQueueEntriesStatus(supabase, {
      queueIds: body.queueIds,
      status: nextStatus,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      updatedQueueEntries: result.data,
    });
  }

  if (body.action === "updateTeamStatus") {
    if (!body.teamId || !body.status) {
      return NextResponse.json(
        { error: "Missing teamId or status." },
        { status: 400 }
      );
    }

    const result = await updateTeamStatusByAdmin(supabase, {
      teamId: body.teamId,
      status: body.status,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      project: result.project,
    });
  }

  if (body.action === "rejectTeamCompletionRequest") {
    if (!body.teamId) {
      return NextResponse.json(
        { error: "Missing teamId." },
        { status: 400 }
      );
    }

    const result = await rejectTeamCompletionRequest(supabase, {
      teamId: body.teamId,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      team: result.team,
    });
  }

  return NextResponse.json(
    { error: "Unsupported admin action." },
    { status: 400 }
  );
}
