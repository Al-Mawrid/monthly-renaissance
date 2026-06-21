// Detects whether a stored bodyHtml string is "legacy" markup that the Tiptap
// schema cannot round-trip losslessly. The editor uses this to decide the
// initial tab (legacy -> HTML source, clean/new -> Tiptap visual) and to warn
// before converting a legacy document to the visual editor.
//
// The contract is deliberately conservative: clean output produced by our Tiptap
// schema contains NONE of the markers below (no <font>, no inline `style`/`align`,
// no <div>, and only the custom class names we render). So anything that carries
// one of these markers is treated as legacy and kept untouched in source mode.
// When in doubt we favour "legacy" so 35 years of imported HTML is never silently
// normalized.

// Class tokens the Tiptap schema emits or intentionally preserves. Any class
// outside this set means the markup did not come from our editor.
const CLEAN_CLASS_TOKENS = new Set([
  "FootNote",
  "FootNoteLink",
  "ArabicInLineText",
  "arabic-within",
  "arabic-block",
  "EnglishQuote",
  "arabic-quote",
  "ArticleHeading",
  // Block alignment classes emitted by the TextAlign extension (extensions.ts).
  "align-left",
  "align-center",
  "align-right",
  "align-justify",
]);

// Tags / attributes that our Tiptap output never produces.
const LEGACY_TAG_MARKERS = /<\s*(?:font|div|center|o:p|span:|v:|w:|st1:)/i;
const HAS_STYLE_ATTR = /\sstyle\s*=/i;
const HAS_ALIGN_ATTR = /\salign\s*=/i;

function classTokensAreLegacy(html: string): boolean {
  const classRe = /class\s*=\s*"([^"]*)"/gi;
  let m: RegExpExecArray | null;
  while ((m = classRe.exec(html))) {
    const tokens = m[1].split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      if (!CLEAN_CLASS_TOKENS.has(token)) return true;
    }
  }
  return false;
}

export function looksLegacy(html: string | null | undefined): boolean {
  // Empty / whitespace-only content is a fresh document, not legacy.
  if (!html || html.trim() === "") return false;

  if (LEGACY_TAG_MARKERS.test(html)) return true;
  if (HAS_STYLE_ATTR.test(html)) return true;
  if (HAS_ALIGN_ATTR.test(html)) return true;
  if (classTokensAreLegacy(html)) return true;

  return false;
}
