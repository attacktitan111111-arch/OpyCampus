import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readFile, stat } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "upload");

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  // id may be "cuid.ext" or just "cuid"; attachment.filename holds the real stored name
  const attachment = await db.attachment.findUnique({ where: { id } }).catch(() => null);
  const filename = attachment?.filename ?? id;

  const filePath = path.join(UPLOAD_DIR, filename);
  // Prevent path traversal
  if (!filePath.startsWith(UPLOAD_DIR)) {
    return new NextResponse("Not found", { status: 404 });
  }

  let stats;
  try {
    stats = await stat(filePath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const mimeType = attachment?.mimeType ?? "application/octet-stream";
  const range = _req.headers.get("range");

  // Range support for video seeking
  if (range && mimeType.startsWith("video/")) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? parseInt(m[2], 10) : stats.size - 1;
      const clampedEnd = Math.min(end, stats.size - 1);
      const chunk = await readFile(filePath).then((b) => b.subarray(start, clampedEnd + 1));
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": String(chunk.byteLength),
          "Content-Range": `bytes ${start}-${clampedEnd}/${stats.size}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  const data = await readFile(filePath);
  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(stats.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
