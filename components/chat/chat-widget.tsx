"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MessageSquare, Minus, Send, Users } from "lucide-react";

import { useChatUi } from "@/components/chat/chat-ui-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FeedbackBanner } from "@/components/app/feedback";
import type { TeamMessageWithProfile } from "@/lib/team-messages";
import { getWorkspaceSnapshot } from "@/lib/workspace-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const MAX_CHAT_MESSAGE_LENGTH = 500;
const SEND_COOLDOWN_MS = 1500;
const CHAT_SYNC_INTERVAL_MS = 3000;

type ActiveChatContext = {
  userId: string;
  userDisplayName: string;
  teamId: string;
  teamName: string;
};

export function ChatWidget() {
  const supabase = getSupabaseBrowserClient();
  const {
    isOpen,
    openWidget,
    minimizeWidget,
    unreadCount,
    incrementUnread,
    isBrowserTabActive,
  } = useChatUi();
  const [chatContext, setChatContext] = useState<ActiveChatContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<TeamMessageWithProfile[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const isOpenRef = useRef(isOpen);
  const isBrowserTabActiveRef = useRef(isBrowserTabActive);
  const messagesRef = useRef<TeamMessageWithProfile[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    isBrowserTabActiveRef.current = isBrowserTabActive;
  }, [isBrowserTabActive]);

  const applySyncedMessages = useCallback(
    (nextMessages: TeamMessageWithProfile[], options?: { countUnread: boolean }) => {
      const currentMessages = messagesRef.current;
      const currentIds = new Set(currentMessages.map((item) => item.message.id));
      const newMessages = nextMessages.filter((item) => !currentIds.has(item.message.id));

      if (
        options?.countUnread &&
        chatContext &&
        newMessages.length > 0 &&
        (!isOpenRef.current || !isBrowserTabActiveRef.current)
      ) {
        const unreadMessages = newMessages.filter(
          (item) => item.message.user_id !== chatContext.userId
        );

        for (let index = 0; index < unreadMessages.length; index += 1) {
          incrementUnread();
        }
      }

      messagesRef.current = nextMessages;
      setMessages(nextMessages);
    },
    [chatContext, incrementUnread]
  );

  useEffect(() => {
    let mounted = true;

    async function resolveChatContext() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (!session?.user) {
        setChatContext(null);
        setIsLoading(false);
        return;
      }

      const snapshotResult = await getWorkspaceSnapshot(supabase, session.user.id);

      if (!mounted) {
        return;
      }

      if (snapshotResult.error || !snapshotResult.data?.currentTeam) {
        setChatContext(null);
        setIsLoading(false);
        return;
      }

      const currentTeam = snapshotResult.data.currentTeam;
      const currentMembership = snapshotResult.data.currentMembership;
      const currentMemberProfile =
        snapshotResult.data.teamMembers.find((item) => item.profile.id === session.user.id)?.profile ??
        null;

      if (
        !currentMembership ||
        currentMembership.member_status !== "active" ||
        currentTeam.status === "cancelled"
      ) {
        setChatContext(null);
        setIsLoading(false);
        return;
      }

      setChatContext({
        userId: session.user.id,
        userDisplayName: currentMemberProfile?.display_name ?? session.user.user_metadata?.user_name ?? "Member",
        teamId: currentTeam.id,
        teamName: currentTeam.name,
      });
      setIsLoading(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void resolveChatContext();
    });

    void resolveChatContext();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    async function loadMessages() {
      if (!chatContext) {
        setMessages([]);
        setMessagesError(null);
        return;
      }

      setIsMessagesLoading(true);
      setMessagesError(null);
      setSendError(null);

      const result = await fetchTeamMessages(supabase, chatContext.teamId);

      if (!mounted) {
        return;
      }

      if (result.error) {
        setMessages([]);
        setMessagesError(result.error);
        setIsMessagesLoading(false);
        return;
      }

      applySyncedMessages(result.messages, { countUnread: false });
      setIsMessagesLoading(false);
    }

    void loadMessages();

    return () => {
      mounted = false;
    };
  }, [applySyncedMessages, chatContext, supabase]);

  useEffect(() => {
    if (!chatContext) {
      return;
    }

    const channel = supabase
      .channel(`team-messages:${chatContext.teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_messages",
          filter: `team_id=eq.${chatContext.teamId}`,
        },
        () => {
          void (async () => {
            const result = await fetchTeamMessages(supabase, chatContext.teamId);

            if (result.error) {
              setMessagesError(result.error);
              return;
            }

            applySyncedMessages(result.messages, { countUnread: true });
          })();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [applySyncedMessages, chatContext, supabase]);

  useEffect(() => {
    if (!chatContext) {
      return;
    }

    let isActive = true;
    let isSyncing = false;

    const intervalId = window.setInterval(() => {
      if (isSyncing) {
        return;
      }

      isSyncing = true;

      void (async () => {
        const result = await fetchTeamMessages(supabase, chatContext.teamId);

        if (!isActive) {
          isSyncing = false;
          return;
        }

        if (result.error) {
          setMessagesError(result.error);
          isSyncing = false;
          return;
        }

        applySyncedMessages(result.messages, { countUnread: true });
        isSyncing = false;
      })();
    }, CHAT_SYNC_INTERVAL_MS);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [applySyncedMessages, chatContext, supabase]);

  if (isLoading || !chatContext) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-50">
      {isOpen ? (
        <ChatWindow
          currentUserId={chatContext.userId}
          teamName={chatContext.teamName}
          messages={messages}
          isLoading={isMessagesLoading}
          loadError={messagesError}
          isSending={isSending}
          sendError={sendError}
          onMinimize={minimizeWidget}
          onSend={async (content) => {
            setIsSending(true);
            setSendError(null);

            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (!session?.access_token) {
              setSendError("Missing authenticated session.");
              setIsSending(false);
              return false;
            }

            const response = await fetch(`/api/teams/${chatContext.teamId}/messages`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ content }),
            });

            const payload = (await response.json()) as {
              error?: string;
              message?: TeamMessageWithProfile["message"];
            };
            const createdMessage = payload.message;

            if (!response.ok || !createdMessage) {
              const retryAfterSeconds = response.headers.get("Retry-After");
              const rateLimitMessage =
                response.status === 429
                  ? `You're sending messages too quickly. Please wait ${retryAfterSeconds ?? "a few"} seconds and try again.`
                  : null;

              setSendError(
                rateLimitMessage ?? payload.error ?? "Failed to send your message."
              );
              setIsSending(false);
              return false;
            }

            setMessages((current) => [
              ...current,
              {
                message: createdMessage,
                profile: {
                  id: chatContext.userId,
                  display_name: chatContext.userDisplayName,
                },
              },
            ]);
            setIsSending(false);
            return true;
          }}
        />
      ) : (
        <ChatBubbleButton unreadCount={unreadCount} onOpen={openWidget} />
      )}
    </div>
  );
}

function ChatWindow({
  currentUserId,
  teamName,
  messages,
  isLoading,
  loadError,
  isSending,
  sendError,
  onMinimize,
  onSend,
}: {
  currentUserId: string;
  teamName: string;
  messages: TeamMessageWithProfile[];
  isLoading: boolean;
  loadError: string | null;
  isSending: boolean;
  sendError: string | null;
  onMinimize: () => void;
  onSend: (content: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState("");
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollAreaRef.current) {
      return;
    }

    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
  }, [messages, isLoading]);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (left, right) =>
          new Date(left.message.created_at).getTime() -
          new Date(right.message.created_at).getTime()
      ),
    [messages]
  );

  async function handleSubmit() {
    const content = draft.trim();
    if (
      !content ||
      isSending ||
      isCooldownActive ||
      content.length > MAX_CHAT_MESSAGE_LENGTH
    ) {
      return;
    }

    const wasSent = await onSend(content);
    if (wasSent) {
      setDraft("");
      setIsCooldownActive(true);
      window.setTimeout(() => {
        setIsCooldownActive(false);
      }, SEND_COOLDOWN_MS);
    }
  }

  const trimmedDraftLength = draft.trim().length;
  const isDraftTooLong = trimmedDraftLength > MAX_CHAT_MESSAGE_LENGTH;
  const isSubmitDisabled =
    isSending ||
    isCooldownActive ||
    trimmedDraftLength === 0 ||
    isDraftTooLong;

  return (
    <Card className="pointer-events-auto h-[480px] w-[360px] overflow-hidden rounded-[1.6rem] border border-[#e8e2f7] bg-white shadow-[0_24px_80px_rgba(75,56,161,0.18)] transition duration-200 ease-out animate-in fade-in zoom-in-95">
      <CardHeader className="flex flex-row items-start justify-between border-b border-[#f0ebfb] bg-[#fcfbff] px-4 py-3">
        <div className="min-w-0">
          <Badge className="rounded-full bg-[#f1ebff] text-[#7650ff] hover:bg-[#f1ebff]">
            Team chat
          </Badge>
          <CardTitle className="mt-2 text-lg tracking-[-0.04em] text-[#1f1c38]">
            {teamName}
          </CardTitle>
          <p className="mt-1 flex items-center gap-2 text-sm text-[#6a6683]">
            <Users className="size-4" />
            Available on every workspace page
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMinimize}
          className="size-8 rounded-full text-[#6a6683] hover:bg-[#f3eeff] hover:text-[#1f1c38]"
        >
          <Minus className="size-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex h-[calc(100%-88px)] flex-col gap-3 p-3">
        <div
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto rounded-[1.2rem] bg-[#faf8ff] p-3"
        >
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <Loader2 className="size-5 animate-spin text-[#7650ff]" />
                <p className="text-sm text-[#6a6683]">Loading team messages...</p>
              </div>
            </div>
          ) : loadError ? (
            <FeedbackBanner tone="error" message={loadError} />
          ) : sortedMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div className="max-w-[220px]">
                <p className="text-sm font-medium text-[#1f1c38]">
                  No messages yet, say hello to your team!
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6a6683]">
                  This chat stays available across the whole workspace.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedMessages.map((item) => {
                const isCurrentUser = item.message.user_id === currentUserId;

                return (
                  <div
                    key={item.message.id}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-[1.05rem] px-3 py-2 ${
                        isCurrentUser
                          ? "bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white"
                          : "bg-white text-[#1f1c38]"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <div
                          className={`flex size-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                            isCurrentUser
                              ? "bg-white/18 text-white"
                              : "bg-[#ece4ff] text-[#7650ff]"
                          }`}
                        >
                          {getInitials(item.profile.display_name)}
                        </div>
                        <p
                          className={`text-[11px] font-medium ${
                            isCurrentUser ? "text-white/85" : "text-[#6a6683]"
                          }`}
                        >
                          {isCurrentUser ? "You" : item.profile.display_name}
                        </p>
                        <p
                          className={`text-[11px] ${
                            isCurrentUser ? "text-white/70" : "text-[#9a93b5]"
                          }`}
                        >
                          {formatMessageTime(item.message.created_at)}
                        </p>
                      </div>
                      <p
                        className={`text-sm leading-6 ${
                          isCurrentUser ? "text-white" : "text-[#1f1c38]"
                        }`}
                      >
                        {item.message.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {sendError ? <FeedbackBanner tone="error" message={sendError} /> : null}

        <div className="rounded-[1rem] border border-[#ece8f8] bg-[#fcfbff] p-2">
          <div className="flex items-center gap-2">
          <Input
            value={draft}
            maxLength={MAX_CHAT_MESSAGE_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder="Write a message..."
            className="h-10 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
          />
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitDisabled}
            className="h-10 rounded-full bg-[#7650ff] px-3 text-white hover:bg-[#6744f0]"
          >
            {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
          <div className="mt-1 flex items-center justify-between px-2 text-[11px]">
            <span className={isDraftTooLong ? "text-[#dc2626]" : "text-[#9a93b5]"}>
              {isCooldownActive
                ? "Please wait a second before sending again."
                : isDraftTooLong
                  ? `Maximum ${MAX_CHAT_MESSAGE_LENGTH} characters.`
                  : "Press Enter to send"}
            </span>
            <span className={isDraftTooLong ? "text-[#dc2626]" : "text-[#9a93b5]"}>
              {trimmedDraftLength}/{MAX_CHAT_MESSAGE_LENGTH}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChatBubbleButton({
  unreadCount,
  onOpen,
}: {
  unreadCount: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="pointer-events-auto relative flex size-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-[0_18px_50px_rgba(118,80,255,0.35)] transition duration-200 ease-out hover:scale-[1.02]"
      aria-label="Open team chat"
    >
      <MessageSquare className="size-5" />
      {unreadCount > 0 ? (
        <span className="absolute -top-1 -right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}

function getInitials(displayName: string) {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? "")
    .join("");
}

function formatMessageTime(createdAt: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(createdAt));
  } catch {
    return "";
  }
}

async function fetchTeamMessages(
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
  teamId: string
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {
      messages: [] as TeamMessageWithProfile[],
      error: "Missing authenticated session.",
    };
  }

  const response = await fetch(`/api/teams/${teamId}/messages`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    error?: string;
    messages?: TeamMessageWithProfile[];
  };

  if (!response.ok) {
    return {
      messages: [] as TeamMessageWithProfile[],
      error: payload.error ?? "Failed to load team messages.",
    };
  }

  return {
    messages: payload.messages ?? [],
    error: null,
  };
}
