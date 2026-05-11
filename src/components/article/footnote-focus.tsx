"use client";

import { useEffect } from "react";

export function FootnoteFocus() {
  useEffect(() => {
    const container = document.querySelector<HTMLElement>(".article-content");
    if (!container) return;

    const flashTimeouts = new Map<Element, number>();

    function flash(el: Element) {
      const existing = flashTimeouts.get(el);
      if (existing) window.clearTimeout(existing);
      el.classList.remove("mr-footnote-flash");
      void (el as HTMLElement).offsetWidth;
      el.classList.add("mr-footnote-flash");
      const t = window.setTimeout(() => {
        el.classList.remove("mr-footnote-flash");
        flashTimeouts.delete(el);
      }, 1500);
      flashTimeouts.set(el, t);
    }

    function focusId(rawId: string) {
      const id = decodeURIComponent(rawId);
      if (!id) return false;
      const el = document.getElementById(id);
      if (!el || !container!.contains(el)) return false;

      const flashEl = (el.closest(".FootNote") as HTMLElement | null) || el;
      const rect = flashEl.getBoundingClientRect();
      const targetTop =
        window.scrollY + rect.top - (window.innerHeight - rect.height) / 2;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: Math.max(0, Math.min(maxScroll, targetTop)),
        behavior: "smooth",
      });
      flash(flashEl);
      history.replaceState(null, "", `#${id}`);
      return true;
    }

    function onClick(e: Event) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (anchor && container!.contains(anchor)) {
        const href = anchor.getAttribute("href") || "";
        if (focusId(href.slice(1))) e.preventDefault();
        return;
      }

      const note = target.closest(".FootNote") as HTMLElement | null;
      if (note && container!.contains(note)) {
        const backLink = note.querySelector<HTMLAnchorElement>('a[href^="#"]');
        if (backLink) {
          const href = backLink.getAttribute("href") || "";
          if (focusId(href.slice(1))) e.preventDefault();
        }
      }
    }

    container.addEventListener("click", onClick);

    if (window.location.hash.length > 1) {
      const id = window.location.hash.slice(1);
      window.setTimeout(() => focusId(id), 80);
    }

    return () => {
      container.removeEventListener("click", onClick);
      for (const t of flashTimeouts.values()) window.clearTimeout(t);
      flashTimeouts.clear();
    };
  }, []);

  return null;
}
