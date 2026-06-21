"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold, Italic, Underline, Heading2, Heading3, Pilcrow,
  List, ListOrdered, Quote, Link2, Image as ImageIcon, Table as TableIcon,
  Eraser, Undo2, Redo2, Eye, Code2, Columns2, AlertTriangle,
  AlignLeft, AlignCenter, AlignRight,
  FileUp, Loader2,
} from "lucide-react";
import { cleanWordHtml } from "@/lib/word-clean";
import { formatHtml } from "@/lib/editor/format-html";
import { looksLegacy } from "@/lib/editor/legacy-detect";
import { contentExtensions } from "@/lib/editor/schema";
import { createImageHandlers, pickImageFile, uploadImage, type ImageEntityType } from "./editor/image-upload";
import { pickDocxFile, importDocx } from "./editor/docx-import";
import { createSlashCommands } from "./editor/slash-menu";

type Mode = "visual" | "html" | "split";

const CONVERT_WARNING =
  "Editing this article visually will normalize its legacy markup " +
  "(old Word/HTML formatting may change). Continue?";

export function HtmlEditor({
  value,
  onChange,
  rows = 15,
  id,
  placeholder,
  defaultMode = "visual",
  entityType,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  id?: string;
  placeholder?: string;
  defaultMode?: Mode;
  entityType?: ImageEntityType;
}) {
  const minHeight = `${Math.max(rows * 22, 240)}px`;

  // Legacy content opens in source mode so its markup is never silently
  // normalized; clean/new content opens in the visual editor.
  const [mode, setMode] = useState<Mode>(() =>
    looksLegacy(value) ? "html" : defaultMode,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // `onChange` is a useState setter (stable) and `entityType` is a constant prop,
  // so the once-created editor can capture them directly — no "latest ref" needed.

  // Re-render the toolbar on every transaction so active states stay accurate.
  const [, forceTick] = useReducer((x) => x + 1, 0);

  const imageHandlers = useMemo(
    () =>
      createImageHandlers({
        getEntityType: () => entityType,
        getEntityId: () => undefined,
        onError: setUploadError,
      }),
    [entityType],
  );

  // Opens a file dialog, uploads, and inserts into the given editor. Takes the
  // editor as an argument so the slash command can pass the live instance
  // (the component's `editor` is null when the extension is first created).
  const handleInsertImage = useCallback(
    async (ed: Editor) => {
      const file = await pickImageFile();
      if (!file) return;
      setUploadError(null);
      try {
        const url = await uploadImage(file, entityType, undefined);
        ed.chain().focus().setImage({ src: url }).run();
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Image upload failed.");
      }
    },
    [entityType],
  );

  const slashCommands = useMemo(
    () => createSlashCommands({ onImage: handleInsertImage }),
    [handleInsertImage],
  );

  // `contentExtensions` is the shared schema (src/lib/editor/schema.ts) the
  // round-trip audit also builds from. Only UI-only extensions are appended here:
  // Placeholder (decoration, no serialization) and the slash-command menu.
  const extensions = useMemo(
    () => [
      ...contentExtensions,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      slashCommands,
    ],
    [slashCommands, placeholder],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: value,
    editorProps: {
      attributes: {
        class: "mr-htmleditor-visual article-content",
        style: `min-height:${minHeight}`,
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
      transformPastedHTML: (html) => cleanWordHtml(html),
      handlePaste: imageHandlers.handlePaste,
      handleDrop: imageHandlers.handleDrop,
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep the toolbar in sync with selection/content.
  useEffect(() => {
    if (!editor) return;
    const update = () => forceTick();
    editor.on("transaction", update);
    return () => {
      editor.off("transaction", update);
    };
  }, [editor]);

  // Push external value changes (HTML tab edits, programmatic resets) into the
  // editor, but only when they differ from what the editor already holds — this
  // guard prevents cursor jumps while typing in the visual editor.
  useEffect(() => {
    if (!editor) return;
    if (value === editor.getHTML()) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [value, editor]);

  function changeMode(next: Mode) {
    if (next === "visual" && mode !== "visual" && looksLegacy(value)) {
      if (!window.confirm(CONVERT_WARNING)) return;
    }
    setMode(next);
  }

  function run(fn: () => void) {
    if (!editor) return;
    fn();
  }

  // Re-indent the raw HTML by block structure. Render-safe: only whitespace
  // between block tags changes, so it is offered even for legacy markup.
  function handleFormat() {
    const formatted = formatHtml(value);
    if (formatted !== value) onChange(formatted);
  }

  // Import a Word .docx: the server returns clean HTML with embedded images
  // already uploaded to /files/... URLs. Inserts at the cursor (non-destructive;
  // it never wipes existing content), so on an empty body it simply fills it.
  async function handleImportDocx() {
    if (!editor || importing) return;
    const file = await pickDocxFile();
    if (!file) return;
    setUploadError(null);
    setImportStatus(null);
    setImporting(true);
    try {
      const { html, images, warnings } = await importDocx(file, entityType);
      if (!html.trim()) {
        setUploadError("No readable content was found in that document.");
        return;
      }
      // insertContent fires onUpdate, which already pushes the new HTML to onChange.
      editor.chain().focus().insertContent(html).run();
      const summary = [`Imported "${file.name}"`];
      if (images > 0) summary.push(`${images} image${images === 1 ? "" : "s"}`);
      setImportStatus(
        warnings.length > 0
          ? `${summary.join(" · ")} — ${warnings.join("; ")}`
          : summary.join(" · "),
      );
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Word import failed.");
    } finally {
      setImporting(false);
    }
  }

  function insertLink() {
    if (!editor) return;
    const prev = (editor.getAttributes("link").href as string | undefined) ?? "";
    const url = window.prompt("Link URL", prev);
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    editor?.isActive(name, attrs) ?? false;

  const showToolbar = mode === "visual";
  const showHtml = mode === "html" || mode === "split";
  const showVisual = mode === "visual";
  const showPreview = mode === "split";

  return (
    <div className="mr-htmleditor" id={id}>
      <div className="mr-htmleditor-toolbar">
        <div className="mr-htmleditor-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === "visual"}
            className={`mr-htmleditor-tab ${mode === "visual" ? "is-active" : ""}`}
            onClick={() => changeMode("visual")}>
            <Eye className="h-3.5 w-3.5" />
            Visual
          </button>
          <button type="button" role="tab" aria-selected={mode === "html"}
            className={`mr-htmleditor-tab ${mode === "html" ? "is-active" : ""}`}
            onClick={() => changeMode("html")}>
            <Code2 className="h-3.5 w-3.5" />
            HTML
          </button>
          <button type="button" role="tab" aria-selected={mode === "split"}
            className={`mr-htmleditor-tab ${mode === "split" ? "is-active" : ""}`}
            onClick={() => changeMode("split")}>
            <Columns2 className="h-3.5 w-3.5" />
            Split
          </button>
        </div>

        {showToolbar && editor && (
          <div className="mr-htmleditor-tools" aria-label="Formatting">
            <ToolbarBtn label="Import a Word (.docx) document at the cursor" onClick={handleImportDocx} disabled={importing}>
              {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
              <span className="mr-htmleditor-btn-label">{importing ? "Importing…" : "Word"}</span>
            </ToolbarBtn>

            <span className="mr-htmleditor-sep" />

            <ToolbarBtn label="Bold" active={isActive("bold")} onClick={() => run(() => editor.chain().focus().toggleBold().run())}><Bold className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Italic" active={isActive("italic")} onClick={() => run(() => editor.chain().focus().toggleItalic().run())}><Italic className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Underline" active={isActive("underline")} onClick={() => run(() => editor.chain().focus().toggleUnderline().run())}><Underline className="h-3.5 w-3.5" /></ToolbarBtn>

            <span className="mr-htmleditor-sep" />

            <ToolbarBtn label="Heading 2" active={isActive("heading", { level: 2 })} onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}><Heading2 className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Heading 3" active={isActive("heading", { level: 3 })} onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}><Heading3 className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Paragraph" active={isActive("paragraph")} onClick={() => run(() => editor.chain().focus().setParagraph().run())}><Pilcrow className="h-3.5 w-3.5" /></ToolbarBtn>

            <span className="mr-htmleditor-sep" />

            <ToolbarBtn label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => run(() => setAlign(editor, "left"))}><AlignLeft className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => run(() => setAlign(editor, "center"))}><AlignCenter className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => run(() => setAlign(editor, "right"))}><AlignRight className="h-3.5 w-3.5" /></ToolbarBtn>

            <span className="mr-htmleditor-sep" />

            <ToolbarBtn label="Bulleted list" active={isActive("bulletList")} onClick={() => run(() => editor.chain().focus().toggleBulletList().run())}><List className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Numbered list" active={isActive("orderedList")} onClick={() => run(() => editor.chain().focus().toggleOrderedList().run())}><ListOrdered className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Blockquote" active={isActive("blockquote")} onClick={() => run(() => editor.chain().focus().toggleBlockquote().run())}><Quote className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Link" active={isActive("link")} onClick={insertLink}><Link2 className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Insert image" onClick={() => handleInsertImage(editor)}><ImageIcon className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Insert table" onClick={() => run(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}><TableIcon className="h-3.5 w-3.5" /></ToolbarBtn>

            <span className="mr-htmleditor-sep" />

            <ToolbarBtn label="Arabic inline text" active={isActive("arabicInline")} onClick={() => run(() => editor.chain().focus().toggleMark("arabicInline", { dir: "rtl", lang: "ar" }).run())}>
              <span className="font-arabic text-[13px] leading-none">ع</span>
            </ToolbarBtn>
            <ToolbarBtn label="English quote" active={isActive("englishQuote")} onClick={() => run(() => editor.chain().focus().toggleMark("englishQuote").run())}>
              <span className="font-serif italic text-[12px] leading-none">EQ</span>
            </ToolbarBtn>

            <span className="mr-htmleditor-sep" />

            <ToolbarBtn label="Clear formatting" onClick={() => run(() => editor.chain().focus().unsetAllMarks().run())}><Eraser className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Undo" onClick={() => run(() => editor.chain().focus().undo().run())}><Undo2 className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Redo" onClick={() => run(() => editor.chain().focus().redo().run())}><Redo2 className="h-3.5 w-3.5" /></ToolbarBtn>
          </div>
        )}

        {showHtml && (
          <div className="mr-htmleditor-tools" aria-label="Source actions">
            <ToolbarBtn label="Format HTML (re-indent by structure)" onClick={handleFormat}>
              <AlignLeft className="h-3.5 w-3.5" />
              <span className="mr-htmleditor-btn-label">Format</span>
            </ToolbarBtn>
          </div>
        )}
      </div>

      <div className={`mr-htmleditor-body ${mode === "split" ? "is-split" : ""}`}>
        {showHtml && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            className="mr-htmleditor-source"
            style={{ minHeight }}
            spellCheck={false}
          />
        )}
        {/* Always mounted so the editor view never detaches on tab switch;
            hidden (display:none) when another mode is active. */}
        <EditorContent
          editor={editor}
          className={`mr-htmleditor-visual-wrap ${showVisual ? "" : "is-hidden"}`}
        />
        {showPreview && (
          <div
            className="mr-htmleditor-preview article-content"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: value }}
          />
        )}
      </div>

      {uploadError && (
        <div className="mr-htmleditor-error" role="alert">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {importStatus && (
        <div className="mr-htmleditor-info" role="status">
          <FileUp className="h-3.5 w-3.5 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}
    </div>
  );
}

// Toggle block alignment: clicking the already-active alignment clears it back
// to the default (paragraphs justify, headings left), so the user is never stuck
// without a "justify" button.
function setAlign(editor: Editor, alignment: "left" | "center" | "right") {
  if (editor.isActive({ textAlign: alignment })) {
    editor.chain().focus().unsetTextAlign().run();
  } else {
    editor.chain().focus().setTextAlign(alignment).run();
  }
}

function ToolbarBtn({
  label,
  active,
  onClick,
  disabled,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active ?? undefined}
      disabled={disabled}
      // Prevent the editor from losing selection when the button is pressed.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`mr-htmleditor-btn ${active ? "is-active" : ""}`}
    >
      {children}
    </button>
  );
}
