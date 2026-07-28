"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import {
  previewChannelName,
  previewStorageKey,
  type ArticlePreviewPayload,
} from "@/lib/article-preview";

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const ROLE_LABEL: Record<ArticlePreviewPayload["roleInIssue"], string> = {
  regular: "Article",
  editorial: "Editorial",
  intro: "Issue intro",
};

export function ArticlePreviewClient({ id }: { id: string }) {
  // localStorage is the single source of truth: the editor writes the snapshot
  // there and also broadcasts on the channel. Both the channel message and the
  // cross-tab `storage` event simply re-read localStorage via useSyncExternalStore.
  // The cache keeps getSnapshot referentially stable between writes (a fresh
  // parse on every call would loop the store).
  const cacheRef = useRef<{ raw: string | null; value: ArticlePreviewPayload | null }>({
    raw: null,
    value: null,
  });

  const subscribe = useCallback(
    (onChange: () => void) => {
      let channel: BroadcastChannel | null = null;
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel(previewChannelName(id));
        channel.onmessage = onChange;
      }
      // Fallback for browsers without BroadcastChannel: `storage` fires in other
      // tabs of the same origin whenever localStorage is written.
      const onStorage = (e: StorageEvent) => {
        if (e.key === previewStorageKey(id)) onChange();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        channel?.close();
        window.removeEventListener("storage", onStorage);
      };
    },
    [id],
  );

  const getSnapshot = useCallback((): ArticlePreviewPayload | null => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(previewStorageKey(id));
    } catch {
      raw = null;
    }
    if (raw !== cacheRef.current.raw) {
      let value: ArticlePreviewPayload | null = null;
      try {
        value = raw ? (JSON.parse(raw) as ArticlePreviewPayload) : null;
      } catch {
        value = null;
      }
      cacheRef.current = { raw, value };
    }
    return cacheRef.current.value;
  }, [id]);

  const getServerSnapshot = useCallback(() => null, []);

  const payload = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!payload) {
    return (
      <div className="mx-auto max-w-[760px] px-4 sm:px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-semibold mb-3">
          No live preview available
        </h1>
        <p className="text-muted-foreground text-sm">
          Open this preview from the{" "}
          <span className="font-medium">Preview</span> button in the article
          editor. It mirrors your unsaved changes as you type.
        </p>
      </div>
    );
  }

  const text = payload.bodyHtml.replace(/<[^>]+>/g, " ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <>
      {/* Preview banner — makes clear this is unsaved draft content */}
      <div
        className="sticky top-0 z-40 border-b text-[12px]"
        style={{
          borderColor: "var(--border)",
          background: "var(--mr-saffron-700, #b45309)",
          color: "#fff",
        }}
      >
        <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-5 py-2 flex items-center gap-2 flex-wrap">
          <span className="font-semibold tracking-wide uppercase">
            Live preview
          </span>
          <span style={{ opacity: 0.7 }}>·</span>
          <span style={{ opacity: 0.9 }}>
            Reflects unsaved changes from the editor. Nothing here is saved yet.
          </span>
        </div>
      </div>

      <article className="mx-auto max-w-[760px] px-2 sm:px-3 py-12 w-full">
        <div className="mr-eyebrow mb-3.5" style={{ color: "var(--mr-clay-700)" }}>
          — {payload.topicName || "Topic"} —
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.85rem] font-semibold tracking-tight leading-[1.1] mb-3 text-balance">
          {payload.title || "Untitled"}
        </h1>

        {(payload.issueLabel || payload.roleInIssue !== "regular") && (
          <div
            className="mr-catalog inline-flex items-center gap-2 mb-4 px-2 py-1 border"
            style={{
              borderColor: "var(--border)",
              background: "var(--mr-cream)",
              color: "var(--mr-clay-700)",
            }}
          >
            <span>{ROLE_LABEL[payload.roleInIssue]}</span>
            {payload.issueLabel && (
              <>
                <span aria-hidden style={{ opacity: 0.5 }}>
                  ·
                </span>
                <span>{payload.issueLabel}</span>
              </>
            )}
          </div>
        )}

        {/* Author line */}
        <div
          className="flex items-center gap-3.5 pb-5 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[13px]"
            style={{ background: "var(--mr-green-100)", color: "var(--mr-green-800)" }}
          >
            {initials(payload.writerName || "?")}
          </div>
          <div>
            <div className="text-[14px] font-medium">
              {payload.writerName || "Unknown writer"}
            </div>
            {payload.translatorName && (
              <div className="text-[11px] text-muted-foreground">
                Translated by {payload.translatorName}
              </div>
            )}
            <div className="text-[11px] text-muted-foreground">
              {readingTime} min read · {wordCount.toLocaleString()} words
            </div>
          </div>
        </div>

        <hr className="mr-rule-double my-7" />

        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: payload.bodyHtml }}
        />
      </article>
    </>
  );
}
