import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { randomBytes } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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
  if (!me) {
    return NextResponse.json({ error: "Please sign in to upload files" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const meta = ALLOWED[file.type];
  if (!meta) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}. Use JPG, PNG, WEBP, GIF, MP4, WEBM or MOV.` },
      { status: 415 }
    );
  }

  const max = meta.kind === "video" ? MAX_VIDEO : MAX_IMAGE;
  if (file.size > max) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${meta.kind === "video" ? "60 MB" : "12 MB"}.` },
      { status: 413 }
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  const id = randomBytes(8).toString("hex");
  const filename = `${id}.${meta.ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buf);

  const attachment = await db.attachment.create({
    data: {
      filename,
      originalName: file.name || filename,
      mimeType: file.type,
      size: file.size,
      uploaderId: me.id,
    },
  });

  return NextResponse.json({
    id: attachment.id,
    url: `/api/files/${attachment.id}`,
    type: meta.kind,
    mimeType: file.type,
    size: file.size,
  });
}
