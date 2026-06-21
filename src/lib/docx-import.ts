// Server-side .docx -> HTML conversion built on mammoth. Produces clean,
// semantic HTML (headings, lists, tables, bold/italic, links) that the Tiptap
// content schema (src/lib/editor/schema.ts) can parse directly. Embedded images
// are not inlined as base64 (the editor's Image extension sets allowBase64:false
// and would drop them); instead each one is handed to `persistImage`, which is
// expected to store it and return a public URL, so imported images become real
// uploads just like manually inserted ones.
//
// Node-only: pulls in mammoth. Import it from the route handler, never a client
// component. Kept out of the editor schema module so the round-trip audit stays
// browser-free.

import mammoth from "mammoth";
import { cleanWordHtml } from "@/lib/word-clean";
import { restoreFootnotes } from "@/lib/docx-footnotes";

export type DocxConversion = {
  html: string;
  images: number;
  warnings: string[];
};

// The editor schema only supports heading levels 1-3. Word's deeper headings
// would otherwise parse as plain paragraphs and lose their emphasis, so fold
// them onto h3 (the deepest supported level). mammoth's default style map still
// handles Title/Heading 1-3 and everything else.
const STYLE_MAP = [
  "p[style-name='Heading 4'] => h3:fresh",
  "p[style-name='Heading 5'] => h3:fresh",
  "p[style-name='Heading 6'] => h3:fresh",
];

export async function convertDocxToHtml(
  buffer: Buffer,
  opts: {
    // Persist one embedded image and resolve with its public URL. Throw to skip
    // the image (e.g. an unsupported format); the placeholder is then removed.
    persistImage: (buf: Buffer, index: number) => Promise<string>;
  },
): Promise<DocxConversion> {
  const warnings: string[] = [];
  const skipped = new Map<string, number>();
  let imageIndex = 0;
  let saved = 0;

  const convertImage = mammoth.images.imgElement(async (image) => {
    const index = imageIndex++;
    try {
      const buf = await image.readAsBuffer();
      const url = await opts.persistImage(buf, index);
      saved++;
      return { src: url };
    } catch (err) {
      const reason =
        err instanceof Error ? err.message : "Image could not be imported";
      skipped.set(reason, (skipped.get(reason) ?? 0) + 1);
      // Emit an empty placeholder; stripped below so no broken <img> survives.
      return { src: "" };
    }
  });

  const result = await mammoth.convertToHtml(
    { buffer },
    { convertImage, styleMap: STYLE_MAP },
  );

  // Surface only mammoth's hard errors (corrupt parts, unreadable images). Its
  // "warning" messages are mostly unrecognised-style noise that is not
  // actionable for an editor.
  for (const message of result.messages) {
    if (message.type === "error") warnings.push(message.message);
  }

  // Drop the placeholders left by images we could not persist, convert mammoth's
  // footnote/endnote markup into the editor's FootNote/FootNoteLink schema, then
  // run the markup through the same normaliser the paste path uses.
  let html = result.value.replace(/<img\b[^>]*\bsrc=""[^>]*>/gi, "");
  html = restoreFootnotes(html);
  html = cleanWordHtml(html);

  for (const [reason, count] of skipped) {
    warnings.push(`${count} image${count === 1 ? "" : "s"} skipped: ${reason}`);
  }

  return { html, images: saved, warnings };
}
