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

---
Task ID: INTERACTION-FIX
Agent: main (Z.ai Code)
Task: Fix critical UX bug — Like/Repost/Save/Share clicks were navigating to the post detail page instead of working inline.

Work Log:
- Root cause: The PostCard's <article> element has onClick={openPost} to navigate to the post detail page. The EngagementBar buttons (Like, Repost, Bookmark, Share) did NOT call e.stopPropagation(), so their clicks bubbled up to the article's onClick, causing unwanted navigation + a loading state on the post detail page.
- Fix: Added a wrapper onClick={(e) => e.stopPropagation()} on the EngagementBar's root div, so ALL clicks inside the engagement bar are prevented from bubbling to the parent article. Also added explicit e.stopPropagation() to each button handler for defense-in-depth.
- Fix: Removed the unused useMemo import from post-card.tsx (lint cleanup).
- Fix: Fixed the Reply handler type mismatch — PostCard's onReply took (e: React.MouseEvent) but EngagementBar called it as onReply?.() without the event, causing e.stopPropagation() to throw on undefined. Changed PostCard's onReply to () => void (propagation is already stopped in EngagementBar).
- Fix: Added onClick={(e) => e.stopPropagation()} on the media container in PostCard so clicking on images/videos (especially video controls) doesn't navigate to the post detail page.
- Verified via Agent Browser:
  - Click Like → URL stays at /, stays on feed ✅
  - Click Repost → URL stays at /, stays on feed ✅
  - Click Save → URL stays at /, stays on feed ✅
  - Click Share → URL stays at /, stays on feed ✅
  - Click Reply → compose dialog opens (no navigation) ✅
  - Click post content (non-interactive area) → navigates to post detail (intended) ✅
  - Click author name → navigates to profile (intended) ✅
  - Lint: 0 errors, 0 warnings ✅

Stage Summary:
- The core UX bug is fixed: all engagement interactions (like, repost, save, share, reply) now work inline with zero navigation and zero loading. Only clicking the post content/author/hashtags navigates, which is the intended Threads-like behavior. The app is now smooth and usable.

---
Task ID: VIEWS-1
Agent: views-builder (Z.ai Code)
Task: Build new frontend views (edit-profile, follows, messages, conversation, onboarding, legal) and update profile-view + page.tsx routing for OpyCampus.

Work Log:
- Read existing worklog and src/lib/hooks.ts, src/lib/store.ts, src/app/page.tsx, profile-view.tsx, and supporting components (view-helpers, user-card, institution-card, user-avatar, post-card) to learn patterns and conventions.
- Created `src/views/edit-profile-view.tsx`:
  - Splits into a parent `EditProfileView` (session gate + signed-out state) and `EditProfileForm` keyed by `me.id` so initial state is set from useState initializers (no setState-in-effect anti-pattern).
  - Form fields: name (with NAME_MAX=60 counter), bio (with BIO_MAX=160 counter), department, location, website. All inputs use the existing `.auth-input` CSS class.
  - Avatar and cover upload via `useUploadFile`, then `useUpdateProfile({avatarUrl})` / `useUpdateProfile({coverUrl})` to persist immediately. Spinner overlays during upload.
  - Save button calls `useUpdateProfile` with the text fields, shows toast on success, and navigates to the profile view.
  - Back button (lg only — mobileTop provides back on mobile).
- Created `src/views/follows-view.tsx`:
  - Header with back button + `@username` subtitle. Tabs (Following / Followers) reuse the `follows` view via `nav({ name: "follows", username, tab })`.
  - Uses `useFollowing(username)` or `useFollowers(username)` based on the `tab` prop. Renders the existing `UserCard` with the right `following` flag derived from the API's `following` array.
  - Loading + empty states (with CTA to explore).
- Created `src/views/messages-view.tsx`:
  - Header with back + PenSquare "new message" button. List of conversations from `useConversations()`.
  - Each row shows the other user's avatar/name/@handle plus last message preview (prefixed with "You: " when the last sender was me, derived from `meId` passed to the row) and a relative time.
  - Click → `nav({ name: "conversation", id })`.
  - Empty state with CTA to start a new message.
  - `NewMessageDialog` component (shadcn Dialog): inline user search via `useUsersSearch(q)`; clicking a result calls `useStartConversation({ username })` and navigates to the conversation.
- Created `src/views/conversation-view.tsx`:
  - Header: back button + clickable avatar/name of the other participant (navigates to their profile).
  - Messages list with `useConversationMessages(id)`. Each message renders a chat bubble aligned left/right based on `isMe`. Bubbles from the same sender within 5 minutes are visually grouped (tighter top margin).
  - Composer: textarea + Send button. Enter to send (Shift+Enter for newline). `useSendMessage({ id, content })`. On error, restores the unsent text and toasts. Disables while pending.
  - Auto-scrolls to bottom on new messages via a ref + useEffect.
  - Container uses `h-[calc(100dvh-7.5rem)] lg:h-screen` so the composer stays pinned at the bottom on mobile (under the bottom nav) and fills the desktop viewport.
- Created `src/views/onboarding-view.tsx` (5-step flow):
  - Parent `OnboardingView` (session gate + signed-out empty state) and a child `OnboardingFlow` keyed by `me.id` to avoid setState-in-effect.
  - Progress dots at top with skip button (except on the final step).
  - Step 1 (Welcome): big avatar uploader with `useUploadFile` + instant `useUpdateProfile({avatarUrl})`.
  - Step 2 (Bio + department): text fields with counters; saves via `useUpdateProfile({bio, department})` before advancing.
  - Step 3 (School): search institutions via `useInstitutionsSearch(q)`, join via `useJoinInstitution`. Selected state shown on the card. Continue works whether or not a school was picked.
  - Step 4 (Follow): suggested users via `useExplore("")`; toggling follow via `useToggleFollow` and tracking in a local Set. Counter + Continue (Skip until 3+ followed).
  - Step 5 (Done): celebratory summary card + "Go to feed" CTA → `nav({ name: "home" })`.
- Created `src/views/legal-view.tsx`:
  - Header with back + sub-page tabs for Terms / Privacy / Guidelines (each tab navigates with `nav({ name: "legal", page: ... })`).
  - Body content from `useLegal(page)`. Parses paragraphs split by `\n\n`; lists (blocks whose remaining lines start with `- `) render as `<ul>`; short numbered heading-like lines render as `<h3>`.
  - Added `legal` to `PUBLIC_VIEWS` in page.tsx so signed-out users can read legal pages.
- Updated `src/views/profile-view.tsx`:
  - Tabs changed from Posts/Replies/Likes to Posts/Reposts/Likes (icons: Grid3x3 / Repeat2 / Heart).
  - Reposts tab uses `useUserReposts(username)`; likes tab continues to use `useUserPosts(username, "likes")`.
  - Following & Followers counts are now clickable → `nav({ name: "follows", username, tab: "following" | "followers" })`.
  - Message button (Mail icon) next to Follow; calls `useStartConversation({ username })` and navigates to the conversation. Replaced the old reply-prefill behavior.
  - Cover photo (user.coverUrl) renders above the avatar as a banner; the avatar pulls up with `-mt-10` so it overlaps the cover edge (matches the institution-view pattern).
  - Location and website are now shown in the meta row (with MapPin / Globe icons); website is linkified and stripped of the `https?://` prefix for display.
  - "Edit profile" button now navigates to `nav({ name: "edit-profile" })` (was going to settings).
- Updated `src/app/page.tsx`:
  - Imported all new views and added `case` branches for `messages`, `conversation`, `edit-profile`, `onboarding`, `legal`, `follows`.
  - Added `legal` to `PUBLIC_VIEWS` so signed-out users can read legal pages.
- Fixed a pre-existing bug in `src/components/app-shell.tsx`: the import `from "./scholar-logo"` was pointing at a non-existent file (the file was renamed to `opycampus-logo.tsx`). Updated the import path to `"./opycampus-logo"` so the app shell renders (was causing a 500 on `/`).

Verification:
- `bun run lint`: 0 errors, 0 warnings. ✅
- Dev log shows `GET / 200`, `GET /api/session 200`, `GET /api/legal?page=terms 200`, `GET /api/conversations 200`, `GET /api/users/aria.chen/following|followers|reposts 200`, `GET /api/legal?page=guidelines 200`. ✅
- `curl http://localhost:3000/` returns 200 (previously 500 due to the bad import). ✅

Stage Summary:
- All 6 new views are built and routed. Profile view now has reposts tab, clickable follow counts, message button, cover photo, location/website display, and Edit-profile navigation. The app shell renders correctly again after the import-path fix. Lint is clean and the dev server returns 200 on all the relevant API routes.

---
Task ID: OPYCAMPUS-REBRAND
Agent: main (Z.ai Code)
Task: Rename to OpyCampus + add DMs, following/follower lists, edit profile, onboarding, legal pages, reposts tab.

Work Log:
- Renamed entire app from "Scholar" to "OpyCampus" — logo, metadata, auth overlay, settings, engagement bar, home feed, page title.
- Schema: added Conversation, ConversationMember, Message models for DMs; added coverUrl, location, website fields to User.
- API routes built:
  - PATCH /api/profile — edit name, bio, department, location, website, avatarUrl, coverUrl
  - GET /api/users/[username]/following — list who someone follows
  - GET /api/users/[username]/followers — list someone's followers
  - GET /api/users/[username]/reposts — reposted posts by a user
  - GET+POST /api/conversations — list + start conversations
  - GET+POST /api/conversations/[id]/messages — get + send messages
  - GET /api/legal?page=terms|privacy|guidelines — legal page content
- Serializers: added coverUrl, location, website to serializeUser.
- Hooks: added useUpdateProfile, useFollowing, useFollowers, useUserReposts, useConversations, useStartConversation, useConversationMessages, useSendMessage, useLegal.
- Store: added views — messages, conversation, edit-profile, onboarding, legal, follows; profile tab now includes "reposts".
- Views built (via subagent):
  - edit-profile-view.tsx — edit name/bio/department/location/website + upload avatar/cover
  - follows-view.tsx — following/followers list with tabs
  - messages-view.tsx — DM inbox + new message dialog with user search
  - conversation-view.tsx — chat thread with bubbles, auto-scroll, enter-to-send
  - onboarding-view.tsx — 5-step onboarding (avatar → bio → school → follow → done)
  - legal-view.tsx — Terms/Privacy/Guidelines with sub-page tabs
- Profile view updated: tabs are now Posts/Reposts/Likes (removed Replies); Following/Followers counts are clickable; Message button starts conversation; cover photo banner; location/website shown.
- App shell: added Messages to account menu.
- Settings: added Legal section (Terms/Privacy/Guidelines) + Messages link.

Verification:
- Upload API returns 200 ✅
- Profile shows Posts/Reposts/Likes tabs ✅
- Following list shows 4 users ✅
- Edit profile form loads with pre-filled fields ✅
- Messages view shows empty state ✅
- Terms of Service page renders full content ✅
- Lint: 0 errors, 0 warnings ✅

Stage Summary:
- OpyCampus now has: real auth, image/video uploads, DMs, following/follower lists, edit profile with avatar/cover upload, 5-step onboarding, legal pages (Terms/Privacy/Guidelines), reposts tab in profile, communities, institutions with private feeds. Ready for the Play Store launch guide.
