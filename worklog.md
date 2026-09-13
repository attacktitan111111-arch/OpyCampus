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

---
Task ID: POLISH-1
Agent: frontend-styling-expert
Task: Audit and polish Scholar UI to production-grade Threads-like aesthetic — fix profile header redundancy, refine spacing/typography, polish post cards + engagement bar, compose dialog, avatars, mobile responsiveness, and dark mode.

Work Log:
- globals.css: refined design tokens. Bumped --radius to 0.875rem for slightly softer corners. Tightened muted-foreground to oklch(0.52) for better readability in light; kept dark at 0.62. Added base `font-size: 16px`, `line-height: 1.5` on body, font-feature-settings "cv11 ss01 cv05" for premium Inter feel. Added `letter-spacing: -0.011em` + `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs. Added `:focus-visible` ring for keyboard a11y. Bumped selection colors. Added component-layer helpers: `.scholar-sticky-bar`, `.scholar-row-hover`, `.touch-visible`. Kept true-black dark mode (oklch(0 0 0)) for OLED.
- profile-view.tsx: fixed the explicit redundancy (top sticky bar was showing name + verified badge, then profile body showed it again). Now the sticky bar shows ONLY `@username` + post count as a subtle context bar; the body keeps the prominent full name + verified badge + bio + counts. Also hid the back button on mobile (`hidden lg:inline-flex`) since the mobileTop in AppShell already provides one — eliminating a second back-button redundancy.
- post-card.tsx: hover state now uses `hover:bg-muted/40` (slightly stronger). Options menu button (`MoreHorizontal`) is now always visible on mobile (touch devices can't hover) and `lg:opacity-0 lg:group-hover:opacity-100` on desktop. Body content uses `text-[15px] leading-[1.55] text-pretty` for proper wrapping. Engagement bar moved to `-ml-2.5` to align the first icon edge with the avatar's left edge (Threads pattern). Added `tap-highlight-none` for native-feel taps.
- engagement-bar.tsx: rebuilt layout to use `justify-between gap-1 sm:max-w-[420px]` (was `max-w-xs -ml-2`). Each button now has its own `hover:bg-accent` pill background for clearer affordance. Counters use `tabular-nums leading-none` for alignment. Cleaner gap between icon and counter.
- compose-box.tsx: added a clear empty drop area ("Add photo or video" — dashed border, full-width) above the toolbar that opens the file picker directly, solving the "where do I upload?" UX issue. Avatar bumped to 44px to match post-card. Toolbar now uses a vertical separator (`h-5 w-px bg-border`) between hashtag button and scope picker for visual grouping. Upload icon button only shows when media already exist (otherwise the empty drop area handles it). Media previews got `bg-background/85` + shadow for clearer remove buttons. Textarea uses `leading-[1.5]`.
- app-shell.tsx: mobileTop bumped to `bg-background/85` for slightly stronger blur. Logo button + back button now have `transition hover:opacity-80` and `tap-highlight-none`. Account menu trigger button got an `aria-label="Account menu"`. Compose button + sign-in button have `tap-highlight-none` + `active:scale-95` for native tap feedback. Added `aria-label="Scholar home"` to the logo buttons.
- user-avatar.tsx: img inside avatar now has `pointer-events-none` (so clicks always go to the outer div, not the image). Initials use `Math.max(11, size * 0.36)` to prevent microscopic text on small avatars. Added `active:scale-[0.97]` press feedback when clickable. VerifiedBadge class list reorganized for clarity.
- post-detail-view.tsx: header now says "Post" (was "Post" with bold). Back button hidden on mobile (`hidden lg:inline-flex`) — mobileTop provides one. Main post content uses `leading-[1.55] text-pretty`. Engagement bar wrapper uses `mt-2 -ml-2.5 border-y border-border py-1.5` for a cleaner full-width divider. Reply composer trigger gets `hover:border-foreground/20` for subtle hover affordance. Replies section uses `text-pretty` for better wrapping.
- home-feed.tsx: FIXED A BUG — `Sparkles` icon was referenced but never imported (would crash if the empty-state rendered). Added `Sparkles` to the lucide imports. Compose prompt button gets `hover:border-foreground/20`. Tabs use `cursor-not-allowed` when disabled for clarity.
- institution-view.tsx + community-view.tsx: same header pattern as profile — sticky bar now shows `@handle` + posts/members count (no duplicate of name); body shows full name + verified badge. Back button hidden on mobile (mobileTop has it). Body content uses `leading-[1.55] text-pretty`. Spacing bumped to `px-4 sm:px-5` consistently across header and body. Banner unchanged (already clean).
- bookmarks-view.tsx + settings-view.tsx + activity-view.tsx + explore-view.tsx: applied the same header pattern (back button hidden on mobile, `bg-background/85`, `text-[15px] font-semibold` heading, `lg:px-5` for desktop padding). Activity and Explore top bars don't show back button anyway (they're top-level views).

Verification (Agent Browser, both desktop 1440×900 and mobile 390×844):
- Home feed renders posts with avatars, verified badges, hashtags, engagement bar, options menu (visible on mobile, hover on desktop). ✅
- Profile (desktop + mobile): header bar shows ONLY `@aria.chen` + "6 posts" — body shows "Aria Chen" h1 + verified badge + bio + role + institution pill + Following/Followers. No more redundant name+badge duplication. ✅
- Mobile profile: only ONE back button (in mobileTop), no duplicate in sticky profile bar. ✅
- Desktop profile: back button visible in sticky bar (since desktop has no mobileTop). ✅
- Post detail: header says "Post" with desktop back button. Engagement bar in clean divider. Reply composer + Replies section render. ✅
- Compose dialog: empty drop area ("Add photo or video") is clear and tappable. Toolbar organized with separator. Char ring + counter render. ✅
- Institution view (Northbridge): minimal sticky header (`@northbridge-u` + counts), full name + verified badge in body, members grid, feed renders. ✅
- Community view (CS251): same pattern, clean banner + icon + join button. ✅
- Activity view: minimal "Activity" header, notification rows render. ✅
- Settings view: minimal "Settings" header, profile card, appearance toggle, account section. ✅
- Dark mode: pure black background, subtle alpha-white borders, all elements render correctly. ✅
- Lint: 0 errors, 0 warnings. Dev server: 200 OK on all routes. ✅

Issues Found & Fixed:
1. Profile header redundancy (PRIMARY ISSUE) — fixed: top bar now shows only @handle + post count, body shows full name + badge.
2. Back-button redundancy on mobile — fixed: secondary sticky bars' back buttons are `hidden lg:inline-flex` (mobileTop provides back on mobile).
3. home-feed.tsx runtime bug — `Sparkles` was used but not imported; would have crashed the empty-state. Fixed by adding the import.
4. Post-card options menu invisible on touch — fixed: now always visible on mobile (`opacity-100` by default, `lg:opacity-0` only on desktop with hover-reveal).
5. Engagement bar alignment — fixed: removed `max-w-xs -ml-2` constraint, replaced with `justify-between gap-1 sm:max-w-[420px]` and proper `-ml-2.5` on the wrapper for edge alignment with avatar.
6. Compose file upload UX — fixed: added explicit dashed-border drop area in the body so users know where to upload (was just a small icon button in the toolbar).
7. Inconsistent header padding — fixed: all secondary bars now use `px-4 lg:px-5` and `bg-background/85` consistently.
8. Typographic inconsistency — fixed: post body content uses `leading-[1.55] text-pretty`; headings use `letter-spacing: -0.011em`.

Stage Summary:
- Scholar UI is now production-grade with a clean Threads-like aesthetic. The profile header redundancy is eliminated, post cards have proper hover + touch affordances, the compose dialog has a clear upload area, avatars are robust, mobile has no duplicate back buttons, dark mode is true black, and typography is consistent. All changes are visual/CSS/component only — no API, Prisma, or lib/store/hooks files were touched. Lint clean, dev server responding 200 on all routes.

---
Task ID: UPLOAD-FIX
Agent: main (Z.ai Code)
Task: Fix critical upload bug — /api/upload route was missing, causing 404 "Failed to find Server Action" on every photo/video upload attempt.

Work Log:
- Root cause: The /api/upload/route.ts file was missing from disk (deleted during a prior operation), so every POST /api/upload returned 404 "Failed to find Server Action". This is why users could not upload photos or videos.
- Recreated src/app/api/upload/route.ts with: nodejs runtime, force-dynamic, FormData parsing, file type validation (JPG/PNG/WEBP/GIF/MP4/WEBM/MOV), size limits (12MB images / 60MB videos), disk storage to /upload, Attachment DB record.
- Cleared stale .next cache (rm -rf .next) which may have cached the missing route.
- Improved useUploadFile hook: added client-side validation (type + size + empty checks) for instant feedback before hitting the server, better error messages.
- Upgraded compose-box UX: added drag-and-drop upload area with visual feedback (border highlight on drag-over), upload progress indicator with filename + animated bar, clear file-type hints ("JPG, PNG, WEBP, GIF · MP4, WEBM, MOV").
- Verified end-to-end via Agent Browser:
  - Login as aria.chen → compose → upload PNG (canvas-generated) → post → image appears in feed, loads at 200x200. ✅
  - Upload video MP4 → 200, file served with range request (206 for seeking). ✅
  - Signup new account "Jordan Lee" → upload image → post → image appears in feed. ✅
  - File serving: images HTTP 200 with correct content-type, videos HTTP 206 with content-range. ✅
  - All dev log entries: POST /api/upload 200, GET /api/files/* 200/206 — no errors. ✅
  - Lint: 0 errors, 0 warnings. ✅

Stage Summary:
- Upload bug FIXED. The full pipeline now works: pick/drag file → validate client-side → upload to /api/upload → stored on disk + DB → preview in compose → post with media → image/video renders in feed and profile. Works for any authenticated user. Real auth (signup/login/logout with scrypt + DB sessions) verified with a brand-new account.
