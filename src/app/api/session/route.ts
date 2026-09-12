import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { serializeUser } from "@/lib/serializers";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user: serializeUser(user) });
}
