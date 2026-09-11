---
Task ID: 1-3
Agent: main (Z.ai Code)
Task: Foundation — DB schema, seed data, and API routes for the Scholar social platform.

Work Log:
- Wrote Prisma schema with User, Institution, InstitutionMember, Post, Like, Bookmark, Repost, Follow, Notification models.
- Pushed schema to SQLite via `bun run db:push`.
- Wrote `prisma/seed.ts` seeding 12 users (students + teachers), 3 institutions (Northbridge University, Maplewood College, Greenfield High), 28 top-level posts + 3 replies, follows, likes, bookmarks, reposts, and notifications. Ran via `bun run db:seed`.
- Reduced Prisma client logging to errors/warnings only.
- Added `src/lib/session.ts` (cookie-based current user, `requireUser` fallback to aria.chen).
- Added `src/lib/serializers.ts` (serializeUser / serializeInstitution / serializePost).
- Created API routes:
  - /api/session (GET/POST)
  - /api/feed?tab=foryou|following|institution (GET)
  - /api/posts (POST), /api/posts/[id] (GET/DELETE), /api/posts/[id]/replies (GET), /api/posts/[id]/{like,bookmark,repost} (POST toggle)
  - /api/users (GET search/suggest), /api/users/[username] (GET), /api/users/[username]/follow (POST toggle), /api/users/[username]/posts?tab=posts|replies|likes (GET)
  - /api/institutions (GET), /api/institutions/[handle] (GET), /api/institutions/[handle]/join (POST toggle), /api/institutions/[handle]/feed (GET, gated if private)
  - /api/notifications (GET, PATCH mark-read)
  - /api/explore (GET trending tags + suggested users + optional q post search)

Stage Summary:
- Database + API foundation complete. The app is a SPA served only at `/` with cookie-based demo session (default user: aria.chen). Next: design system (Threads-like), app shell, core components, and views.

---
Task ID: 4-16
Agent: main (Z.ai Code)
Task: Build the full Scholar frontend — design system, app shell, components, views, and end-to-end verification.

Work Log:
- Design system: rewrote globals.css with pure white/black Threads-like tokens (light + dark), Inter font, slim scrollbars, like-pop / fade-up / fade-in keyframe animations, safe-area utilities.
- Updated root layout (layout.tsx) to Inter font + Providers (next-themes + React Query + Sonner toaster), proper viewport metadata + theme-color.
- Zustand store (lib/store.ts) for SPA navigation (home/explore/search/activity/profile/post/institution/bookmarks/tag/settings) with history stack + compose modal state.
- lib/api.ts fetcher + query keys; lib/hooks.ts with all TanStack Query hooks (session, feed, post, replies, profile, user posts, search, institutions, notifications, explore, bookmarks) + optimistic mutations for like/bookmark/repost/follow/join/switch-user/delete + mark-notifications-read.
- Core components: UserAvatar (gradient-initials fallback + DiceBear avatars), VerifiedBadge, RelativeTime, EngagementBar (heart pop animation), PostCard (hashtag/mention highlighting, thread line, options menu, institution pill), UserCard, InstitutionPill, InstitutionCard, ScholarLogo (graduation-cap mark), ThemeToggle (mount-safe via useSyncExternalStore), ComposeBox (Dialog with image grid, hashtag extraction, institution scope picker, char ring).
- AppShell: desktop sidebar (logo, nav, New post button, theme toggle, user menu with account switcher) + mobile top bar (back/search/theme) + mobile bottom nav (Home/Explore/Activity/Profile + center Compose). Sticky headers per view.
- Views: HomeFeed (For You / Following / My School tabs + inline compose prompt), ExploreView (trending tags + suggested users + live search across people/schools/posts), ActivityView (typed notifications with auto mark-read), ProfileView (avatar, bio, role/department/institution, Posts/Replies/Likes tabs, follow/message), PostDetailView (full thread + reply composer + replies list), InstitutionView (cover/logo banner, members grid, join flow, gated private feed), BookmarksView, TagView, SettingsView (theme switch, account switcher modal).
- API route fixes: session GET now bootstraps default user (aria.chen) + sets cookie on first load; added Notification↔Post relation (re-pushed schema + regenerated client + restarted dev server).

Verification (Agent Browser):
- Home feed renders posts with authors, verified badges, hashtags, engagement bar. ✅
- Session auto-signs in as Aria Chen (Northbridge University). ✅
- Like toggle works (optimistic). ✅
- Compose → type → Post → new post appears at top of feed with #testing tag. ✅
- Explore: trending topics + suggested users + search finds people/schools/posts. ✅
- Institution: Greenfield (private) shows "This is a private feed" + "Request to join" for non-members; Northbridge (member) shows feed + "Post here" + "Joined". ✅
- Profile: shows role (Student), department (Computer Science), institution pill, Posts/Replies/Likes tabs. ✅
- Activity: renders all 5 seeded notifications (repost/reply/follow/likes) with actors. ✅
- Theme toggle: dark ↔ light works (desktop sidebar + mobile top bar). ✅
- Mobile 390px: top bar with back/search/theme + bottom nav (Home/Explore/Activity/Profile + center Compose) + compose modal. ✅
- Lint: 0 errors, 0 warnings. Dev log: all routes 200. ✅

Stage Summary:
- Scholar is a production-grade, Threads-styled social platform for students/teachers/institutions. Single-route SPA at `/`. Clean black/white minimal aesthetic, Inter font, dark/light themes, fully mobile-responsive with native-feel bottom nav, optimistic interactions, and institution private feeds. Verified end-to-end in the browser.
