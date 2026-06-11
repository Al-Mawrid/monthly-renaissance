"use client";

import {
  forwardRef,
  useImperativeHandle,
  useState,
  type ComponentType,
} from "react";

export type SlashItem = {
  title: string;
  subtitle?: string;
  searchTerms: string[];
  Icon: ComponentType<{ className?: string }>;
  command: (args: { editor: unknown; range: unknown }) => void;
};

export type SlashMenuRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

export const SlashMenuList = forwardRef<
  SlashMenuRef,
  { items: SlashItem[]; command: (item: SlashItem) => void }
>(function SlashMenuList({ items, command }, ref) {
  const [selected, setSelected] = useState(0);

  // Reset the highlight whenever the filtered list changes. Adjusting state
  // during render (vs. in an effect) is the React-sanctioned pattern here.
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setSelected(0);
  }

  function select(index: number) {
    const item = items[index];
    if (item) command(item);
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (items.length === 0) return false;
      if (event.key === "ArrowUp") {
        setSelected((s) => (s + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelected((s) => (s + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        select(selected);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return <div className="mr-slash-empty">No matches</div>;
  }

  return (
    <div className="mr-slash-list" role="listbox">
      {items.map((item, index) => (
        <button
          type="button"
          key={item.title}
          role="option"
          aria-selected={index === selected}
          className={`mr-slash-item ${index === selected ? "is-active" : ""}`}
          onMouseEnter={() => setSelected(index)}
          // mousedown (not click) so the editor selection is not lost first.
          onMouseDown={(e) => {
            e.preventDefault();
            select(index);
          }}
        >
          <item.Icon className="h-4 w-4 shrink-0" />
          <span className="mr-slash-item-title">{item.title}</span>
          {item.subtitle && <span className="mr-slash-item-sub">{item.subtitle}</span>}
        </button>
      ))}
    </div>
  );
});
