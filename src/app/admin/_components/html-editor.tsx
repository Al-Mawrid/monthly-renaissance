"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold, Italic, Underline, Heading2, Heading3, Pilcrow,
  List, ListOrdered, Quote, Link2, Image as ImageIcon, Table as TableIcon,
  Eraser, Undo2, Redo2, Eye, Code2, Columns2, AlertTriangle,
} from "lucide-react";
import { cleanWordHtml } from "@/lib/word-clean";
import { looksLegacy } from "@/lib/editor/legacy-detect";
import { ArabicInLineText, EnglishQuote, FootNoteLink, FootNote } from "./editor/extensions";
import { createImageHandlers, pickImageFile, uploadImage, type ImageEntityType } from "./editor/image-upload";
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

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer nofollow" },
        },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      ArabicInLineText,
      EnglishQuote,
      FootNoteLink,
      FootNote,
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
            <ToolbarBtn label="Bold" active={isActive("bold")} onClick={() => run(() => editor.chain().focus().toggleBold().run())}><Bold className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Italic" active={isActive("italic")} onClick={() => run(() => editor.chain().focus().toggleItalic().run())}><Italic className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Underline" active={isActive("underline")} onClick={() => run(() => editor.chain().focus().toggleUnderline().run())}><Underline className="h-3.5 w-3.5" /></ToolbarBtn>

            <span className="mr-htmleditor-sep" />

            <ToolbarBtn label="Heading 2" active={isActive("heading", { level: 2 })} onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}><Heading2 className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Heading 3" active={isActive("heading", { level: 3 })} onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}><Heading3 className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Paragraph" active={isActive("paragraph")} onClick={() => run(() => editor.chain().focus().setParagraph().run())}><Pilcrow className="h-3.5 w-3.5" /></ToolbarBtn>

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
          className={`mr-htmleditor-visual-wrap ${showVisual ? "" : "hidden"}`}
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
    </div>
  );
}

function ToolbarBtn({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active ?? undefined}
      // Prevent the editor from losing selection when the button is pressed.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`mr-htmleditor-btn ${active ? "is-active" : ""}`}
    >
      {children}
    </button>
  );
}
