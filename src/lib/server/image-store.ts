// Server-side image persistence shared by upload routes. Saves a raw image
// buffer exactly the way POST /api/upload-image does — magic-byte validation,
// a date-bucketed filename under UPLOAD_DIR/articles/<yyyy>/<mm>, and an Upload
// row — so images extracted from a Word import become first-class uploads
// indistinguishable from manually inserted ones (and survive deploys).
//
// Node-only: imports fs/prisma. Never import from a client component.

import { mkdir, writeFile } from "fs/promises";
import { prisma } from "@/lib/db";
import {
  detectImageMime,
  extFromMime,
  getUploadDir,
  relPathFromAbsolute,
  safeResolveInside,
  slugify,
} from "@/lib/uploads";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type SavedImage = {
  url: string;
  uploadId: number;
  mimeType: string;
};

/**
 * Validate, write, and record an image buffer. Resolves with the public
 * `/files/...` URL. Throws on empty/oversized buffers or formats whose magic
 * bytes are not a supported web image (PNG/JPEG/WEBP/GIF) so the caller can
 * record a warning and skip the image rather than emit a broken <img>.
 *
 * `index` disambiguates multiple images saved within the same millisecond.
 */
export async function saveImageBuffer(opts: {
  buf: Buffer;
  uploadedById: string;
  originalName?: string;
  entityType?: string | null;
  entityId?: number | null;
  index?: number;
}): Promise<SavedImage> {
  const { buf, uploadedById, entityType = null, entityId = null, index } = opts;

  if (buf.byteLength === 0) throw new Error("Empty image");
  if (buf.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image too large (max 10 MB)");
  }

  const detected = detectImageMime(buf);
  if (!detected) {
    throw new Error("Unsupported image format (allowed: PNG, JPEG, WEBP, GIF)");
  }

  const uploadDir = getUploadDir();
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");

  const originalName = opts.originalName?.trim() || `image.${extFromMime(detected)}`;
  const baseName = slugify(originalName.replace(/\.[^.]+$/, ""));
  const ext = extFromMime(detected, originalName);
  const suffix = index != null ? `-${index}` : "";
  const fileName = `${baseName}-${Date.now()}${suffix}.${ext}`;

  const targetDir = safeResolveInside(uploadDir, "articles", yyyy, mm);
  if (!targetDir) throw new Error("Invalid upload path");
  const targetAbs = safeResolveInside(targetDir, fileName);
  if (!targetAbs) throw new Error("Invalid upload path");

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
      uploadedById,
      entityType,
      entityId,
    },
    select: { id: true },
  });

  return { url: `/files/${relPath}`, uploadId: row.id, mimeType: detected };
}
