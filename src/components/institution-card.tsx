"use client";

import { Building2, Lock, Users, MapPin, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerifiedBadge } from "./user-avatar";
import { Button } from "@/components/ui/button";
import { useJoinInstitution } from "@/lib/hooks";
import { toast } from "sonner";

const typeLabel: Record<string, string> = {
  school: "School",
  college: "College",
  university: "University",
  institute: "Institute",
};

export function InstitutionCard({
  institution,
  onClick,
  showJoin = false,
  compact = false,
}: {
  institution: any;
  onClick?: () => void;
  showJoin?: boolean;
  compact?: boolean;
}) {
  const joinMut = useJoinInstitution();

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5",
        onClick && "cursor-pointer"
      )}
    >
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
        {institution.logoUrl ? (
           
          <img src={institution.logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Building2 className="h-6 w-6 text-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 truncate">
          {institution.isPrivate && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          <span className="truncate font-semibold text-[15px]">{institution.name}</span>
          {institution.verified && <VerifiedBadge className="h-4 w-4 text-primary shrink-0" />}
        </div>
        <div className="truncate text-[13px] text-muted-foreground">
          {typeLabel[institution.type] ?? institution.type} · {institution._counts?.members ?? 0} members
        </div>
        {!compact && institution.bio && (
          <div className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">{institution.bio}</div>
        )}
      </div>
      {showJoin && (
        <Button
          size="sm"
          variant={institution.isMember ? "secondary" : "default"}
          className="rounded-full px-4 h-9 text-[13px] font-semibold shrink-0"
          disabled={joinMut.isPending}
          onClick={(e) => {
            e.stopPropagation();
            joinMut.mutate({ handle: institution.handle });
          }}
        >
          {institution.isMember ? "Joined" : "Join"}
        </Button>
      )}
    </div>
  );
}
