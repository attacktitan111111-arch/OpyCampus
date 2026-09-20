"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";


export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            staleTime: 120_000, // 2 minutes — cache aggressively for max speed
            gcTime: 10 * 60 * 1000, // 10 min garbage collection
            retry: 0,
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
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={client}>
        {children}
        <Toaster richColors closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
