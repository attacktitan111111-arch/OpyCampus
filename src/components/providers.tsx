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
            refetchOnMount: false, // don't refetch on mount — use cached data when available
            staleTime: 30_000, // 30 seconds — fresher cache than before for snappier UI
            gcTime: 5 * 60 * 1000, // 5 min garbage collection
            retry: 0, // fail fast — don't retry failed requests
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
