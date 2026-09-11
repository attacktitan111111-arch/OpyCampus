// Shared serializers to shape Prisma models into flat JSON for the client.

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
    _counts: {
      members: i._count?.members ?? (i.members?.length ?? 0),
      posts: i._count?.posts ?? 0,
    },
  };
}

export function serializePost(p: any, currentUserId?: string) {
  if (!p) return null;
  return {
    id: p.id,
    content: p.content,
    images: p.images ? JSON.parse(p.images) : [],
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
