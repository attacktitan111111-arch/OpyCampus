// Shared Prisma include for posts, used across all post-related API routes.
import type { Prisma } from "@prisma/client";

export const postInclude = {
  author: {
    include: {
      institution: true,
      memberships: { include: { institution: true } },
      followsGiven: { select: { followingId: true } },
      communityMemberships: { select: { communityId: true } },
      _count: { select: { posts: true, followsGiven: true, followsRecv: true } },
    },
  },
  institution: { select: { id: true, name: true, handle: true, isPrivate: true } },
  community: { select: { id: true, name: true, handle: true, isPrivate: true } },
  parent: { include: { author: { include: { institution: true } } } },
  // Quote repost: include the quoted post with the same relations so the
  // client can render it like a normal post (author, media, counts, etc).
  // We deliberately DON'T include quoteOf.quoteOf — no recursive quotes.
  quoteOf: {
    include: {
      author: {
        include: {
          institution: true,
          _count: { select: { posts: true, followsGiven: true, followsRecv: true } },
        },
      },
      institution: { select: { id: true, name: true, handle: true, isPrivate: true } },
      community: { select: { id: true, name: true, handle: true, isPrivate: true } },
      likes: { select: { userId: true } },
      reposts: { select: { userId: true } },
      _count: { select: { likes: true, bookmarks: true, reposts: true, replies: true } },
    },
  },
  likes: { select: { userId: true } },
  bookmarks: { select: { userId: true } },
  reposts: { select: { userId: true } },
  _count: { select: { likes: true, bookmarks: true, reposts: true, replies: true } },
} satisfies Prisma.PostInclude;
