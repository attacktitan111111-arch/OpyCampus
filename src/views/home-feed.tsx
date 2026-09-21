"use client";

import { useEffect, useRef, useState } from "react";
import { Users, School, PenSquare, Sparkles, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp, useFeed, useSession } from "@/lib/hooks";
import { PostCard } from "@/components/post-card";
import { EmptyState, SkeletonFeed } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";
import { SparkIcon } from "@/components/custom-icons";

const TABS = [
  { key: "foryou", label: "For you", renderIcon: (active: boolean) => <SparkIcon filled={active} className="h-4 w-4 lg:hidden" /> },
  { key: "following", label: "Following", renderIcon: () => <Users className="h-4 w-4 lg:hidden" /> },
  { key: "institution", label: "My School", renderIcon: () => <School className="h-4 w-4 lg:hidden" /> },
] as const;

export function HomeFeed() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("foryou");
  const { data, isLoading, isError, refetch } = useFeed(tab);
  const { openCompose } = useApp();
  const { data: session } = useSession();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [tabsVisible, setTabsVisible] = useState(true);

  // Scroll-based tabs show/hide — slides up with the top bar
  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 50) setTabsVisible(true);
      else if (currentY > lastY && currentY > 120) setTabsVisible(false);
      else if (currentY < lastY) setTabsVisible(true);
      lastY = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const posts = data?.posts ?? [];
  const hasInstitution = !!session?.user?.institution;

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <div className="w-full">
      {/* Tabs — slides up/down with the top bar on scroll */}
      <div className={cn("sticky top-14 z-20 border-b border-border bg-background/90 backdrop-blur-md transition-transform duration-300 lg:top-0", tabsVisible ? "translate-y-0" : "-translate-y-full")}>
        <div className="relative flex overflow-x-hidden">
          {TABS.map((t) => {
            const active = tab === t.key;
            const disabled = t.key === "institution" && !hasInstitution;
            return (
              <button
                key={t.key}
                ref={(el) => { tabRefs.current[t.key] = el; }}
                disabled={disabled}
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative flex flex-1 items-center justify-center gap-1.5 py-3.5 text-[14px] font-semibold transition-colors tap-highlight-none",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  disabled && "cursor-not-allowed opacity-40"
                )}
              >
                {t.renderIcon(active)}
                <span>{t.label}</span>
                {active && (
                  <motion.span
                    layoutId="home-tab-underline"
                    className="absolute inset-x-0 -bottom-px mx-auto h-[3px] w-12 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compose prompt (desktop inline) */}
      <div className="hidden border-b border-border px-4 py-3 lg:block lg:px-5">
        <button
          onClick={() => openCompose()}
          className="flex w-full items-center gap-3 rounded-full border border-border bg-secondary/40 px-4 py-2.5 text-left text-muted-foreground transition hover:bg-secondary hover:border-foreground/20 press-down"
        >
          <PenSquare className="h-4 w-4" />
          <span>Share something with your class…</span>
        </button>
      </div>

      {/* Feed */}
      {isLoading ? (
        <SkeletonFeed count={4} />
      ) : isError ? (
        <EmptyState title="Couldn't load posts" description="Pull to try again — refresh the page." />
      ) : posts.length === 0 ? (
        tab === "following" ? (
          <EmptyState
            icon={Users}
            title="Your following feed is quiet"
            description="Follow classmates and teachers to see their posts here."
            action={
              <Button onClick={() => setTab("foryou")} variant="secondary" className="rounded-full">
                Explore For You
              </Button>
            }
          />
        ) : tab === "institution" ? (
          <EmptyState
            icon={School}
            title="No posts in your school feed yet"
            description="Be the first to share something with your institution."
            action={
              <Button onClick={() => openCompose()} className="rounded-full">
                <PenSquare className="mr-2 h-4 w-4" /> Write a post
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Sparkles}
            title="Nothing here yet"
            description="Be the first to post on OpyCampus."
            action={
              <Button onClick={() => openCompose()} className="rounded-full">
                Write a post
              </Button>
            }
          />
        )
      ) : (
        <div className="divide-y divide-border">
          {posts.map((p, i) => (
            <PostCard key={p.id} post={p} showThreadLine={i < posts.length - 1} />
          ))}
        </div>
      )}

      <div className="h-20" />
    </div>
  );
}
