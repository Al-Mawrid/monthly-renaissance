import { ArticlePreviewClient } from "./preview-client";

// The preview content lives entirely in the client (localStorage + BroadcastChannel),
// so there is nothing to fetch or cache here.
export const metadata = {
  title: "Article preview",
  robots: { index: false, follow: false },
};

export default async function ArticlePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArticlePreviewClient id={id} />;
}
