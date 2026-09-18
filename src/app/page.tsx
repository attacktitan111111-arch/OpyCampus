"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { useApp, useSession } from "@/lib/hooks";
import { HomeFeed } from "@/views/home-feed";
import { ExploreView } from "@/views/explore-view";
import { ActivityView } from "@/views/activity-view";
import { ProfileView } from "@/views/profile-view";
import { PostDetailView } from "@/views/post-detail-view";
import { InstitutionView } from "@/views/institution-view";
import { CommunityView } from "@/views/community-view";
import { CommunitiesView } from "@/views/communities-view";
import { InstitutionsView } from "@/views/institutions-view";
import { BookmarksView } from "@/views/bookmarks-view";
import { TagView } from "@/views/tag-view";
import { SettingsView } from "@/views/settings-view";
import { EditProfileView } from "@/views/edit-profile-view";
import { FollowsView } from "@/views/follows-view";
import { MessagesView } from "@/views/messages-view";
import { ConversationView } from "@/views/conversation-view";
import { OnboardingView } from "@/views/onboarding-view";
import { LegalView } from "@/views/legal-view";
import { EmptyState, SkeletonFeed } from "@/components/view-helpers";
import { SplashScreen, useSplashTimer } from "@/components/splash-screen";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

/**
 * Maps the current app view to its rendered component. Kept as a pure
 * function so AnimatePresence can detect a key change and animate.
 */
function renderView(view: ReturnType<typeof useApp.getState>["view"]) {
  switch (view.name) {
    case "home":
      return <HomeFeed />;
    case "explore":
      return <ExploreView />;
    case "search":
      return <ExploreView initialQuery={view.query} />;
    case "activity":
      return <ActivityView />;
    case "profile":
      return <ProfileView username={view.username} />;
    case "post":
      return <PostDetailView postId={view.postId} />;
    case "institution":
      return <InstitutionView handle={view.handle} />;
    case "community":
      return <CommunityView handle={view.handle} />;
    case "communities":
      return <CommunitiesView />;
    case "institutions":
      return <InstitutionsView />;
    case "bookmarks":
      return <BookmarksView />;
    case "tag":
      return <TagView tag={view.tag} />;
    case "settings":
      return <SettingsView />;
    case "messages":
      return <MessagesView />;
    case "conversation":
      return <ConversationView id={view.id} />;
    case "edit-profile":
      return <EditProfileView />;
    case "onboarding":
      return <OnboardingView />;
    case "legal":
      return <LegalView page={view.page} />;
    case "follows":
      return <FollowsView username={view.username} tab={view.tab} />;
    default:
      return <HomeFeed />;
  }
}

/**
 * Builds a stable string key for the current view. Used by AnimatePresence
 * to decide when to mount/unmount and run the fade+slide transition. We
 * include the relevant params (username, postId, tag, etc.) so navigating
 * profile→profile animates a fresh transition.
 */
function viewKey(view: ReturnType<typeof useApp.getState>["view"]): string {
  switch (view.name) {
    case "profile":
      return `profile:${view.username}`;
    case "post":
      return `post:${view.postId}`;
    case "tag":
      return `tag:${view.tag}`;
    case "search":
      return `search:${view.query ?? ""}`;
    case "institution":
      return `institution:${view.handle}`;
    case "community":
      return `community:${view.handle}`;
    case "conversation":
      return `conversation:${view.id}`;
    case "follows":
      return `follows:${view.username}:${view.tab}`;
    case "legal":
      return `legal:${view.page}`;
    default:
      return view.name;
  }
}

// Views that are safe to browse while signed out
const PUBLIC_VIEWS = new Set(["explore", "search", "tag", "institutions", "communities", "community", "institution", "legal"]);

export default function Page() {
  const { data: session, isLoading } = useSession();
  const { view, openAuth } = useApp();
  const me = session?.user;
  const showSplash = useSplashTimer(900);

  // Scroll to top on every view change so the new view starts at the top
  // of the page after the transition.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [viewKey(view)]);

  return (
    <>
      <SplashScreen visible={showSplash} />
      <AppShell>
        <AnimatePresence mode="wait" initial={false}>
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="mx-auto w-full max-w-[640px]">
                <SkeletonFeed count={4} />
              </div>
            </motion.div>
          ) : !me && !PUBLIC_VIEWS.has(view.name) ? (
            <motion.div
              key="signed-out"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mx-auto w-full max-w-[640px]">
                <EmptyState
                  icon={GraduationCap}
                  title="Sign in to OpyCampus"
                  description="Join your school's community, post, reply, and connect with classmates and teachers."
                  className="py-24"
                  action={
                    <div className="flex gap-2">
                      <Button className="rounded-full" onClick={() => openAuth("login")}>Sign in</Button>
                      <Button variant="secondary" className="rounded-full" onClick={() => openAuth("signup")}>Create account</Button>
                    </div>
                  }
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={viewKey(view)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {renderView(view)}
            </motion.div>
          )}
        </AnimatePresence>
      </AppShell>
    </>
  );
}
