// Shared serializers to shape Prisma models into flat JSON for the client.

export interface MediaItem {
  url: string;
  type: "image" | "video";
  poster?: string;
}

export function serializeUser(u: any) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    bio: u.bio ?? "",
    avatarUrl: u.avatarUrl ?? null,
    role: u.role,
    verified: u.verified,
    department: u.department ?? null,
    institution: u.institution
      ? {
          id: u.institution.id,
          name: u.institution.name,
          handle: u.institution.handle,
          type: u.institution.type,
          isPrivate: u.institution.isPrivate,
          logoUrl: u.institution.logoUrl ?? null,
        }
      : null,
    createdAt: u.createdAt,
    followingIds: u.followsGiven ? u.followsGiven.map((f: any) => f.followingId) : [],
    communityIds: u.communityMemberships ? u.communityMemberships.map((m: any) => m.communityId) : [],
    _counts: {
      posts: u._count?.posts ?? 0,
      followsGiven: u._count?.followsGiven ?? 0,
      followsRecv: u._count?.followsRecv ?? 0,
    },
  };
}

export function serializeInstitution(i: any, currentUserId?: string) {
  if (!i) return null;
  return {
    id: i.id,
    name: i.name,
    handle: i.handle,
    type: i.type,
    bio: i.bio ?? "",
    logoUrl: i.logoUrl ?? null,
    coverUrl: i.coverUrl ?? null,
    website: i.website ?? null,
    location: i.location ?? null,
    verified: i.verified,
    isPrivate: i.isPrivate,
    ownerId: i.ownerId ?? null,
    members: (i.members ?? []).map((m: any) => ({
      id: m.id,
      role: m.role,
      approved: m.approved,
      user: serializeUser(m.user),
    })),
    isMember: currentUserId
      ? (i.members ?? []).some((m: any) => m.userId === currentUserId)
      : false,
    memberRole: currentUserId
      ? (i.members ?? []).find((m: any) => m.userId === currentUserId)?.role ?? null
      : null,
    isOwner: currentUserId ? i.ownerId === currentUserId : false,
    _counts: {
      members: i._count?.members ?? (i.members?.length ?? 0),
      posts: i._count?.posts ?? 0,
    },
  };
}

export function serializeCommunity(c: any, currentUserId?: string) {
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    handle: c.handle,
    description: c.description ?? "",
    iconUrl: c.iconUrl ?? null,
    coverUrl: c.coverUrl ?? null,
    category: c.category,
    isPrivate: c.isPrivate,
    ownerId: c.ownerId,
    isOwner: currentUserId ? c.ownerId === currentUserId : false,
    isMember: currentUserId
      ? (c.members ?? []).some((m: any) => m.userId === currentUserId)
      : false,
    memberRole: currentUserId
      ? (c.members ?? []).find((m: any) => m.userId === currentUserId)?.role ?? null
      : null,
    members: (c.members ?? []).map((m: any) => ({
      id: m.id,
      role: m.role,
      user: serializeUser(m.user),
    })),
    _counts: {
      members: c._count?.members ?? (c.members?.length ?? 0),
      posts: c._count?.posts ?? 0,
    },
    createdAt: c.createdAt,
  };
}

function parseMedia(raw: any): MediaItem[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((m: any) => {
        if (typeof m === "string") {
          // backwards-compat: plain URL string → image
          return { url: m, type: "image" as const };
        }
        return {
          url: m.url,
          type: m.type === "video" ? "video" : "image",
          poster: m.poster ?? undefined,
        };
      })
      .filter((m: MediaItem) => m.url);
  } catch {
    return [];
  }
}

export function serializePost(p: any, currentUserId?: string) {
  if (!p) return null;
  return {
    id: p.id,
    content: p.content,
    media: parseMedia(p.media),
    tags: p.tags ? p.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
    createdAt: p.createdAt,
    author: serializeUser(p.author),
    institution: p.institution
      ? {
          id: p.institution.id,
          name: p.institution.name,
          handle: p.institution.handle,
          isPrivate: p.institution.isPrivate,
        }
      : null,
    community: p.community
      ? {
          id: p.community.id,
          name: p.community.name,
          handle: p.community.handle,
          isPrivate: p.community.isPrivate,
        }
      : null,
    parent: p.parent ? { id: p.parent.id, author: serializeUser(p.parent.author) } : null,
    liked: currentUserId
      ? (p.likes ?? []).some((l: any) => l.userId === currentUserId)
      : false,
    bookmarked: currentUserId
      ? (p.bookmarks ?? []).some((b: any) => b.userId === currentUserId)
      : false,
    reposted: currentUserId
      ? (p.reposts ?? []).some((r: any) => r.userId === currentUserId)
      : false,
    _counts: {
      likes: p._count?.likes ?? (p.likes?.length ?? 0),
      bookmarks: p._count?.bookmarks ?? (p.bookmarks?.length ?? 0),
      reposts: p._count?.reposts ?? (p.reposts?.length ?? 0),
      replies: p._count?.replies ?? (p.replies?.length ?? 0),
    },
  };
}
