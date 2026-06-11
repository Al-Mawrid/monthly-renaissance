// Image upload wiring for the Tiptap editor. Uploads go to POST /api/upload-image
// (auth-gated, magic-byte validated) which returns a persistent `/files/...` URL.
// Provides a one-shot upload helper plus paste/drop handlers for editorProps.

import type { EditorView } from "@tiptap/pm/view";

export type ImageEntityType = "article" | "query";

export async function uploadImage(
  file: File,
  entityType?: ImageEntityType,
  entityId?: number,
): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  if (entityType) fd.append("entityType", entityType);
  if (entityId != null) fd.append("entityId", String(entityId));

  const res = await fetch("/api/upload-image", { method: "POST", body: fd });
  if (!res.ok) {
    let message = "Image upload failed.";
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body; keep the default message
    }
    throw new Error(message);
  }

  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("Upload succeeded but no URL was returned.");
  return data.url;
}

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

// Opens a transient file dialog and resolves with the chosen image (or null if
// cancelled). Self-contained so the editor needs no hidden <input> ref.
export function pickImageFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = IMAGE_ACCEPT;
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

function insertImageAt(view: EditorView, url: string, pos?: number): void {
  const { state } = view;
  const node = state.schema.nodes.image?.create({ src: url });
  if (!node) return;
  const at = Math.min(pos ?? state.selection.from, state.doc.content.size);
  view.dispatch(state.tr.insert(at, node).scrollIntoView());
}

export function createImageHandlers(opts: {
  getEntityType: () => ImageEntityType | undefined;
  getEntityId: () => number | undefined;
  onError?: (message: string) => void;
}) {
  async function handleFiles(view: EditorView, files: File[], pos?: number) {
    for (const file of files) {
      try {
        const url = await uploadImage(file, opts.getEntityType(), opts.getEntityId());
        insertImageAt(view, url, pos);
      } catch (err) {
        opts.onError?.(err instanceof Error ? err.message : "Image upload failed.");
      }
    }
  }

  return {
    handlePaste(view: EditorView, event: ClipboardEvent): boolean {
      const files = Array.from(event.clipboardData?.files ?? []).filter(isImageFile);
      if (files.length === 0) return false;
      event.preventDefault();
      void handleFiles(view, files);
      return true;
    },
    handleDrop(view: EditorView, event: DragEvent): boolean {
      const files = Array.from(event.dataTransfer?.files ?? []).filter(isImageFile);
      if (files.length === 0) return false;
      event.preventDefault();
      const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
      void handleFiles(view, files, coords?.pos);
      return true;
    },
  };
}
