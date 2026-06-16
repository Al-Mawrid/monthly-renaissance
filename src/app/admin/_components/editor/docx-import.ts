// Client helpers for the "Import Word document" editor action. Opens a file
// dialog for a .docx and posts it to POST /api/import-docx, which returns clean
// HTML (with embedded images already uploaded to persistent /files/... URLs)
// ready to drop into the Tiptap editor.

import type { ImageEntityType } from "./image-upload";

export type DocxImportResult = {
  html: string;
  images: number;
  warnings: string[];
};

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOCX_ACCEPT = `.docx,${DOCX_MIME}`;

// Opens a transient file dialog and resolves with the chosen .docx (or null if
// cancelled). Mirrors pickImageFile in image-upload.ts.
export function pickDocxFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = DOCX_ACCEPT;
    input.style.display = "none";
    let settled = false;

    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(file);
    };

    input.addEventListener("change", () => finish(input.files?.[0] ?? null));
    // No reliable cross-browser "cancel" event; fall back to window refocus.
    window.addEventListener(
      "focus",
      () => window.setTimeout(() => finish(null), 350),
      { once: true },
    );

    document.body.appendChild(input);
    input.click();
  });
}

export async function importDocx(
  file: File,
  entityType?: ImageEntityType,
): Promise<DocxImportResult> {
  const fd = new FormData();
  fd.append("file", file);
  if (entityType) fd.append("entityType", entityType);

  const res = await fetch("/api/import-docx", { method: "POST", body: fd });
  if (!res.ok) {
    let message = "Word import failed.";
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body; keep the default message
    }
    throw new Error(message);
  }

  const data = (await res.json()) as Partial<DocxImportResult>;
  return {
    html: data.html ?? "",
    images: data.images ?? 0,
    warnings: data.warnings ?? [],
  };
}
