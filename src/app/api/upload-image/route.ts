import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { auth } from "@/lib/auth";
import { canEditContent } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import {
  detectImageMime,
  extFromMime,
  getUploadDir,
  relPathFromAbsolute,
  safeResolveInside,
  slugify,
} from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_ENTITY_TYPES = new Set(["article", "query"]);

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
      { error: "File too large (max 10 MB)" },
      { status: 413 },
    );
  }

  const claimedMime = (file.type || "").toLowerCase();
  if (!ALLOWED_MIMES.has(claimedMime)) {
    return NextResponse.json(
      { error: "Unsupported image type. Allowed: PNG, JPEG, WEBP, GIF." },
      { status: 415 },
    );
  }

  const arrayBuf = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuf);

  const detected = detectImageMime(buf);
  if (!detected || detected !== claimedMime) {
    return NextResponse.json(
      { error: "File contents do not match declared image type." },
      { status: 415 },
    );
  }

  const entityTypeRaw = formData.get("entityType");
  const entityIdRaw = formData.get("entityId");
  const entityType =
    typeof entityTypeRaw === "string" && ALLOWED_ENTITY_TYPES.has(entityTypeRaw)
      ? entityTypeRaw
      : null;
  let entityId: number | null = null;
  if (entityType && typeof entityIdRaw === "string" && entityIdRaw.length > 0) {
    const parsed = Number.parseInt(entityIdRaw, 10);
    if (Number.isFinite(parsed)) entityId = parsed;
  }

  const uploadDir = getUploadDir();
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");

  const originalName = file.name || `image.${extFromMime(detected)}`;
  const baseName = slugify(originalName.replace(/\.[^.]+$/, ""));
  const ext = extFromMime(detected, originalName);
  const fileName = `${baseName}-${Date.now()}.${ext}`;

  const targetDir = safeResolveInside(uploadDir, "articles", yyyy, mm);
  if (!targetDir) {
    return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
  }
  const targetAbs = safeResolveInside(targetDir, fileName);
  if (!targetAbs) {
    return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
  }

  await mkdir(targetDir, { recursive: true });
  await writeFile(targetAbs, buf);

  const relPath = relPathFromAbsolute(uploadDir, targetAbs);

  const row = await prisma.upload.create({
    data: {
      fileName,
      originalName: originalName.slice(0, 255),
      mimeType: detected,
      sizeBytes: buf.byteLength,
      relPath,
      uploadedById: session.user.id,
      entityType,
      entityId,
    },
    select: { id: true },
  });

  return NextResponse.json({
    url: `/files/${relPath}`,
    uploadId: row.id,
  });
}
