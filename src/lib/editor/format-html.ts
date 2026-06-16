// Basic, render-safe HTML pretty-printer for the source ("HTML") view of the
// editor. It only restructures BLOCK-level nesting: a newline + indentation is
// inserted before each block tag, and whitespace-only text *between* block
// elements is dropped. Inline content (text runs, <b>, <a>, the Arabic spans,
// footnote links, etc.) is emitted verbatim, so no character inside a text run
// or inline element is ever altered, and inter-word spaces are preserved.
// Content inside <pre>/<script>/<style>/<textarea> is copied through untouched
// because whitespace there is significant.
//
// The contract is deliberately conservative: the only edits it makes are
// render-insignificant (collapsing/indenting whitespace between block tags), so
// formatting even legacy markup will not change how an article renders. It is
// invoked only on an explicit "Format" click, never automatically.

const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

// Tags that flow inline; everything else is treated as block-level for
// indentation purposes. (`br`/`img`/`wbr` are inline AND void.)
const INLINE_TAGS = new Set([
  "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "del", "dfn",
  "em", "i", "img", "ins", "kbd", "label", "mark", "q", "rp", "rt", "ruby",
  "s", "samp", "small", "span", "strong", "sub", "sup", "time", "tt", "u",
  "var", "wbr", "font", "big", "strike",
]);

// Content of these elements is copied verbatim (whitespace is significant).
const RAW_TAGS = new Set(["pre", "script", "style", "textarea"]);

type Token =
  | { type: "text"; raw: string }
  | { type: "comment"; raw: string }
  | { type: "tag"; raw: string; name: string; isClose: boolean; selfClose: boolean };

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  const n = html.length;
  let i = 0;
  while (i < n) {
    if (html[i] === "<") {
      if (html.startsWith("<!--", i)) {
        const end = html.indexOf("-->", i + 4);
        const stop = end === -1 ? n : end + 3;
        tokens.push({ type: "comment", raw: html.slice(i, stop) });
        i = stop;
        continue;
      }
      if (html[i + 1] === "!" || html[i + 1] === "?") {
        // doctype / processing instruction / CDATA — keep on its own line.
        const end = html.indexOf(">", i);
        const stop = end === -1 ? n : end + 1;
        tokens.push({ type: "comment", raw: html.slice(i, stop) });
        i = stop;
        continue;
      }
      // A tag: scan to the closing '>' while respecting quoted attributes so a
      // '>' inside an attribute value does not end the tag early.
      let j = i + 1;
      let quote: string | null = null;
      while (j < n) {
        const c = html[j];
        if (quote) {
          if (c === quote) quote = null;
        } else if (c === '"' || c === "'") {
          quote = c;
        } else if (c === ">") {
          break;
        }
        j++;
      }
      const closed = j < n;
      const raw = html.slice(i, closed ? j + 1 : n);
      const inner = closed ? raw.slice(1, -1) : raw.slice(1);
      const isClose = inner[0] === "/";
      const body = isClose ? inner.slice(1) : inner;
      const nameMatch = body.match(/^\s*([a-zA-Z][a-zA-Z0-9:-]*)/);
      if (!nameMatch) {
        // A stray "<" that is not a real tag — treat it as literal text.
        tokens.push({ type: "text", raw });
      } else {
        const name = nameMatch[1].toLowerCase();
        const selfClose = !isClose && /\/\s*$/.test(inner);
        tokens.push({ type: "tag", raw, name, isClose, selfClose });
      }
      i = closed ? j + 1 : n;
      continue;
    }
    let j = html.indexOf("<", i);
    if (j === -1) j = n;
    tokens.push({ type: "text", raw: html.slice(i, j) });
    i = j;
  }
  return tokens;
}

const isInline = (name: string) => INLINE_TAGS.has(name);

export function formatHtml(html: string, indentUnit = "  "): string {
  if (!html || html.trim() === "") return "";
  const tokens = tokenize(html);

  let out = "";
  let depth = 0;
  // Stack of open block elements; each remembers whether it has a block child,
  // so an inline-only block keeps its closing tag on the same line.
  const blockStack: { name: string; hadBlockChild: boolean }[] = [];
  // Set to the tag name while inside a raw element; its content is copied as-is.
  let rawName: string | null = null;

  const atLineStart = () => out === "" || out.endsWith("\n");
  const breakLine = (d: number) => {
    out = out.replace(/[ \t]+$/, "");
    if (!atLineStart()) out += "\n";
    out += indentUnit.repeat(Math.max(0, d));
  };

  for (const tok of tokens) {
    if (rawName) {
      out += tok.raw;
      if (tok.type === "tag" && tok.isClose && tok.name === rawName) rawName = null;
      continue;
    }

    if (tok.type === "text") {
      if (tok.raw.trim() === "") {
        // Whitespace between block tags is insignificant: drop it at a line
        // start; otherwise it is an inter-word space, so keep a single space.
        if (!atLineStart()) out += " ";
      } else {
        out += atLineStart() ? tok.raw.replace(/^\s+/, "") : tok.raw;
      }
      continue;
    }

    if (tok.type === "comment") {
      breakLine(depth);
      out += tok.raw;
      continue;
    }

    const { name, isClose, selfClose } = tok;

    if (isInline(name)) {
      // Inline tags flow with surrounding text; never force a break.
      out += tok.raw;
      continue;
    }

    // Block-level tag.
    if (isClose) {
      const frame = blockStack.pop();
      depth = Math.max(0, depth - 1);
      if (frame && frame.hadBlockChild) breakLine(depth);
      out += tok.raw;
    } else {
      if (blockStack.length) blockStack[blockStack.length - 1].hadBlockChild = true;
      breakLine(depth);
      out += tok.raw;
      if (selfClose || VOID_TAGS.has(name)) {
        // No depth change — nothing to close.
      } else if (RAW_TAGS.has(name)) {
        rawName = name;
      } else {
        blockStack.push({ name, hadBlockChild: false });
        depth += 1;
      }
    }
  }

  return out
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
