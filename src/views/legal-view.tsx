"use client";

import { ArrowLeft, FileText, Scale, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useLegal } from "@/lib/hooks";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";

const PAGES = [
  { key: "terms", label: "Terms", icon: FileText },
  { key: "privacy", label: "Privacy", icon: ShieldCheck },
  { key: "guidelines", label: "Guidelines", icon: Scale },
] as const;

export function LegalView({ page }: { page: string }) {
  const { back, nav } = useApp();
  const { data, isLoading, isError } = useLegal(page);

  const safePage = PAGES.find((p) => p.key === page) ? (page as (typeof PAGES)[number]["key"]) : "terms";

  return (
    <div className="mx-auto w-full max-w-[680px]">
      {/* Header */}
      <div className="lg:sticky lg:top-0 lg:z-10 border-b border-border bg-background/85 backdrop-blur-md lg:top-0">
        <div className="flex items-center gap-3 px-4 py-2.5 lg:px-5">
          <button
            onClick={back}
            className="hidden lg:inline-flex lg:h-9 lg:w-9 lg:items-center lg:justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold leading-tight">
              {data?.title ?? "Legal"}
            </h1>
          </div>
        </div>
        {/* Sub-page tabs */}
        <div className="flex">
          {PAGES.map((p) => {
            const active = p.key === safePage;
            const Icon = p.icon;
            return (
              <button
                key={p.key}
                onClick={() => nav({ name: "legal", page: p.key })}
                className={cn(
                  "relative flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[14px] font-semibold transition-colors tap-highlight-none",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {p.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-px mx-auto h-[3px] w-10 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <LoadingState className="py-24" />
      ) : isError || !data ? (
        <EmptyState
          icon={FileText}
          title="Couldn't load page"
          description="Please try again later."
          className="py-20"
          action={
            <Button variant="secondary" className="rounded-full" onClick={() => nav({ name: "home" })}>
              Back home
            </Button>
          }
        />
      ) : (
        <div className="px-4 py-6 sm:px-5">
          <h2 className="text-[22px] font-bold tracking-tight text-pretty">{data.title}</h2>
          <div className="mt-4 space-y-4">
            {data.body
              .split("\n\n")
              .map((block, i) => <LegalBlock key={i} text={block} />)}
          </div>
        </div>
      )}

      <div className="h-20" />
    </div>
  );
}

function LegalBlock({ text }: { text: string }) {
  const lines = text.split("\n");
  // Detect list: all but the first line start with "- "
  const firstLine = lines[0] ?? "";
  const rest = lines.slice(1);
  const isList = rest.length > 0 && rest.every((l) => l.trimStart().startsWith("- "));

  if (isList) {
    return (
      <div>
        <p className="mb-2 text-[15px] font-semibold leading-snug text-pretty">{firstLine}</p>
        <ul className="ml-5 list-disc space-y-1.5 text-[15px] leading-relaxed text-muted-foreground marker:text-muted-foreground/70 text-pretty">
          {rest.map((l, i) => (
            <li key={i} className="pl-1 text-pretty">{l.trimStart().slice(2)}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lines.map((l, i) => {
        // Heading-like lines: short lines with no terminal punctuation that look like "1. Foo" or "Section"
        const trimmed = l.trim();
        const isNumberedHeading = /^\d+\.\s+\S/.test(trimmed) && trimmed.length < 80 && !/[.:,]$/.test(trimmed);
        if (isNumberedHeading) {
          return (
            <h3 key={i} className="text-[16px] font-semibold leading-snug text-pretty">{trimmed}</h3>
          );
        }
        return (
          <p key={i} className="text-[15px] leading-[1.65] text-muted-foreground text-pretty">{l}</p>
        );
      })}
    </div>
  );
}
