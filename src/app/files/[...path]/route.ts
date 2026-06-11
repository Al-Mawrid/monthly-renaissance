import { NextRequest } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { prisma } from "@/lib/db";
import { getUploadDir, safeResolveInside } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOOK_MIMES = new Set([
  "application/pdf",
  "application/epub+zip",
  "application/x-mobipocket-ebook",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function notFound() {
  return new Response("Not found", { status: 404 });
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  if (!segments || segments.length === 0) return notFound();

  for (const seg of segments) {
    if (!seg || seg === "." || seg === ".." || seg.includes("\0")) {
      return notFound();
    }
  }

  const uploadDir = getUploadDir();
  const absolute = safeResolveInside(uploadDir, ...segments);
  if (!absolute) return notFound();

  const relPath = segments.join("/");

  const row = await prisma.upload.findUnique({
    where: { relPath },
    select: { mimeType: true, fileName: true, originalName: true },
  });
  if (!row) return notFound();

  let fileStat;
  try {
    fileStat = await stat(absolute);
  } catch {
    return notFound();
  }
  if (!fileStat.isFile()) return notFound();

  const isImage = row.mimeType.startsWith("image/");
  const isBook = BOOK_MIMES.has(row.mimeType);
  const disposition = isBook
    ? `attachment; filename="${encodeFilename(row.originalName || row.fileName)}"`
    : isImage
      ? "inline"
      : `inline; filename="${encodeFilename(row.fileName)}"`;

  const nodeStream = createReadStream(absolute);
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": row.mimeType,
      "Content-Length": String(fileStat.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": disposition,
    },
  });
}

function encodeFilename(name: string): string {
  // Strip path separators and quotes from the displayed filename.
  return name.replace(/[\\/"\r\n]/g, "_");
}
