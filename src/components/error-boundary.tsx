"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { NetworkError } from "@/lib/api";

/**
 * Returns true when the given error is a network/offline error (i.e. one thrown
 * by `api()` when the browser reports no connection or the fetch itself failed).
 */
export function isNetworkError(err: unknown): boolean {
  return (
    err instanceof NetworkError ||
    (err instanceof Error && (err as any).isNetworkError === true)
  );
}

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: ReactNode;
}

/**
 * App-level error boundary. Catches render-time errors thrown by descendants
 * (including the NetworkError thrown by `api()`). When the error is a network
 * error, it shows a friendly offline screen instead of triggering a reload.
 *
 * Importantly, it does NOT auto-reload the page — the user must tap "Retry"
 * or fix their connection and refresh manually. This prevents the reload
 * loop the app previously had when offline.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console for developers; do NOT trigger a reload here.
    if (isNetworkError(error)) {
      console.warn("[ErrorBoundary] Network error caught:", error.message);
    } else {
      console.error("[ErrorBoundary] Render error caught:", error, info);
    }
  }

  handleRetry = () => {
    // Clear the error and let components re-fetch via TanStack Query.
    this.setState({ hasError: false, error: null });
    // Defer a soft refresh so query caches re-validate without a hard reload.
    setTimeout(() => {
      window.dispatchEvent(new Event("online"));
    }, 50);
  };

  render() {
    const { hasError, error } = this.state;
    if (!hasError) return this.props.children;

    const offline = isNetworkError(error);

    if (offline) {
      return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center animate-fade-up">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground animate-float-slow">
            <WifiOff className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-[18px] font-semibold text-foreground">You&apos;re offline</h2>
            <p className="mt-1.5 text-[14px] text-muted-foreground text-balance">
              We couldn&apos;t reach OpyCampus. Check your internet connection and try again — your
              draft posts and saved items are still here.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground shadow-sm transition-transform active:scale-95 tap-highlight-none press-down"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      );
    }

    // Non-network error: show a generic friendly screen (also no auto-reload).
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center animate-fade-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive animate-float-slow">
          <RefreshCw className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-[18px] font-semibold text-foreground">Something went wrong</h2>
          <p className="mt-1.5 text-[14px] text-muted-foreground text-balance">
            An unexpected error occurred. Try again — if it keeps happening, refresh the page.
          </p>
        </div>
        <button
          onClick={this.handleRetry}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground shadow-sm transition-transform active:scale-95 tap-highlight-none press-down"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }
}
