import path from "path";
import os from "os";

let warnedMissingUploadDir = false;

export function getUploadDir(): string {
  const fromEnv = process.env.UPLOAD_DIR;
  if (fromEnv && fromEnv.trim().length > 0) {
    return path.resolve(fromEnv);
  }
  const fallback = path.join(os.tmpdir(), "mr-uploads");
  if (!warnedMissingUploadDir) {
    warnedMissingUploadDir = true;
    console.warn(
      `[uploads] UPLOAD_DIR is not set; falling back to ${fallback}. ` +
        `Set UPLOAD_DIR in .env for persistent storage.`,
    );
  }
  return path.resolve(fallback);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";
}

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "application/epub+zip": "epub",
  "application/x-mobipocket-ebook": "mobi",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export function extFromMime(mime: string, originalName?: string): string {
  const fromMap = EXT_BY_MIME[mime];
  if (fromMap) return fromMap;
  if (originalName) {
    const ext = path.extname(originalName).replace(/^\./, "").toLowerCase();
    if (ext) return ext;
  }
  return "bin";
}

// Identifies the real file format from the first bytes. Returns the canonical
// MIME, or null on no match. Defends against attackers spoofing Content-Type.
export function detectImageMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;

  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }

  if (
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) &&
    buf[5] === 0x61
  ) {
    return "image/gif";
  }

  return null;
}

export function detectBookMime(buf: Buffer, claimedMime: string): string | null {
  if (buf.length < 4) return null;

  // PDF: %PDF
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    return "application/pdf";
  }

  // EPUB and DOCX are both ZIP containers: PK\x03\x04
  const isZip =
    buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
  if (isZip) {
    if (claimedMime === "application/epub+zip") return "application/epub+zip";
    if (
      claimedMime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    return claimedMime || null;
  }

  // MOBI: "BOOKMOBI" at offset 60, or PalmDoc "TPZ" / "BOOK"
  if (buf.length >= 68) {
    const sig = buf.slice(60, 68).toString("ascii");
    if (sig === "BOOKMOBI" || sig === "TEXtREAd") {
      return "application/x-mobipocket-ebook";
    }
  }

  return null;
}

// path.resolve + assert the result is contained within base. Returns null if not.
export function safeResolveInside(base: string, ...segments: string[]): string | null {
  const resolvedBase = path.resolve(base);
  const target = path.resolve(resolvedBase, ...segments);
  if (target !== resolvedBase && !target.startsWith(resolvedBase + path.sep)) {
    return null;
  }
  return target;
}

export function relPathFromAbsolute(base: string, absolute: string): string {
  const rel = path.relative(path.resolve(base), absolute);
  return rel.split(path.sep).join("/");
}
