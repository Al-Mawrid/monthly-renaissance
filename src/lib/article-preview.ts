// Live-preview channel between the article editor and the standalone preview tab.
//
// The editor (admin) writes the current, *unsaved* form state to localStorage
// and broadcasts it on a BroadcastChannel keyed by the article id. The preview
// tab reads the localStorage snapshot on open and then listens on the channel
// for live updates as the editor types. Everything stays in the editing user's
// own browser (localStorage is per-origin, per-profile), so the draft never
// leaves the client — no server round-trip, no data exposure to other users.

export type ArticlePreviewRole = "regular" | "editorial" | "intro";

export type ArticlePreviewPayload = {
  id: number;
  title: string;
  bodyHtml: string;
  topicName: string;
  writerName: string;
  translatorName: string | null;
  issueLabel: string | null;
  roleInIssue: ArticlePreviewRole;
};

export function previewStorageKey(id: number | string): string {
  return `mr-article-preview-${id}`;
}

export function previewChannelName(id: number | string): string {
  return `mr-article-preview-${id}`;
}

export function previewUrl(id: number | string): string {
  return `/preview/articles/${id}`;
}

/** Persist a snapshot to localStorage so a freshly opened preview tab can read it. */
export function storeArticlePreview(payload: ArticlePreviewPayload): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      previewStorageKey(payload.id),
      JSON.stringify(payload),
    );
  } catch {
    // Quota or disabled storage — preview just won't be available; not fatal.
  }
}
