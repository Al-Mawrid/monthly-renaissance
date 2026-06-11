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
  return root.toString();
}
