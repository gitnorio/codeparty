import { NextResponse } from "next/server";

import {
  createTeamMessage,
  getActiveTeamMembership,
  getReadableTeamMembership,
  getRecentTeamMessages,
} from "@/lib/team-messages";
import {
  getSupabaseServiceRoleClient,
  getUserFromBearerToken,
} from "@/lib/supabase/server-admin";

const MAX_MESSAGES_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_MESSAGE_LENGTH = 500;

const messageRateLimitStore = new Map<string, number[]>();

type RouteContext = {
  params: Promise<{
    teamId: string;
  }>;
};

function checkMessageRateLimit(userId: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recentTimestamps = (messageRateLimitStore.get(userId) ?? []).filter(
    (timestamp) => timestamp > windowStart
  );

  if (recentTimestamps.length >= MAX_MESSAGES_PER_MINUTE) {
    const oldestAllowedTimestamp = recentTimestamps[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestAllowedTimestamp + RATE_LIMIT_WINDOW_MS - now) / 1000)
    );

    messageRateLimitStore.set(userId, recentTimestamps);

    return {
      allowed: false,
      retryAfterSeconds,
    };
  }

  recentTimestamps.push(now);
  messageRateLimitStore.set(userId, recentTimestamps);

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await getUserFromBearerToken(request.headers.get("authorization"));

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { teamId } = await context.params;

  if (!teamId) {
    return NextResponse.json({ error: "Missing teamId." }, { status: 400 });
  }

  const supabase = getSupabaseServiceRoleClient();
  const membershipResult = await getReadableTeamMembership(
    supabase,
    auth.user.id,
    teamId
  );

  if (membershipResult.error) {
    return NextResponse.json(
      { error: membershipResult.error.message },
      { status: 500 }
    );
  }

  if (!membershipResult.data) {
    return NextResponse.json(
      { error: "You do not have access to this team chat." },
      { status: 403 }
    );
  }

  const messagesResult = await getRecentTeamMessages(supabase, teamId, 50);

  if (messagesResult.error) {
    return NextResponse.json(
      { error: messagesResult.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ messages: messagesResult.data });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await getUserFromBearerToken(request.headers.get("authorization"));

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { teamId } = await context.params;

  if (!teamId) {
    return NextResponse.json({ error: "Missing teamId." }, { status: 400 });
  }

  let body: { content?: string };

  try {
    body = (await request.json()) as {
      content?: string;
    };
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const content = body.content?.trim() ?? "";

  if (!content) {
    return NextResponse.json(
      { error: "Message content is required." },
      { status: 400 }
    );
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message is too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServiceRoleClient();
  const membershipResult = await getActiveTeamMembership(
    supabase,
    auth.user.id,
    teamId
  );

  if (membershipResult.error) {
    return NextResponse.json(
      { error: membershipResult.error.message },
      { status: 500 }
    );
  }

  if (!membershipResult.data) {
    return NextResponse.json(
      { error: "You must be an active team member to send a message." },
      { status: 403 }
    );
  }

  const rateLimitResult = checkMessageRateLimit(auth.user.id);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: `Too many messages. Please wait ${rateLimitResult.retryAfterSeconds} seconds before sending another message.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitResult.retryAfterSeconds),
        },
      }
    );
  }

  const createResult = await createTeamMessage(supabase, {
    teamId,
    userId: auth.user.id,
    content,
  });

  if (createResult.error) {
    return NextResponse.json(
      { error: createResult.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: createResult.data });
}
