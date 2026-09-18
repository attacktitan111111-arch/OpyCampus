"use client";

import { ArrowLeft } from "lucide-react";
import { useApp, usePost, useReplies, useSession } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "@/components/user-avatar";
import { RelativeTime } from "@/components/relative-time";
import { EngagementBar } from "@/components/engagement-bar";
import { InstitutionPill } from "@/components/institution-pill";
import { CommunityIcon } from "@/components/custom-icons";
import { QuotedPostBlock } from "@/components/quoted-post-block";
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
      <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur-md lg:top-0 lg:px-5">
        <button onClick={back} className="hidden lg:inline-flex lg:h-9 lg:w-9 lg:items-center lg:justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[15px] font-semibold">Post</h1>
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

        <div className="mt-3 whitespace-pre-wrap break-words text-[17px] leading-[1.55] text-foreground text-pretty">
          {renderContent(post.content)}
        </div>

        {/* Quoted post (if this is a quote repost) */}
        {post.quoteOf && (
          <div className="mt-3">
            <QuotedPostBlock
              post={post.quoteOf}
              variant="card"
              onClick={() => nav({ name: "post", postId: post.quoteOf!.id })}
            />
          </div>
        )}

        {post.media.length > 0 && (
          <div className={`mt-3 grid gap-1 overflow-hidden rounded-2xl border border-border bg-secondary/30 ${post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {post.media.map((m, i) => (
              <div key={i} className={`relative overflow-hidden bg-secondary ${post.media.length === 1 ? "max-h-[460px]" : "aspect-square"}`}>
                {m.type === "video" ? (
                  <video src={m.url} controls playsInline preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  <img src={m.url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
        )}

        {(post.institution || post.community || post.tags.length > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {post.institution && (
              <button onClick={() => nav({ name: "institution", handle: post.institution!.handle })}>
                <InstitutionPill institution={post.institution} />
              </button>
            )}
            {post.community && (
              <button onClick={() => nav({ name: "community", handle: post.community!.handle })} className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <CommunityIcon className="h-3 w-3" />
                <span className="max-w-[120px] truncate">{post.community.name}</span>
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

        <div className="mt-3 text-[13px] text-muted-foreground">
          <RelativeTime date={post.createdAt} /> · <span>{post._counts.likes + post._counts.reposts + post._counts.replies} interactions</span>
        </div>

        <div className="mt-2 -ml-2.5 border-y border-border py-1.5">
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

      {/* Comment composer trigger */}
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <button
          onClick={() =>
            openCompose({
              replyTo: { id: post.id, authorName: post.author.name, authorUsername: post.author.username },
            })
          }
          className="flex w-full items-center gap-3 rounded-full border border-border bg-secondary/40 px-4 py-2.5 text-left text-muted-foreground transition hover:bg-secondary hover:border-foreground/20"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Add a comment…</span>
        </button>
      </div>

      {/* Comments */}
      <div>
        <h2 className="px-4 py-3 text-[15px] font-semibold sm:px-5">Comments</h2>
        {(repliesData?.replies ?? []).length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No comments yet"
            description="Be the first to comment."
            className="py-12"
          />
        ) : (
          <div className="divide-y divide-border">
            {(repliesData?.replies ?? []).map((r) => {
              const isMe = session?.user?.id === r.author.id;
              return (
                <article key={r.id} className="px-4 py-3 sm:px-5">
                  <div className="flex gap-3">
                    {/* Avatar + nested thread line (so child replies visually nest) */}
                    <div className="flex flex-col items-center">
                      <UserAvatar
                        name={r.author.name}
                        username={r.author.username}
                        avatarUrl={r.author.avatarUrl}
                        size={40}
                        onClick={() => nav({ name: "profile", username: r.author.username })}
                      />
                      {/* Thread connector — pulls nested replies toward parent */}
                      <div className="mt-1 w-px flex-1 bg-border/70" aria-hidden />
                    </div>
                    {/* Chat-bubble styled reply card */}
                    <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-border/70 bg-secondary/30 px-3.5 py-2.5 transition-colors hover:bg-secondary/50">
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[14px] leading-tight">
                        <button onClick={() => nav({ name: "profile", username: r.author.username })} className="flex items-center gap-1 hover:underline">
                          <span className="truncate font-semibold">{r.author.name}</span>
                          {r.author.verified && <VerifiedBadge className="h-3.5 w-3.5 text-primary" />}
                        </button>
                        <span className="text-muted-foreground">@{r.author.username}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-[13px] text-muted-foreground hover:underline">
                          <RelativeTime date={r.createdAt} />
                        </span>
                        {r.author.institution && (
                          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {r.author.institution.name}
                          </span>
                        )}
                        {isMe && (
                          <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">you</span>
                        )}
                      </div>
                      <div className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-[1.55] text-pretty">
                        {renderContent(r.content)}
                      </div>

                      {/* Media (if any) */}
                      {r.media.length > 0 && (
                        <div className={`mt-2 grid gap-1 overflow-hidden rounded-xl border border-border bg-background ${r.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                          {r.media.map((m, i) => (
                            <div key={i} className={`relative overflow-hidden bg-background ${r.media.length === 1 ? "max-h-[360px]" : "aspect-square"}`}>
                              {m.type === "video" ? (
                                <video src={m.url} controls playsInline preload="metadata" className="h-full w-full object-cover" />
                              ) : (
                                <img src={m.url} alt="" className="h-full w-full object-cover" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply action row — supports replying to this reply (nested) */}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() =>
                            openCompose({
                              replyTo: { id: r.id, authorName: r.author.name, authorUsername: r.author.username },
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground tap-highlight-none"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Reply
                        </button>
                        <span className="text-[12px] text-muted-foreground/70">
                          {r._counts.likes > 0 && (
                            <>
                              {r._counts.likes} {r._counts.likes === 1 ? "like" : "likes"}
                            </>
                          )}
                        </span>
                      </div>

                      {/* Engagement bar (like/save/repost/share) */}
                      <div className="mt-1 -ml-2">
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
