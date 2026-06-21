// Rewrites mammoth's footnote/endnote markup into this project's footnote
// schema (the `FootNoteLink` mark and `FootNote` node from
// src/app/admin/_components/editor/extensions.ts) so imported Word footnotes
// survive the trip through the Tiptap editor.
//
// mammoth (see node_modules/mammoth/lib/document-to-html.js) emits notes as:
//   reference:  <sup><a href="#footnote-1" id="footnote-ref-1">[1]</a></sup>
//   definition: <ol><li id="footnote-1"><p>… <a href="#footnote-ref-1">↑</a></p></li></ol>
// None of that carries the `FootNoteLink` / `FootNote` classes the schema parses,
// and the editor inserts imported HTML via insertContent (so it is re-parsed by
// the schema). The schema drops the unknown <sup>, parses the reference as a
// plain link, and lifts the <li>s out as a plain ordered list while discarding
// their `id`s, leaving the footnotes unstyled and the anchors dangling.
//
// This converts mammoth's notes into the round-trippable form the schema renders:
//   reference:  <a class="FootNoteLink" href="#fn1" id="fnref1">1</a>
//   definition: <p class="FootNote" id="fn1">1. … <a href="#fnref1">↑</a></p>
// References are numbered sequentially in document order (matching mammoth's own
// visible numbering); definitions are matched back to their reference by the note
// id mammoth shares between the two, so footnotes and endnotes interleave safely.
//
// Node-only: uses node-html-parser, the same parser word-clean.ts runs on.

import { parse, HTMLElement } from "node-html-parser";

const REF_ID = /^(?:footnote|endnote)-ref-/;
const DEF_ID = /^(?:footnote|endnote)-/;
const BACKLINK_HREF = /^#(?:footnote|endnote)-ref-/;
const BLOCK_TAGS = new Set(["p", "div"]);

function tagName(node: HTMLElement): string {
  return (node.rawTagName || "").toLowerCase();
}

// Pull the inline content out of a note's <li>: drop mammoth's "↑" back-link and
// flatten any block children (footnotes can hold multiple paragraphs) to inline
// HTML, since the FootNote node only accepts inline content.
function extractInline(li: HTMLElement): string {
  for (const a of li.querySelectorAll("a")) {
    if (BACKLINK_HREF.test(a.getAttribute("href") || "")) a.remove();
  }

  const blocks = li.childNodes.filter(
    (c): c is HTMLElement => c instanceof HTMLElement && BLOCK_TAGS.has(tagName(c)),
  );

  const inner =
    blocks.length > 0
      ? blocks
          .map((b) => b.innerHTML.trim())
          .filter(Boolean)
          .join("<br>")
      : li.innerHTML.trim();

  return inner.trim();
}

export function restoreFootnotes(html: string | null | undefined): string {
  if (!html) return "";

  const root = parse(html, { voidTag: { closingSlash: false } });

  const refAnchors = root
    .querySelectorAll("a")
    .filter((a) => REF_ID.test(a.getAttribute("id") || ""));
  const defLis = root
    .querySelectorAll("li")
    .filter((li) => DEF_ID.test(li.getAttribute("id") || ""));

  // Nothing to do: leave non-footnote documents byte-for-byte untouched.
  if (refAnchors.length === 0 && defLis.length === 0) return html;

  // Number references in document order; remember each note's number keyed by the
  // id mammoth shares between the reference and its definition (e.g. "footnote-1").
  const numberByKey = new Map<string, number>();
  let counter = 0;

  for (const ref of refAnchors) {
    const key = (ref.getAttribute("href") || "").replace(/^#/, "");
    const n = ++counter;
    if (key) numberByKey.set(key, n);

    ref.setAttribute("class", "FootNoteLink");
    ref.setAttribute("href", `#fn${n}`);
    ref.setAttribute("id", `fnref${n}`);
    ref.set_content(String(n));

    // Unwrap the <sup> wrapper; the FootNoteLink CSS renders the chip superscript.
    const parent = ref.parentNode;
    if (parent instanceof HTMLElement && tagName(parent) === "sup") {
      parent.replaceWith(parent.innerHTML);
    }
  }

  // Rebuild each note list as standalone <p class="FootNote"> blocks. Orphan
  // definitions (defined but never referenced) get numbers after the referenced
  // ones so nothing collides.
  let orphan = counter;
  const blocksByContainer = new Map<HTMLElement, string[]>();
  const looseReplacements: Array<[HTMLElement, string]> = [];

  for (const li of defLis) {
    const key = li.getAttribute("id") || "";
    const n = numberByKey.get(key) ?? ++orphan;
    const inner = extractInline(li);
    const body = inner ? `${n}. ${inner}` : `${n}.`;
    const block = `<p class="FootNote" id="fn${n}">${body} <a href="#fnref${n}">↑</a></p>`;

    const container = li.parentNode;
    if (container instanceof HTMLElement && /^(?:ol|ul)$/.test(tagName(container))) {
      const arr = blocksByContainer.get(container) ?? [];
      arr.push(block);
      blocksByContainer.set(container, arr);
    } else {
      // Defensive: a note not wrapped in a list. Replace the <li> in place.
      looseReplacements.push([li, block]);
    }
  }

  // Replace each note list (mammoth emits one dedicated <ol> for all notes) with
  // its rebuilt blocks, preceded by a divider rule.
  for (const [container, blocks] of blocksByContainer) {
    container.replaceWith(`<hr>${blocks.join("")}`);
  }
  for (const [li, block] of looseReplacements) {
    li.replaceWith(block);
  }

  return root.toString();
}
