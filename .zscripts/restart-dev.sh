#!/bin/bash
# Detached dev server launcher — escapes the bash tool's process tree.

cd /home/z/my-project

# Use the explicit Supabase DATABASE_URL so Prisma's postgresql provider works.
# The system-level DATABASE_URL points to a local SQLite file which fails
# Prisma's URL protocol validation.
export DATABASE_URL="postgresql://postgres.fvxbigtrzdujxhmotewa:xK2K23%2Af%3F%23TUQ%25j@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
export NEXT_PUBLIC_SUPABASE_URL="https://fvxbigtrzdujxhmotewa.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGJpZ3RyemR1anhobW90ZXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzY4NjEsImV4cCI6MjEwNTAxMjg2MX0.UtedyrFXY7LMb-LP-HUbjQD4GiZha4oa8JC9-CsPBgQ"

# Start dev server fully detached: new session, ignore SIGHUP, no controlling
# terminal, stdin from /dev/null, stdout+stderr appended to dev.log.
setsid nohup bun run dev </dev/null >>/home/z/my-project/dev.log 2>&1 &

# Disown so the shell doesn't send SIGHUP on exit.
disown $! 2>/dev/null || true

# Save the PID for later inspection.
echo $! > /home/z/my-project/.zscripts/dev.pid

echo "Launched dev server (setsid+nohup) — PID family starting at $(cat /home/z/my-project/.zscripts/dev.pid)"
