// Custom Tiptap extensions that preserve the legacy CSS contract from
// globals.css (.article-content). The class names and attributes here must match
// the selectors exactly: `FootNote`, `FootNoteLink`, `ArabicInLineText`,
// `EnglishQuote`, plus dir/lang on Arabic spans.

import { Extension, Mark, Node, mergeAttributes } from "@tiptap/core";

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

// Inline Arabic that blends into the running text ("within text"): same size and
// colour as the surrounding text, only the script font (Noor-e-Huda) and RTL bidi
// differ. Distinct from ArabicInLineText, which is deliberately emphasised
// (larger, coloured). <span class="arabic-within" dir="rtl" lang="ar">…</span>.
export const ArabicWithinText = Mark.create({
  name: "arabicWithin",

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
    return [{ tag: "span.arabic-within" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "arabic-within" }), 0];
  },
});

// Block-level Arabic presented in its own bordered area (the cream box) for
// standalone verses / quotations: <p class="arabic-block" dir="rtl" lang="ar">…</p>.
// Rendered as a paragraph (NOT a <div>, which would trip looks-legacy). Parse-rule
// priority 100 claims `p.arabic-block` before the plain paragraph; the extension
// keeps default priority so `paragraph` stays the default block wrapper (see the
// FootNote note below for why that matters).
export const ArabicBlock = Node.create({
  name: "arabicBlock",
  group: "block",
  content: "inline*",
  defining: true,

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
    return [{ tag: "p.arabic-block", priority: 100 }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["p", mergeAttributes(HTMLAttributes, { class: "arabic-block" }), 0];
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
//
// Precedence over the plain paragraph is set on the parse RULES (priority 100,
// above ProseMirror's default rule priority of 50), NOT on the extension. An
// extension-level priority would also push `footNote` to the front of the schema's
// block group, which makes ProseMirror pick it as the *default* wrapper for orphan
// inline text — so a body with no block tags (e.g. plain-text legacy imports) would
// be wrapped in <p class="FootNote"> and the whole article would render as a
// footnote. Keeping the default extension priority leaves `paragraph` as the
// default block while the rule priority still claims `p.FootNote` before `p`.
export const FootNote = Node.create({
  name: "footNote",
  group: "block",
  content: "inline*",
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
    return [
      { tag: "p.FootNote", priority: 100 },
      { tag: "li.FootNote", priority: 100 },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["p", mergeAttributes(HTMLAttributes, { class: "FootNote" }), 0];
  },
});

// Block text alignment for paragraphs and headings.
//
// Unlike the official @tiptap/extension-text-align (which emits inline
// `style="text-align:…"`), this renders a CSS class — `align-left`,
// `align-center`, `align-right`, `align-justify`. Inline styles are a hard
// no-go in this schema: looks-legacy (legacy-detect.ts) flags ANY `style=`
// attribute as legacy markup, so style-based alignment would push every
// aligned article back into the source-mode/"this is legacy" path and break the
// round-trip contract (clean output carries no inline styles). The classes here
// are whitelisted in CLEAN_CLASS_TOKENS and styled under `.article-content` in
// globals.css. `justify` is the paragraph default in that CSS, so it is parsed
// (to absorb legacy markup on convert) but not offered as its own toolbar button.
const ALIGNMENTS = ["left", "center", "right", "justify"] as const;
const ALIGN_CLASS_PREFIX = "align-";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textAlign: {
      setTextAlign: (alignment: string) => ReturnType;
      unsetTextAlign: () => ReturnType;
    };
  }
}

export const TextAlign = Extension.create({
  name: "textAlign",

  addOptions() {
    return {
      types: ["paragraph", "heading"] as string[],
      alignments: [...ALIGNMENTS] as string[],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: null as string | null,
            // Prefer our own `align-*` class; fall back to a legacy inline
            // `text-align` style so converting old markup keeps its alignment.
            parseHTML: (element: HTMLElement) => {
              const fromClass = Array.from(element.classList)
                .filter((c) => c.startsWith(ALIGN_CLASS_PREFIX))
                .map((c) => c.slice(ALIGN_CLASS_PREFIX.length))[0];
              const value = fromClass || element.style.textAlign || null;
              return value && (ALIGNMENTS as readonly string[]).includes(value)
                ? value
                : null;
            },
            renderHTML: (attributes: { textAlign?: string | null }) =>
              attributes.textAlign
                ? { class: `${ALIGN_CLASS_PREFIX}${attributes.textAlign}` }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextAlign:
        (alignment: string) =>
        ({ commands }) => {
          if (!this.options.alignments.includes(alignment)) return false;
          return (this.options.types as string[])
            .map((type) => commands.updateAttributes(type, { textAlign: alignment }))
            .every((applied) => applied);
        },
      unsetTextAlign:
        () =>
        ({ commands }) =>
          (this.options.types as string[])
            .map((type) => commands.resetAttributes(type, "textAlign"))
            .every((applied) => applied),
    };
  },
});
