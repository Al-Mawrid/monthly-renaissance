import { parse, HTMLElement } from "node-html-parser";

const OFFICE_NS_PREFIX = /^[ovwm]:/i;
const MSO_CLASS = /(?:^|\s)Mso[\w-]*/g;
const MSO_STYLE_DECL = /(?:^|;)\s*mso-[a-z0-9-]+\s*:[^;]*;?/gi;
const BORDER_STYLE_DECL = /(?:^|;)\s*border(?:-(?:left|right|top|bottom))?(?:-[a-z0-9-]+)?\s*:[^;]*;?/gi;
const CONDITIONAL_COMMENT = /<!--\[if[\s\S]*?<!\[endif\]-->/gi;
const PLAIN_COMMENT = /<!--[\s\S]*?-->/g;

function scrubStyle(raw: string): string {
  let out = raw.replace(MSO_STYLE_DECL, "").replace(BORDER_STYLE_DECL, "");
  out = out.replace(/^[\s;]+/, "").replace(/[\s;]+$/, "").trim();
  return out;
}

function scrubClass(raw: string): string {
  return raw.replace(MSO_CLASS, "").replace(/\s+/g, " ").trim();
}

function walk(node: HTMLElement): void {
  const children = node.childNodes.slice();
  for (const child of children) {
    if (!(child instanceof HTMLElement)) continue;

    const tag = child.rawTagName || "";

    if (OFFICE_NS_PREFIX.test(tag)) {
      child.replaceWith(child.innerHTML);
      continue;
    }

    walk(child);

    const attrs = child.attributes;

    if (attrs.style !== undefined) {
      const cleaned = scrubStyle(attrs.style);
      if (cleaned) child.setAttribute("style", cleaned);
      else child.removeAttribute("style");
    }

    if (attrs.class !== undefined) {
      const cleaned = scrubClass(attrs.class);
      if (cleaned) child.setAttribute("class", cleaned);
      else child.removeAttribute("class");
    }

    if (attrs.align !== undefined && /^(p|div|td|th|tr|table|h[1-6])$/i.test(tag)) {
      child.removeAttribute("align");
    }

    if (tag.toLowerCase() === "span") {
      const hasAttrs = Object.keys(child.attributes).length > 0;
      const isEmpty = child.innerHTML.trim() === "";
      if (isEmpty && !hasAttrs) {
        child.remove();
      } else if (isEmpty && hasAttrs) {
        child.remove();
      }
    }
  }
}

export function cleanWordHtml(html: string | null | undefined): string {
  if (!html) return "";

  const pre = html
    .replace(CONDITIONAL_COMMENT, "")
    .replace(PLAIN_COMMENT, "");

  const root = parse(pre, {
    voidTag: { closingSlash: false },
  });

  walk(root as HTMLElement);

  let out = root.toString();
  out = out.replace(/<span\s*><\/span>/gi, "");
  out = out.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  out = out.replace(/\n\s*\n\s*\n+/g, "\n\n");

  return out.trim();
}
