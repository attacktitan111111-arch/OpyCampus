"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 15_000,
            retry: 1,
          },
        },
      })
  );

  // Enable the smooth theme transition CSS *after* the first paint so the
  // initial mount doesn't try to animate colors from the default.
  useEffect(() => {
    const t = window.setTimeout(() => {
      document.documentElement.classList.add("theme-ready");
    }, 60);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={client}>
        <ErrorBoundary>{children}</ErrorBoundary>
        <Toaster richColors closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
