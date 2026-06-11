"use client";

import { Extension, type Editor, type Range } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import {
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Table as TableIcon,
  Image as ImageIcon,
} from "lucide-react";
import { SlashMenuList, type SlashItem, type SlashMenuRef } from "./slash-menu-list";

const slashPluginKey = new PluginKey("mr-slash-commands");

function buildItems(onImage: (editor: Editor) => void): SlashItem[] {
  return [
    {
      title: "Text",
      subtitle: "Paragraph",
      searchTerms: ["paragraph", "text", "p"],
      Icon: Pilcrow,
      command: ({ editor, range }) =>
        (editor as Editor).chain().focus().deleteRange(range as Range).setParagraph().run(),
    },
    {
      title: "Heading 1",
      searchTerms: ["h1", "title", "heading"],
      Icon: Heading1,
      command: ({ editor, range }) =>
        (editor as Editor).chain().focus().deleteRange(range as Range).setNode("heading", { level: 1 }).run(),
    },
    {
      title: "Heading 2",
      searchTerms: ["h2", "heading", "subtitle"],
      Icon: Heading2,
      command: ({ editor, range }) =>
        (editor as Editor).chain().focus().deleteRange(range as Range).setNode("heading", { level: 2 }).run(),
    },
    {
      title: "Heading 3",
      searchTerms: ["h3", "heading"],
      Icon: Heading3,
      command: ({ editor, range }) =>
        (editor as Editor).chain().focus().deleteRange(range as Range).setNode("heading", { level: 3 }).run(),
    },
    {
      title: "Quote",
      subtitle: "Blockquote",
      searchTerms: ["blockquote", "quote", "citation"],
      Icon: Quote,
      command: ({ editor, range }) =>
        (editor as Editor).chain().focus().deleteRange(range as Range).toggleBlockquote().run(),
    },
    {
      title: "Bullet list",
      searchTerms: ["unordered", "bullet", "list", "ul"],
      Icon: List,
      command: ({ editor, range }) =>
        (editor as Editor).chain().focus().deleteRange(range as Range).toggleBulletList().run(),
    },
    {
      title: "Numbered list",
      searchTerms: ["ordered", "numbered", "list", "ol"],
      Icon: ListOrdered,
      command: ({ editor, range }) =>
        (editor as Editor).chain().focus().deleteRange(range as Range).toggleOrderedList().run(),
    },
    {
      title: "Table",
      searchTerms: ["table", "grid", "rows", "columns"],
      Icon: TableIcon,
      command: ({ editor, range }) =>
        (editor as Editor)
          .chain()
          .focus()
          .deleteRange(range as Range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      title: "Image",
      subtitle: "Upload",
      searchTerms: ["image", "picture", "photo", "upload"],
      Icon: ImageIcon,
      command: ({ editor, range }) => {
        (editor as Editor).chain().focus().deleteRange(range as Range).run();
        onImage(editor as Editor);
      },
    },
  ];
}

function filterItems(items: SlashItem[], query: string): SlashItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.searchTerms.some((term) => term.includes(q)),
  );
}

function makeRenderer(): SuggestionOptions["render"] {
  return () => {
    let component: ReactRenderer<SlashMenuRef> | null = null;
    let popup: HTMLDivElement | null = null;

    function reposition(clientRect: (() => DOMRect | null) | null | undefined) {
      if (!popup || !clientRect) return;
      const rect = clientRect();
      if (!rect) return;
      popup.style.left = `${rect.left + window.scrollX}px`;
      popup.style.top = `${rect.bottom + window.scrollY + 6}px`;
    }

    function teardown() {
      popup?.remove();
      component?.destroy();
      popup = null;
      component = null;
    }

    return {
      onStart: (props) => {
        component = new ReactRenderer(SlashMenuList, {
          props,
          editor: props.editor,
        });
        popup = document.createElement("div");
        popup.className = "mr-slash-popup";
        popup.appendChild(component.element);
        document.body.appendChild(popup);
        reposition(props.clientRect);
      },
      onUpdate: (props) => {
        component?.updateProps(props);
        reposition(props.clientRect);
      },
      onKeyDown: (props) => {
        if (props.event.key === "Escape") {
          teardown();
          return true;
        }
        return component?.ref?.onKeyDown(props) ?? false;
      },
      onExit: () => {
        teardown();
      },
    };
  };
}

export function createSlashCommands(opts: { onImage: (editor: Editor) => void }) {
  return Extension.create({
    name: "slashCommands",

    addProseMirrorPlugins() {
      return [
        Suggestion<SlashItem>({
          editor: this.editor,
          pluginKey: slashPluginKey,
          char: "/",
          allowSpaces: false,
          startOfLine: false,
          command: ({ editor, range, props }) => props.command({ editor, range }),
          items: ({ query }) => filterItems(buildItems(opts.onImage), query),
          render: makeRenderer(),
        }),
      ];
    },
  });
}
