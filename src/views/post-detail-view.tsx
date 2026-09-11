"use client";

import { ArrowLeft } from "lucide-react";
import { useApp, usePost, useReplies, useSession } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "@/components/user-avatar";
import { RelativeTime } from "@/components/relative-time";
import { EngagementBar } from "@/components/engagement-bar";
import { InstitutionPill } from "@/components/institution-pill";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

function renderContent(content: string) {
  const parts = content.split(/(\s+)/);
  return parts.map((part, i) => {
    if (part.startsWith("#")) {
      return (
        <span key={i} className="text-primary font-medium hover:underline cursor-pointer">
          {part.replace(/[#.,!?;]+$/g, "")}
        </span>
      );
    }
    if (part.startsWith("@")) {
      return (
        <span key={i} className="text-primary font-medium hover:underline cursor-pointer">
          {part.replace(/[^a-zA-Z0-9._-]/g, "")}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function PostDetailView({ postId }: { postId: string }) {
  const { data: postData, isLoading, isError } = usePost(postId);
  const { data: repliesData } = useReplies(postId);
  const { back, nav, openCompose } = useApp();
  const { data: session } = useSession();

  const post = postData?.post;

  if (isLoading) return <LoadingState className="py-24" />;
  if (isError || !post)
    return (
      <EmptyState
        title="Post not found"
        description="This post may have been deleted."
        className="py-24"
        action={
          <Button variant="secondary" className="rounded-full" onClick={() => nav({ name: "home" })}>
            Back home
          </Button>
        }
      />
    );

  const onAuthorClick = () => nav({ name: "profile", username: post.author.username });

  return (
    <div className="mx-auto w-full max-w-[640px]">
      {/* Header */}
      <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-3 py-2.5 backdrop-blur-md lg:top-0">
        <button onClick={back} className="rounded-full p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[17px] font-bold">Post</h1>
      </div>

      {/* Main post */}
      <article className="px-4 py-4 sm:px-5">
        <div className="flex gap-3">
          <UserAvatar name={post.author.name} username={post.author.username} avatarUrl={post.author.avatarUrl} size={44} onClick={onAuthorClick} />
          <div className="min-w-0 flex-1">
            <button onClick={onAuthorClick} className="flex items-center gap-1 hover:underline">
              <span className="truncate font-semibold text-[15px]">{post.author.name}</span>
              {post.author.verified && <VerifiedBadge className="h-4 w-4 text-primary" />}
            </button>
            <p className="text-[14px] text-muted-foreground">@{post.author.username}</p>
          </div>
        </div>

        <div className="mt-3 whitespace-pre-wrap break-words text-[17px] leading-relaxed text-foreground">
          {renderContent(post.content)}
        </div>

        {post.images.length > 0 && (
          <div className={`mt-3 grid gap-1 overflow-hidden rounded-2xl border border-border ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {post.images.map((src, i) => (
               
              <img key={i} src={src} alt="" className={`w-full object-cover ${post.images.length === 1 ? "max-h-[460px]" : "aspect-square"}`} />
            ))}
          </div>
        )}

        {(post.institution || post.tags.length > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {post.institution && (
              <button onClick={() => nav({ name: "institution", handle: post.institution!.handle })}>
                <InstitutionPill institution={post.institution} />
              </button>
            )}
            {post.tags.map((t) => (
              <button
                key={t}
                onClick={() => nav({ name: "tag", tag: t })}
                className="text-[13px] font-medium text-primary hover:underline"
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 text-[14px] text-muted-foreground">
          <RelativeTime date={post.createdAt} /> · <span>{post._counts.likes + post._counts.reposts + post._counts.replies} interactions</span>
        </div>

        <div className="mt-3 flex items-center justify-between border-y border-border py-1">
          <EngagementBar
            post={post}
            onReply={() =>
              openCompose({
                replyTo: { id: post.id, authorName: post.author.name, authorUsername: post.author.username },
              })
            }
          />
        </div>
      </article>

      {/* Reply composer trigger */}
      <div className="border-b border-border px-4 py-3">
        <button
          onClick={() =>
            openCompose({
              replyTo: { id: post.id, authorName: post.author.name, authorUsername: post.author.username },
            })
          }
          className="flex w-full items-center gap-3 rounded-full border border-border bg-secondary/40 px-4 py-2.5 text-left text-muted-foreground transition hover:bg-secondary"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Reply to @{post.author.username}…</span>
        </button>
      </div>

      {/* Replies */}
      <div>
        <h2 className="px-4 py-3 text-[15px] font-semibold">Replies</h2>
        {(repliesData?.replies ?? []).length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No replies yet"
            description="Start the conversation."
            className="py-12"
          />
        ) : (
          <div className="divide-y divide-border">
            {(repliesData?.replies ?? []).map((r) => {
              const isMe = session?.user?.id === r.author.id;
              return (
                <article key={r.id} className="px-4 py-3 sm:px-5">
                  <div className="flex gap-3">
                    <UserAvatar
                      name={r.author.name}
                      username={r.author.username}
                      avatarUrl={r.author.avatarUrl}
                      size={36}
                      onClick={() => nav({ name: "profile", username: r.author.username })}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[14px]">
                        <button onClick={() => nav({ name: "profile", username: r.author.username })} className="flex items-center gap-1 hover:underline">
                          <span className="truncate font-semibold">{r.author.name}</span>
                          {r.author.verified && <VerifiedBadge className="h-3.5 w-3.5 text-primary" />}
                        </button>
                        <span className="text-muted-foreground">@{r.author.username}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground text-[13px] hover:underline">
                          <RelativeTime date={r.createdAt} />
                        </span>
                        {isMe && (
                          <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">you</span>
                        )}
                      </div>
                      <div className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                        {renderContent(r.content)}
                      </div>
                      <div className="mt-1.5">
                        <EngagementBar
                          post={r}
                          onReply={() =>
                            openCompose({
                              replyTo: { id: r.id, authorName: r.author.name, authorUsername: r.author.username },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      <div className="h-20" />
    </div>
  );
}
