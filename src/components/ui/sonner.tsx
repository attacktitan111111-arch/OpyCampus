"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"
import { Check, Info, AlertTriangle, XCircle, Loader2 } from "lucide-react"
import type { ReactNode } from "react"

/**
 * Premium toast styling — premium shadow + border + animated icon.
 *
 * We hook into sonner's `toastOptions.classNames` to add our own premium
 * shell styling, and `components.icon` to render proper lucide icons
 * (checkmark for success, etc.) instead of the default dots.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast-premium !rounded-2xl !border !border-border/80 !bg-popover !text-popover-foreground !shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] !backdrop-blur-md animate-toast-in",
          title: "!text-[14px] !font-semibold !tracking-tight",
          description: "!text-[13px] !text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground !rounded-full !h-8 !px-3 !text-[12px] !font-semibold",
          cancelButton: "!bg-secondary !text-secondary-foreground !rounded-full !h-8 !px-3 !text-[12px] !font-medium",
          closeButton: "!text-muted-foreground hover:!text-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      components={{
        icon: (p) => <ToastIcon type={p.type as ToastIconType} />,
      }}
      {...props}
    />
  )
}

type ToastIconType = "success" | "error" | "loading" | "info" | "warning" | "default"

function ToastIcon({ type }: { type?: ToastIconType }) {
  if (!type || type === "default") return null
  const map: Record<Exclude<ToastIconType, "default">, ReactNode> = {
    success: <Check className="h-4 w-4 text-emerald-500" />,
    error: <XCircle className="h-4 w-4 text-rose-500" />,
    loading: <Loader2 className="h-4 w-4 animate-spin text-foreground" />,
    info: <Info className="h-4 w-4 text-sky-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary/60">
      {map[type]}
    </span>
  )
}

export { Toaster }
