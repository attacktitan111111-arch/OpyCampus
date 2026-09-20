import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { randomBytes } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { uploadToSupabase, hasSupabaseStorage } from "@/lib/supabase";

const UPLOAD_DIR = path.join(process.cwd(), "upload");

const ALLOWED: Record<string, { ext: string; kind: "image" | "video" }> = {
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/png": { ext: "png", kind: "image" },
  "image/webp": { ext: "webp", kind: "image" },
  "image/gif": { ext: "gif", kind: "image" },
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
  "video/quicktime": { ext: "mov", kind: "video" },
};

const MAX_IMAGE = 12 * 1024 * 1024;
const MAX_VIDEO = 60 * 1024 * 1024;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in to upload" }, { status: 401 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const meta = ALLOWED[file.type];
  if (!meta) return NextResponse.json({ error: "Unsupported file type. Use JPG, PNG, WEBP, GIF, MP4, WEBM or MOV." }, { status: 415 });

  const max = meta.kind === "video" ? MAX_VIDEO : MAX_IMAGE;
  if (file.size > max) return NextResponse.json({ error: `File too large. Max ${meta.kind === "video" ? "60 MB" : "12 MB"}.` }, { status: 413 });
  if (file.size === 0) return NextResponse.json({ error: "File is empty" }, { status: 400 });

  const id = randomBytes(8).toString("hex");
  const filename = `${id}.${meta.ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  let publicUrl: string | null = null;
  if (hasSupabaseStorage) { publicUrl = await uploadToSupabase(buf, filename, file.type); }
  if (!publicUrl) { await mkdir(UPLOAD_DIR, { recursive: true }); await writeFile(path.join(UPLOAD_DIR, filename), buf); }

  const attachment = await db.attachment.create({
    data: { filename, originalName: file.name || filename, mimeType: file.type, size: file.size, uploaderId: me.id },
  });

  const url = publicUrl ?? `/api/files/${attachment.id}`;
  return NextResponse.json({ id: attachment.id, url, type: meta.kind, mimeType: file.type, size: file.size });
}
