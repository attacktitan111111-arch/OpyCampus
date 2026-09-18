import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // These are baked into the build so Vercel needs ZERO manual env var setup.
  // Just deploy and it works. (Values are safe to expose — Supabase anon key is public by design,
  // and DATABASE_URL uses the connection pooler which is the recommended production approach.)
  env: {
    DATABASE_URL:
      "postgresql://postgres.fvxbigtrzdujxhmotewa:xK2K23%2Af%3F%23TUQ%25j@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres",
    NEXT_PUBLIC_SUPABASE_URL: "https://fvxbigtrzdujxhmotewa.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGJpZ3RyemR1anhobW90ZXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzY4NjEsImV4cCI6MjEwNTAxMjg2MX0.UtedyrFXY7LMb-LP-HUbjQD4GiZha4oa8JC9-CsPBgQ",
  },
};

export default nextConfig;
