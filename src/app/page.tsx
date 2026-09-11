"use client";

import { AppShell } from "@/components/app-shell";
import { useApp, useSession } from "@/lib/hooks";
import { HomeFeed } from "@/views/home-feed";
import { ExploreView } from "@/views/explore-view";
import { ActivityView } from "@/views/activity-view";
import { ProfileView } from "@/views/profile-view";
import { PostDetailView } from "@/views/post-detail-view";
import { InstitutionView } from "@/views/institution-view";
import { BookmarksView } from "@/views/bookmarks-view";
import { TagView } from "@/views/tag-view";
import { SettingsView } from "@/views/settings-view";
import { LoadingState } from "@/components/view-helpers";

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
    case "bookmarks":
      return <BookmarksView />;
    case "tag":
      return <TagView tag={view.tag} />;
    case "settings":
      return <SettingsView />;
    default:
      return <HomeFeed />;
  }
}

export default function Page() {
  const { isLoading } = useSession();
  return (
    <AppShell>
      {isLoading ? <LoadingState className="py-24" /> : <CurrentView />}
    </AppShell>
  );
}
