// Single source of truth for the Tiptap *content* schema: every extension that
// affects how article / query HTML is parsed and serialized. Both the live admin
// editor (src/app/admin/_components/html-editor.tsx) and the headless round-trip
// audit (scripts/tiptap-roundtrip.ts, Fable-Improved-Plan.md section E) build from
// this exact list, so the audit provably exercises the same parse/serialize rules
// the editor runs. That is what makes the audit a real regression gate: change an
// extension here and the audit will tell you which stored HTML stops round-tripping.
//
// Keep this module browser-free. No React, no DOM access at import time, so a Node
// script run under tsx can import it after polyfilling window/document with jsdom.
//
// UI-only extensions (Placeholder, the slash-command menu, image upload handlers)
// stay in the editor component, NOT here: they add no nodes or marks and never
// touch HTML serialization, so they are irrelevant to the round-trip.

import type { Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import {
  ArabicInLineText,
  EnglishQuote,
  FootNoteLink,
  FootNote,
} from "../../app/admin/_components/editor/extensions";

// Order matches the editor exactly. FootNoteLink sets extension priority 1100 so
// `a.FootNoteLink` is claimed before the StarterKit link mark. FootNote keeps the
// default extension priority (so `paragraph` stays the default block wrapper) and
// instead sets parse-rule priority 100 so `p.FootNote` is claimed before the plain
// paragraph. This array order only breaks remaining ties.
export const contentExtensions: Extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: {
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: "noopener noreferrer nofollow" },
    },
  }),
  Image.configure({ inline: false, allowBase64: false }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
  ArabicInLineText,
  EnglishQuote,
  FootNoteLink,
  FootNote,
];
