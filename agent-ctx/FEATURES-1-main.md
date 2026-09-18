# Task FEATURES-1 — Comments preview + Quote repost

## What was built
1. **Comments preview** on feed PostCards — shows first 1–2 replies (avatars, names, truncated content) below the engagement bar, with "View all N replies" → post detail page and an inline expand/collapse toggle (Framer Motion height animation).
2. **Quote repost** — repost WITH commentary. New "Quote repost" item in the post's 3-dot menu opens the compose dialog with the original post quoted (non-editable block above the text area). Quote posts render with a bordered, clickable quoted card in the feed and post detail page.
3. **Post detail replies upgrade** — chat-bubble styled reply cards with avatars + thread connectors, media, explicit "Reply" buttons enabling nested replies, and richer author metadata (verified badge, institution pill, "you" tag).

## Files changed
**Backend:**
- prisma/schema.prisma — added `quoteOfId String?` self-relation ("PostQuote")
- src/lib/serializers.ts — serializePost now serializes `quoteOf` recursively
- src/lib/post-include.ts — added `quoteOf` to the shared Prisma include
- src/app/api/posts/route.ts — switched to shared postInclude; added quoteOfId handling + validation + notification
- src/app/api/posts/[id]/quote/route.ts — NEW: POST handler for quote creation

**Frontend (hooks/store):**
- src/lib/hooks.ts — Post interface gained `quoteOf`; useReplies takes optional `limit`; added useQuotePost mutation
- src/lib/api.ts — keys.replies takes (id, limit?)
- src/lib/store.ts — ComposeState gained optional `quoteOf` field; openCompose/closeCompose handle it

**Frontend (components):**
- src/components/quoted-post-block.tsx — NEW: reusable QuotedPostBlock with "card" and "compact" variants
- src/components/comments-preview.tsx — NEW: CommentsPreview component (fetches limited replies, renders avatars + truncated text + view-all + expand toggle)
- src/components/post-card.tsx — added "Quote repost" to 3-dot menu; renders quoted block; renders CommentsPreview below engagement bar
- src/components/compose-box.tsx — quote mode: header title, submit label, non-editable quoted preview above text area, routes submit to useQuotePost; scope selector hidden in quote mode
- src/views/post-detail-view.tsx — chat-bubble styled replies with avatars + thread connectors + media + Reply button (nested) + institution pill; main post also shows quoted block when applicable

**Infra/scripts:**
- /home/z/my-project/.zscripts/restart-dev.sh — NEW: detached dev server launcher (setsid+nohup+disown) with explicit DATABASE_URL (system env overrides to a stale SQLite path that fails the postgresql provider URL check)

## Dev server note
After `prisma generate`, Turbopack was using a cached Prisma client that didn't know about `quoteOf`. The dev server had to be restarted manually. The system-managed dev server has no auto-restart, so I wrote restart-dev.sh to launch it detached. PID saved to .zscripts/dev.pid. Currently running on port 3000 with the Supabase postgres DATABASE_URL.

## Verification
- `bun run lint`: 0 errors, 0 warnings
- POST /api/posts/{id}/quote → 200 with quoteOf populated
- GET /api/feed?tab=foryou → 200 with quoteOf field on every post
- GET /api/posts/{id}/replies?limit=2 → 200 returns only 2 replies
- Created a test quote post and verified it appears in the feed with the original post quoted
