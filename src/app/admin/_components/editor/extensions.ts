// Custom Tiptap extensions that preserve the legacy CSS contract from
// globals.css (.article-content). The class names and attributes here must match
// the selectors exactly: `FootNote`, `FootNoteLink`, `ArabicInLineText`,
// `EnglishQuote`, plus dir/lang on Arabic spans.

import { Mark, Node, mergeAttributes } from "@tiptap/core";

// Inline Arabic span: <span class="ArabicInLineText" dir="rtl" lang="ar">…</span>
// The CSS keys off the class; dir/lang are preserved so bidi rendering survives.
export const ArabicInLineText = Mark.create({
  name: "arabicInline",

  addAttributes() {
    return {
      dir: {
        default: "rtl",
        parseHTML: (el) => el.getAttribute("dir") || "rtl",
        renderHTML: (attrs) => (attrs.dir ? { dir: attrs.dir } : {}),
      },
      lang: {
        default: "ar",
        parseHTML: (el) => el.getAttribute("lang") || "ar",
        renderHTML: (attrs) => (attrs.lang ? { lang: attrs.lang } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span.ArabicInLineText" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "ArabicInLineText" }), 0];
  },
});

// Inline English quote span: <span class="EnglishQuote">…</span>
export const EnglishQuote = Mark.create({
  name: "englishQuote",

  parseHTML() {
    return [{ tag: "span.EnglishQuote" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "EnglishQuote" }), 0];
  },
});

// Inline footnote reference anchor: <a class="FootNoteLink" href="#1." id="1">1</a>
// Modelled as a mark so the numeric label stays editable text. Higher priority
// than the StarterKit Link mark so `a.FootNoteLink` is claimed here, not as a
// generic link. inclusive:false so typing after a reference does not extend it.
export const FootNoteLink = Mark.create({
  name: "footNoteLink",
  priority: 1100,
  inclusive: false,

  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML: (el) => el.getAttribute("href"),
        renderHTML: (attrs) => (attrs.href ? { href: attrs.href } : {}),
      },
      id: {
        default: null,
        parseHTML: (el) => el.getAttribute("id"),
        renderHTML: (attrs) => (attrs.id ? { id: attrs.id } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "a.FootNoteLink" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["a", mergeAttributes(HTMLAttributes, { class: "FootNoteLink" }), 0];
  },
});

// Block footnote definition: <p class="FootNote" id="1.">…</p>
// Also parses legacy <li class="FootNote"> but always re-renders as a paragraph;
// list-based footnote sets are legacy content that opens in source mode anyway.
export const FootNote = Node.create({
  name: "footNote",
  group: "block",
  content: "inline*",
  priority: 1100,
  defining: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => el.getAttribute("id"),
        renderHTML: (attrs) => (attrs.id ? { id: attrs.id } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "p.FootNote" }, { tag: "li.FootNote" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["p", mergeAttributes(HTMLAttributes, { class: "FootNote" }), 0];
  },
});
