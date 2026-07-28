import { parse, HTMLElement, NodeType } from "node-html-parser";

const DROP_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
]);

const URL_ATTRS = new Set(["href", "src", "xlink:href", "formaction"]);

const JS_URL = /^\s*javascript\s*:/i;
const ASCII_DIGIT = /\d/g;
const VERSE_NUMBER = /\((\d+)\)/g;
const SECTION_VERSES_HEADING = /^section\s+[ivxlcdm]+\s*:\s*verses\s*\(\s*\d+\s*(?:-|–|—)\s*\d+\s*\)$/i;
const SUBHEADING_LABEL = /^(?:explanation|text\s+and\s+translation)$/i;
const BISMILLAH = "بِسۡمِ اللّٰہِ الرَّحۡمٰنِ الرَّحِیۡمِ";
const ARABIC_CHARACTER = /[\u0600-\u06ff]/g;
const LATIN_CHARACTER = /[A-Za-z]/g;
const LEGACY_FOOTNOTE_REFERENCE = /^#_ftn(\d+)$/i;
const LEGACY_FOOTNOTE_BACKLINK = /^#_ftnref(\d+)$/i;

function arabicIndicDigits(value: string): string {
  return value.replace(ASCII_DIGIT, (digit) => String.fromCharCode(0x0660 + Number(digit)));
}

function isArabicBlock(el: HTMLElement): boolean {
  const className = el.getAttribute("class") ?? "";
  return el.getAttribute("dir")?.toLowerCase() === "rtl"
    || /\b(?:TextArabic|Arabic(?:Quote|Paragraph|InLineText)|arabic-block)\b/i.test(className);
}

function localizeArabicVerseNumbers(el: HTMLElement, inArabicBlock = false): void {
  const inCurrentArabicBlock = inArabicBlock || isArabicBlock(el);

  for (const child of el.childNodes) {
    if (child.nodeType === NodeType.ELEMENT_NODE) {
      localizeArabicVerseNumbers(child as HTMLElement, inCurrentArabicBlock);
    } else if (inCurrentArabicBlock && child.nodeType === NodeType.TEXT_NODE) {
      child.rawText = child.rawText.replace(
        VERSE_NUMBER,
        (_, verse) => `(<span class="ArabicVerseNumber">${arabicIndicDigits(verse)}</span>)`,
      );
    }
  }
}

function markBismillahBlocks(el: HTMLElement): void {
  const text = el.text.replace(/\s+/g, " ").trim();
  if (isArabicBlock(el) && text === BISMILLAH) {
    el.setAttribute("class", `${el.getAttribute("class") ?? ""} ArabicBismillah`.trim());
  }

  for (const child of el.childNodes) {
    if (child.nodeType === NodeType.ELEMENT_NODE) {
      markBismillahBlocks(child as HTMLElement);
    }
  }
}

function addClass(el: HTMLElement, className: string): void {
  const classes = new Set((el.getAttribute("class") ?? "").split(/\s+/).filter(Boolean));
  classes.add(className);
  el.setAttribute("class", [...classes].join(" "));
}

function removeEmptyParagraphs(el: HTMLElement): void {
  for (const child of [...el.childNodes]) {
    if (child.nodeType !== NodeType.ELEMENT_NODE) continue;
    const node = child as HTMLElement;
    removeEmptyParagraphs(node);

    if ((node.rawTagName || "").toLowerCase() !== "p") continue;
    const text = node.text.replace(/[\s\u00a0\u200b\ufeff]+/g, "");
    const hasNonTextContent = node.querySelector("img, video, audio, svg, math, table, hr") !== null;
    if (!text && !hasNonTextContent) node.remove();
  }
}

function normalizeLegacyArabicBlocks(el: HTMLElement): void {
  for (const child of el.childNodes) {
    if (child.nodeType !== NodeType.ELEMENT_NODE) continue;
    const node = child as HTMLElement;
    normalizeLegacyArabicBlocks(node);

    if ((node.rawTagName || "").toLowerCase() !== "p" || isArabicBlock(node)) continue;
    const text = node.text.trim();
    const arabicCharacters = text.match(ARABIC_CHARACTER)?.length ?? 0;
    const latinCharacters = text.match(LATIN_CHARACTER)?.length ?? 0;
    if (arabicCharacters >= 20 && arabicCharacters >= latinCharacters * 2) {
      addClass(node, "ArabicQuote");
    }
  }
}

function normalizeLegacyFootnotes(el: HTMLElement): void {
  for (const child of el.childNodes) {
    if (child.nodeType !== NodeType.ELEMENT_NODE) continue;
    const node = child as HTMLElement;
    normalizeLegacyFootnotes(node);

    if ((node.rawTagName || "").toLowerCase() !== "p") continue;
    const firstLink = node.querySelector("a[href]");
    const href = firstLink?.getAttribute("href") ?? "";
    const backlink = href.match(LEGACY_FOOTNOTE_BACKLINK);
    if (!backlink) continue;

    addClass(node, "FootNote");
    if (!node.getAttribute("id")) node.setAttribute("id", `_ftn${backlink[1]}`);
  }

  for (const link of el.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href") ?? "";
    const reference = href.match(LEGACY_FOOTNOTE_REFERENCE);
    if (!reference) continue;

    addClass(link, "FootNoteLink");
    if (!link.getAttribute("id")) link.setAttribute("id", `_ftnref${reference[1]}`);
  }
}

function promoteLegacyHeadings(el: HTMLElement): void {
  for (const child of el.childNodes) {
    if (child.nodeType !== NodeType.ELEMENT_NODE) continue;
    const node = child as HTMLElement;
    promoteLegacyHeadings(node);

    if ((node.rawTagName || "").toLowerCase() !== "p") continue;
    const text = node.text.replace(/\s+/g, " ").trim();

    if (SECTION_VERSES_HEADING.test(text)) {
      node.tagName = "h2";
      addClass(node, "align-center");
    } else if (SUBHEADING_LABEL.test(text)) {
      node.tagName = "h3";
      addClass(node, "align-left");
    }
  }
}

function promoteShortOpeningParagraph(el: HTMLElement): boolean {
  for (const child of el.childNodes) {
    if (child.nodeType !== NodeType.ELEMENT_NODE) continue;
    const node = child as HTMLElement;
    const tag = (node.rawTagName || "").toLowerCase();

    if (/^h[1-6]$/.test(tag)) return true;

    if (tag === "p") {
      const className = node.getAttribute("class") ?? "";
      if (/\b(?:FootNote|Arabic(?:Quote|Paragraph|InLineText)|TextArabic|EnglishQuote|arabic-block)\b/i.test(className)) {
        return true;
      }

      const words = node.text.trim().split(/\s+/).filter(Boolean);
      if (words.length > 0 && words.length <= 5) {
        node.tagName = "h2";
      }
      return true;
    }

    if (promoteShortOpeningParagraph(node)) return true;
  }
  return false;
}

function scrubAttributes(el: HTMLElement): void {
  const attrs = el.attributes;
  for (const name of Object.keys(attrs)) {
    const lower = name.toLowerCase();
    const value = attrs[name];

    if (lower.startsWith("on")) {
      el.removeAttribute(name);
      continue;
    }

    if (URL_ATTRS.has(lower)) {
      if (JS_URL.test(value)) {
        el.setAttribute(name, "#");
      }
      continue;
    }

    if (lower.startsWith("data-") && JS_URL.test(value)) {
      el.removeAttribute(name);
    }
  }
}

function walk(el: HTMLElement): void {
  const children = [...el.childNodes];
  for (const child of children) {
    if (child.nodeType !== NodeType.ELEMENT_NODE) continue;
    const node = child as HTMLElement;
    const tag = (node.rawTagName || "").toLowerCase();
    if (DROP_TAGS.has(tag)) {
      el.removeChild(node);
      continue;
    }
    scrubAttributes(node);
    walk(node);
  }
}

export function sanitizeArticleHtml(html: string): string {
  if (!html) return html;
  const root = parse(html);
  walk(root);
  // Very old imports can contain standalone Arabic and Word footnotes without
  // the legacy classes used by the article stylesheet.
  normalizeLegacyArabicBlocks(root);
  normalizeLegacyFootnotes(root);
  // Legacy Quranic text stores verse markers as ASCII digits inside RTL blocks.
  // Keep the surrounding markup intact while rendering those markers in Arabic-Indic digits.
  localizeArabicVerseNumbers(root);
  markBismillahBlocks(root);
  // Imported content often uses blank paragraphs as visual spacers. They add
  // inconsistent empty lines, so omit them without changing stored HTML.
  removeEmptyParagraphs(root);
  // Older imports store these standalone labels as ordinary paragraphs. Promote
  // them to semantic headings so they render consistently and survive editor saves.
  promoteLegacyHeadings(root);
  // A short opening line in legacy content is conventionally a title rather
  // than body prose. Give it heading semantics after other heading rules run.
  promoteShortOpeningParagraph(root);
  return root.toString();
}
