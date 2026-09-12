"use client";

import { formatDistanceToNow } from "date-fns";

export function RelativeTime({ date, className }: { date: string | Date; className?: string }) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);

  let label: string;
  if (mins < 1) label = "now";
  else if (mins < 60) label = `${mins}m`;
  else if (mins < 60 * 24) label = `${Math.floor(mins / 60)}h`;
  else if (mins < 60 * 24 * 7) label = `${Math.floor(mins / (60 * 24))}d`;
  else label = formatDistanceToNow(d, { addSuffix: false });

  return <time className={className}>{label}</time>;
}
