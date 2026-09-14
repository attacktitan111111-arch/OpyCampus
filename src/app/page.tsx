"use client";

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
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

function CurrentView() {
  const { view } = useApp();
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

// Views that are safe to browse while signed out
const PUBLIC_VIEWS = new Set(["explore", "search", "tag", "institutions", "communities", "community", "institution", "legal"]);

export default function Page() {
  const { data: session, isLoading } = useSession();
  const { view, openAuth } = useApp();
  const me = session?.user;

  if (isLoading) {
    return (
      <AppShell>
        <LoadingState className="py-24" />
      </AppShell>
    );
  }

  // Signed-out gating: most views require auth
  if (!me && !PUBLIC_VIEWS.has(view.name)) {
    return (
      <AppShell>
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
      </AppShell>
    );
  }

  return (
    <AppShell>
      <CurrentView />
    </AppShell>
  );
}
