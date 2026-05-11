"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline, Heading2, Heading3, Pilcrow,
  List, ListOrdered, Quote, Link2, Eraser, Undo2, Redo2,
  Eye, Code2, Columns2,
} from "lucide-react";

type Mode = "visual" | "html" | "split";

export function HtmlEditor({
  value,
  onChange,
  rows = 15,
  id,
  placeholder,
  defaultMode = "visual",
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  id?: string;
  placeholder?: string;
  defaultMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const visualRef = useRef<HTMLDivElement>(null);
  const minHeight = `${Math.max(rows * 22, 240)}px`;

  // Sync external value into the contenteditable when (re)entering visual mode
  // or when the value changes from outside (e.g. typing in HTML mode then switching).
  useEffect(() => {
    if (mode === "visual" && visualRef.current && visualRef.current.innerHTML !== value) {
      visualRef.current.innerHTML = value;
    }
  }, [mode, value]);

  function exec(command: string, arg?: string) {
    visualRef.current?.focus();
    document.execCommand(command, false, arg);
    if (visualRef.current) onChange(visualRef.current.innerHTML);
  }

  function wrapSelection(tag: string, className?: string) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    const wrapper = document.createElement(tag);
    if (className) wrapper.className = className;
    try {
      wrapper.appendChild(range.extractContents());
      range.insertNode(wrapper);
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(wrapper);
      sel.addRange(newRange);
    } catch {
      // selection spanned non-collapsible boundaries; ignore
    }
    if (visualRef.current) onChange(visualRef.current.innerHTML);
  }

  function insertLink() {
    const url = window.prompt("Link URL");
    if (!url) return;
    exec("createLink", url);
  }

  const showToolbar = mode === "visual";
  const showHtml = mode === "html" || mode === "split";
  const showVisual = mode === "visual";
  const showPreview = mode === "split";

  return (
    <div className="mr-htmleditor" id={id}>
      <div className="mr-htmleditor-toolbar">
        <div className="mr-htmleditor-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "visual"}
            className={`mr-htmleditor-tab ${mode === "visual" ? "is-active" : ""}`}
            onClick={() => setMode("visual")}
          >
            <Eye className="h-3.5 w-3.5" />
            Visual
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "html"}
            className={`mr-htmleditor-tab ${mode === "html" ? "is-active" : ""}`}
            onClick={() => setMode("html")}
          >
            <Code2 className="h-3.5 w-3.5" />
            HTML
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "split"}
            className={`mr-htmleditor-tab ${mode === "split" ? "is-active" : ""}`}
            onClick={() => setMode("split")}
          >
            <Columns2 className="h-3.5 w-3.5" />
            Split
          </button>
        </div>

        {showToolbar && (
          <div className="mr-htmleditor-tools" aria-label="Formatting">
            <ToolbarBtn label="Bold" onClick={() => exec("bold")}><Bold className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Italic" onClick={() => exec("italic")}><Italic className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Underline" onClick={() => exec("underline")}><Underline className="h-3.5 w-3.5" /></ToolbarBtn>

            <span className="mr-htmleditor-sep" />

            <ToolbarBtn label="Heading 2" onClick={() => exec("formatBlock", "H2")}><Heading2 className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Heading 3" onClick={() => exec("formatBlock", "H3")}><Heading3 className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Paragraph" onClick={() => exec("formatBlock", "P")}><Pilcrow className="h-3.5 w-3.5" /></ToolbarBtn>

            <span className="mr-htmleditor-sep" />

            <ToolbarBtn label="Bulleted list" onClick={() => exec("insertUnorderedList")}><List className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Numbered list" onClick={() => exec("insertOrderedList")}><ListOrdered className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Blockquote" onClick={() => exec("formatBlock", "BLOCKQUOTE")}><Quote className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Link" onClick={insertLink}><Link2 className="h-3.5 w-3.5" /></ToolbarBtn>

            <span className="mr-htmleditor-sep" />

            <ToolbarBtn
              label="Wrap selection in Arabic span"
              onClick={() => wrapSelection("span", "ArabicInLineText")}
            >
              <span className="font-arabic text-[13px] leading-none">ع</span>
            </ToolbarBtn>
            <ToolbarBtn
              label="Wrap selection in English Quote"
              onClick={() => wrapSelection("span", "EnglishQuote")}
            >
              <span className="font-serif italic text-[12px] leading-none">EQ</span>
            </ToolbarBtn>

            <span className="mr-htmleditor-sep" />

            <ToolbarBtn label="Clear formatting" onClick={() => exec("removeFormat")}><Eraser className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Undo" onClick={() => exec("undo")}><Undo2 className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Redo" onClick={() => exec("redo")}><Redo2 className="h-3.5 w-3.5" /></ToolbarBtn>
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
        {showVisual && (
          <div
            ref={visualRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
            className="mr-htmleditor-visual article-content"
            style={{ minHeight }}
            data-placeholder={placeholder}
          />
        )}
        {showPreview && (
          <div
            className="mr-htmleditor-preview article-content"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: value }}
          />
        )}
      </div>
    </div>
  );
}

function ToolbarBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      // Prevent the contenteditable from losing selection when the button is pressed.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="mr-htmleditor-btn"
    >
      {children}
    </button>
  );
}
