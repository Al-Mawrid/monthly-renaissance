import { NextRequest, NextResponse } from "next/server";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { auth } from "@/lib/auth";
import { canEditContent } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import {
  detectBookMime,
  extFromMime,
  getUploadDir,
  relPathFromAbsolute,
  safeResolveInside,
  slugify,
} from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "application/epub+zip",
  "application/x-mobipocket-ebook",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const EXT_FALLBACK_MIME: Record<string, string> = {
  pdf: "application/pdf",
  epub: "application/epub+zip",
  mobi: "application/x-mobipocket-ebook",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.user.role || !canEditContent(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 50MB)" },
      { status: 413 },
    );
  }

  const originalName = file.name || "book";
  const extFromName = originalName.split(".").pop()?.toLowerCase() ?? "";
  let claimedMime = (file.type || "").toLowerCase();
  if (!ALLOWED_MIMES.has(claimedMime) && EXT_FALLBACK_MIME[extFromName]) {
    claimedMime = EXT_FALLBACK_MIME[extFromName];
  }

  if (!ALLOWED_MIMES.has(claimedMime)) {
    return NextResponse.json(
      { error: "Only PDF, EPUB, MOBI, and DOCX files are allowed" },
      { status: 415 },
    );
  }

  // Books may be large; don't buffer the whole file. Read only enough up front
  // to magic-byte-check, then stream the rest straight to disk.
  const reader = file.stream().getReader();
  let total = 0;

  const { value: first, done } = await reader.read();
  if (done || !first) {
    reader.releaseLock();
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  const firstChunk: Uint8Array = first;
  total += first.byteLength;
  const header = Buffer.from(
    first.buffer,
    first.byteOffset,
    Math.min(first.byteLength, 256),
  );

  const detected = detectBookMime(header, claimedMime);
  if (!detected) {
    reader.releaseLock();
    return NextResponse.json(
      { error: "File contents do not match declared type." },
      { status: 415 },
    );
  }

  const uploadDir = getUploadDir();
  const baseName = slugify(originalName.replace(/\.[^.]+$/, ""));
  const ext = extFromMime(detected, originalName);
  const fileName = `${baseName}-${Date.now()}.${ext}`;

  const targetDir = safeResolveInside(uploadDir, "books");
  if (!targetDir) {
    reader.releaseLock();
    return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
  }
  const targetAbs = safeResolveInside(targetDir, fileName);
  if (!targetAbs) {
    reader.releaseLock();
    return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
  }

  await mkdir(targetDir, { recursive: true });

  // Stream the remaining chunks straight to disk.
  async function* drain() {
    yield firstChunk;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > MAX_BYTES) {
          throw new Error("FILE_TOO_LARGE");
        }
        yield value;
      }
    }
  }

  try {
    await pipeline(Readable.from(drain()), createWriteStream(targetAbs));
  } catch (err) {
    if ((err as Error).message === "FILE_TOO_LARGE") {
      return NextResponse.json(
        { error: "File too large (max 50MB)" },
        { status: 413 },
      );
    }
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const relPath = relPathFromAbsolute(uploadDir, targetAbs);

  const entityIdRaw = formData.get("entityId");
  let entityId: number | null = null;
  if (typeof entityIdRaw === "string" && entityIdRaw.length > 0) {
    const parsed = Number.parseInt(entityIdRaw, 10);
    if (Number.isFinite(parsed)) entityId = parsed;
  }

  const row = await prisma.upload.create({
    data: {
      fileName,
      originalName: originalName.slice(0, 255),
      mimeType: detected,
      sizeBytes: total,
      relPath,
      uploadedById: session.user.id,
      entityType: "book",
      entityId,
    },
    select: { id: true },
  });

  return NextResponse.json({
    fileName,
    url: `/files/${relPath}`,
    originalName,
    size: total,
    uploadId: row.id,
  });
}
