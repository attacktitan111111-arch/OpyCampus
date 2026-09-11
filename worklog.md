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

---
Task ID: 17-26
Agent: main (Z.ai Code)
Task: Upgrade Scholar to production-grade with real auth, file uploads, user-created institutions, and communities.

Work Log:
- Schema: added Session model (opaque token, sha256-hashed in DB, 60-day TTL), password (scrypt) on User, Community + CommunityMember models, Attachment model, communityId on Post, ownerId on Institution, renamed images→media (JSON of {url,type:"image"|"video"}).
- Auth library (lib/auth.ts): scrypt password hashing (salt:hash), timingSafeEqual verify, randomBytes session tokens, sha256 token hashing, validators for email/username/password, slugifyHandle.
- Session (lib/session.ts): rewrote to use DB-backed Session table via httpOnly cookie `scholar_session` — no more demo bootstrap; returns null when unauthenticated.
- Auth API routes: /api/auth/signup (email+username+password+role, creates session), /api/auth/login (identifier=email|username + password, verifies scrypt hash, creates session), /api/auth/logout (deletes session + clears cookie).
- Upload API (/api/upload): multipart/form-data, accepts JPG/PNG/WEBP/GIF/MP4/WEBM/MOV, 12MB images / 60MB videos, saves to /upload dir, stores Attachment metadata.
- File serving (/api/files/[id]): DB lookup → streams file with correct Content-Type + range-request support (206) for video seeking, immutable cache headers.
- Re-seeded with hashed passwords ("scholar123" for all 12 demo accounts) + 4 communities (Algorithms Study Group, Design Critique Club, Morning Runners, CS251 course) + owner links on institutions.
- Communities API: GET/POST /api/communities (create with name/handle/category/isPrivate/icon/cover), GET /api/communities/[handle], POST join toggle, GET /api/communities/[handle]/feed (gated if private).
- Institutions API: added POST /api/institutions (create with cover/logo uploads, type, location, website, isPrivate, owner becomes admin member).
- Posts API: updated to media field, supports communityId scope, membership checks for institution+community.
- Frontend store: added `authOpen` (login|signup), community/institution/communities/institutions views, compose `scope` (public|institution|community).
- Hooks: added useSignup, useLogin, useLogout, useUploadFile, useCreateInstitution, useCreateCommunity, useJoinCommunity, useCommunity, useCommunityFeed, useCommunitiesSearch; MediaItem type; optimistic post updates via shared invalidateAllPosts helper.
- Auth overlay (components/auth-overlay.tsx): login + signup modes, email/username + password, show/hide password, student/teacher role toggle, demo quick-login chips (4 accounts), validation + toast errors.
- AppShell: replaced demo account switcher with real auth — signed-out shows Sign in / Create account CTAs in sidebar + mobile bottom nav; user menu has real Sign out; added Groups nav item with custom CommunityIcon.
- Compose: real device file picker (multiple images/videos), upload via /api/upload with progress spinner, video thumbnail previews in grid, scope picker now supports Public / Institution / Community with lock icons.
- PostCard: renders media (images + <video controls>), community context pill with CommunityIcon, institution pill.
- Custom icons (custom-icons.tsx): SparkIcon (premium 4-point star for "For You"), CommunityIcon (group of figures), SchoolIcon.
- Communities view: discover + my-groups tabs, search, create-group dialog (icon upload, name, handle, description, category picker, private toggle).
- Institutions view: search + create-school dialog (cover upload, logo upload, name, handle, type, bio, location, website, private toggle).
- Community detail view: banner, icon, members grid, join flow, private gating, post-here compose scoped to community.
- Post detail view: updated for media + community context.
- Settings view: removed demo switcher, added real Sign out, Schools/Groups quick links, theme switch.
- Page.tsx: auth gating — signed-out users see Explore/Schools/Groups publicly but Home/Activity/Profile/Bookmarks prompt sign-in.
- SQLite fix: replaced all `mode: "insensitive"` (unsupported in SQLite) with case-variant OR queries for username lookups in login/signup/users.
- Explore fix: ExploreHome component now uses useApp() for nav (Schools/Groups cards were not navigating).

Verification (Agent Browser):
- Signed-out state shows "Sign in to Scholar" with CTAs. ✅
- Login via demo quick-login (aria.chen) → feed loads with For You/Following/My School. ✅
- Compose + post real text → appears at top of feed. ✅
- Upload API: real PNG uploaded → 200, file stored on disk + DB; SVG rejected (415). ✅
- File serving: GET /api/files/[id] → 200 with correct content-type. ✅
- Community creation: "Robotics Club" created → user is Owner, "Post here" available. ✅
- Institution creation: "Riverside Tech Institute" created → admin/owner, "Post here" available. ✅
- Groups view: shows 4 seeded communities + created one with Join/Joined states. ✅
- Schools view: shows 3 seeded institutions + created one. ✅
- Profile: role (Student), department, institution pill render. ✅
- Logout: session cleared, returns to signed-out state. ✅
- Signup: new account "Maya Rahman" @mayarahman created + auto-logged-in. ✅
- Mobile 390px: bottom nav (Home/Explore/Groups/Activity/Profile + Compose) renders. ✅
- Lint: 0 errors, 0 warnings. Dev log: all routes 200. ✅

Stage Summary:
- Scholar is now a real, production-grade platform: credential-based auth (scrypt + httpOnly session cookies), real image/video uploads from device with disk storage + range-request video streaming, user-created institutions (schools/colleges/universities with cover/logo uploads + private feeds), and full communities/groups (study groups, clubs, courses with create/join/feed). Custom premium SVG icons (SparkIcon for For You, CommunityIcon for Groups) matching the Scholar graduation-cap brand. All verified end-to-end in the browser.
