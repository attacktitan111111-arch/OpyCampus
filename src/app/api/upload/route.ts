import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { randomBytes } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "upload");

const ALLOWED = {
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/png": { ext: "png", kind: "image" },
  "image/webp": { ext: "webp", kind: "image" },
  "image/gif": { ext: "gif", kind: "image" },
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
  "video/quicktime": { ext: "mov", kind: "video" },
} as const;

const MAX_IMAGE = 12 * 1024 * 1024; // 12 MB
const MAX_VIDEO = 60 * 1024 * 1024; // 60 MB

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in to upload" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const meta = ALLOWED[file.type as keyof typeof ALLOWED];
  if (!meta) {
    return NextResponse.json({ error: "Unsupported file type. Use JPG, PNG, WEBP, GIF, MP4, WEBM or MOV." }, { status: 415 });
  }

  const max = meta.kind === "video" ? MAX_VIDEO : MAX_IMAGE;
  if (file.size > max) {
    return NextResponse.json({ error: `File too large. Max ${meta.kind === "video" ? "60 MB" : "12 MB"}.` }, { status: 413 });
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
