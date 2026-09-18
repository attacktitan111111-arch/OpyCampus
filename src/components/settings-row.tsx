"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type IconType = React.ComponentType<{ className?: string }>;

/**
 * Settings row primitives — a small family of consistent row components used
 * to build the settings page (and any future preferences UI).
 *
 * Visual contract (Facebook-like):
 *   [icon 20px, muted] [label + description, flex-1] [right-slot]
 *
 * Every row:
 *   - has `px-4 py-3 lg:px-5` padding
 *   - hover state on interactive rows (`hover:bg-muted/40`)
 *   - 5px-wide leading icon slot (or hidden if omitted)
 *   - shrink-0 right slot so long labels don't push it off-screen
 */

interface RowShellProps {
  icon?: IconType;
  iconClassName?: string;
  label: string;
  description?: string;
  right?: React.ReactNode;
  className?: string;
  as?: "div" | "button" | "label";
  onClick?: () => void;
}

function RowShell({
  icon: Icon,
  iconClassName,
  label,
  description,
  right,
  className,
  as = "div",
  onClick,
}: RowShellProps) {
  const Tag = as as any;
  const interactive = as !== "div" || onClick;
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 lg:px-5",
        interactive && "text-left transition-colors hover:bg-muted/40 tap-highlight-none",
        className
      )}
    >
      {Icon ? (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted/60 text-muted-foreground">
          <Icon className={cn("h-[18px] w-[18px]", iconClassName)} />
        </span>
      ) : (
        <span className="h-8 w-8 shrink-0" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium leading-tight text-foreground">
          {label}
        </div>
        {description && (
          <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      {right}
    </Tag>
  );
}

/**
 * Section header — small uppercase muted label with optional description.
 */
export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="px-4 pt-5 pb-1.5 lg:px-5">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-[13px] leading-snug text-muted-foreground/80">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Toggle row — icon + label + description + Switch.
 * The whole row is a `<label>` so tapping anywhere on it toggles the switch.
 */
export function ToggleRow({
  icon,
  iconClassName,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon?: IconType;
  iconClassName?: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <RowShell
      as="label"
      icon={icon}
      iconClassName={iconClassName}
      label={label}
      description={description}
      right={
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          aria-label={label}
        />
      }
    />
  );
}

/**
 * Navigation row — icon + label + description + optional value + chevron.
 * Clicking it calls `onClick`.
 */
export function NavRow({
  icon,
  iconClassName,
  label,
  description,
  onClick,
  value,
}: {
  icon?: IconType;
  iconClassName?: string;
  label: string;
  description?: string;
  onClick: () => void;
  value?: React.ReactNode;
}) {
  return (
    <RowShell
      as="button"
      icon={icon}
      iconClassName={iconClassName}
      label={label}
      description={description}
      onClick={onClick}
      right={
        <span className="flex items-center gap-2">
          {value && (
            <span className="max-w-[140px] truncate text-[13px] text-muted-foreground">
              {value}
            </span>
          )}
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </span>
      }
    />
  );
}

/**
 * Read-only display row — icon + label + value. No interaction.
 */
export function DisplayRow({
  icon,
  iconClassName,
  label,
  description,
  value,
}: {
  icon?: IconType;
  iconClassName?: string;
  label: string;
  description?: string;
  value?: React.ReactNode;
}) {
  return (
    <RowShell
      icon={icon}
      iconClassName={iconClassName}
      label={label}
      description={description}
      right={
        value ? (
          <span className="max-w-[60%] truncate text-[13px] text-muted-foreground">
            {value}
          </span>
        ) : null
      }
    />
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Select row — icon + label + description + a shadcn Select on the right.
 */
export function SelectRow({
  icon,
  iconClassName,
  label,
  description,
  value,
  onValueChange,
  options,
  disabled,
}: {
  icon?: IconType;
  iconClassName?: string;
  label: string;
  description?: string;
  value: string;
  onValueChange: (v: string) => void;
  options: SelectOption[];
  disabled?: boolean;
}) {
  return (
    <RowShell
      icon={icon}
      iconClassName={iconClassName}
      label={label}
      description={description}
      right={
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger
            size="sm"
            className="h-8 w-auto min-w-[120px] gap-1 rounded-full border-border bg-muted/40 px-3 text-[13px] font-medium"
            aria-label={label}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    />
  );
}
