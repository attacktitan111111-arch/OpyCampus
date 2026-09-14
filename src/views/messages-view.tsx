"use client";

import { useState } from "react";
import { ArrowLeft, MessageCircle, PenSquare, Search, X } from "lucide-react";
import { useApp, useConversations, useUsersSearch, useStartConversation, useSession } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "@/components/user-avatar";
import { RelativeTime } from "@/components/relative-time";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function MessagesView() {
  const { back, nav, openAuth } = useApp();
  const { data: session } = useSession();
  const { data, isLoading } = useConversations();
  const [newOpen, setNewOpen] = useState(false);

  const conversations = data?.conversations ?? [];

  if (!session) {
    return (
      <div className="mx-auto w-full max-w-[640px]">
        <HeaderBar back={back} onNew={() => setNewOpen(true)} />
        <EmptyState
          title="Sign in to message"
          description="Sign in to start and read DM conversations with your classmates and teachers."
          className="py-20"
          action={
            <div className="flex gap-2">
              <Button className="rounded-full" onClick={() => openAuth("login")}>Sign in</Button>
              <Button variant="secondary" className="rounded-full" onClick={() => openAuth("signup")}>Create account</Button>
            </div>
          }
        />
        <NewMessageDialog open={newOpen} onOpenChange={setNewOpen} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <HeaderBar back={back} onNew={() => setNewOpen(true)} />

      {isLoading ? (
        <LoadingState />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No messages yet"
          description="Start a conversation from someone's profile — they'll show up here."
          className="py-20"
          action={
            <Button className="rounded-full" onClick={() => setNewOpen(true)}>
              <PenSquare className="mr-1.5 h-4 w-4" /> New message
            </Button>
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {conversations.map((c) => (
            <ConversationRow
              key={c.id}
              id={c.id}
              other={c.other}
              lastMessage={c.lastMessage}
              onOpen={() => nav({ name: "conversation", id: c.id })}
              meId={session.user.id}
            />
          ))}
        </div>
      )}

      <div className="h-20" />

      <NewMessageDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}

function HeaderBar({ back, onNew }: { back: () => void; onNew: () => void }) {
  return (
    <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur-md lg:top-0 lg:px-5">
      <button
        onClick={back}
        className="hidden lg:inline-flex lg:h-9 lg:w-9 lg:items-center lg:justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] font-semibold leading-tight">Messages</h1>
      </div>
      <button
        onClick={onNew}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none"
        aria-label="New message"
      >
        <PenSquare className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

function ConversationRow({
  other,
  lastMessage,
  onOpen,
  meId,
}: {
  id: string;
  other: any;
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  onOpen: () => void;
  meId: string;
}) {
  const fromMe = lastMessage?.senderId === meId;
  const preview = lastMessage ? (fromMe ? `You: ${lastMessage.content}` : lastMessage.content) : "Say hi 👋";

  if (!other) {
    return (
      <button onClick={onOpen} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40 sm:px-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[15px]">Deleted user</p>
          <p className="truncate text-[13px] text-muted-foreground">{preview}</p>
        </div>
        {lastMessage && (
          <span className="text-[12px] text-muted-foreground">
            <RelativeTime date={lastMessage.createdAt} />
          </span>
        )}
      </button>
    );
  }

  return (
    <button onClick={onOpen} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40 sm:px-5 tap-highlight-none">
      <UserAvatar
        name={other.name}
        username={other.username}
        avatarUrl={other.avatarUrl}
        size={48}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 truncate">
          <span className="truncate font-semibold text-[15px]">{other.name}</span>
          {other.verified && <VerifiedBadge className="h-4 w-4 text-primary shrink-0" />}
          <span className="shrink-0 text-[13px] text-muted-foreground">@{other.username}</span>
        </div>
        <p className="line-clamp-1 truncate text-[14px] text-muted-foreground">{preview}</p>
      </div>
      {lastMessage && (
        <span className="shrink-0 text-[12px] text-muted-foreground">
          <RelativeTime date={lastMessage.createdAt} />
        </span>
      )}
    </button>
  );
}

function NewMessageDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { nav } = useApp();
  const [q, setQ] = useState("");
  const startMut = useStartConversation();
  const users = useUsersSearch(q);

  const results = (users.data?.users ?? []).slice(0, 8);

  const startWith = (username: string) => {
    startMut.mutate(
      { username },
      {
        onSuccess: (d) => {
          onOpenChange(false);
          setQ("");
          nav({ name: "conversation", id: d.conversationId });
        },
        onError: (e) => toast.error(e.message || "Couldn't start conversation"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setQ(""); }}>
      <DialogContent showCloseButton={false} className="max-w-md rounded-2xl border-border p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <DialogTitle className="text-[15px] font-semibold">New message</DialogTitle>
          <button onClick={() => onOpenChange(false)} className="rounded-full p-1.5 text-muted-foreground hover:bg-accent" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <DialogDescription className="sr-only">Search for someone to start a direct message with</DialogDescription>
        <div className="p-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3.5 py-2 focus-within:bg-background">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or @username…"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            {q && (
              <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground" aria-label="Clear">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto scrollbar-thin pb-2">
          {users.isLoading && q ? (
            <LoadingState label="Searching" className="py-8" />
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
              {q ? `No one matches "${q}".` : "Start typing to find people."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startWith(u.username)}
                  disabled={startMut.isPending}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40 disabled:opacity-50"
                >
                  <UserAvatar name={u.name} username={u.username} avatarUrl={u.avatarUrl} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 truncate">
                      <span className="truncate font-semibold text-[15px]">{u.name}</span>
                      {u.verified && <VerifiedBadge className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                    <p className="truncate text-[13px] text-muted-foreground">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
