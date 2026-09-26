import { NextResponse } from "next/server";
import {
  getArticlesByTopicPaged,
  getArticlesByWriterPaged,
  getContentByTopicPaged,
  getContentByWriterPaged,
  getQueriesByTopicPaged,
  getQueriesByWriterPaged,
} from "@/lib/queries";

export const dynamic = "force-dynamic";
const PER_PAGE = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");
  const slug = searchParams.get("slug")?.trim();
  const view = searchParams.get("view");
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  if ((scope !== "topic" && scope !== "writer") || !slug || (view !== "articles" && view !== "queries" && view !== "all")) {
    return NextResponse.json({ error: "A valid content feed is required." }, { status: 400 });
  }

  const result = scope === "topic"
    ? view === "articles" ? await getArticlesByTopicPaged(slug, page, PER_PAGE).then(({ articles, total }) => ({ items: articles, total }))
      : view === "queries" ? await getQueriesByTopicPaged(slug, page, PER_PAGE).then(({ queries, total }) => ({ items: queries, total }))
        : await getContentByTopicPaged(slug, page, PER_PAGE)
    : view === "articles" ? await getArticlesByWriterPaged(slug, page, PER_PAGE).then(({ articles, total }) => ({ items: articles, total }))
      : view === "queries" ? await getQueriesByWriterPaged(slug, page, PER_PAGE).then(({ queries, total }) => ({ items: queries, total }))
        : await getContentByWriterPaged(slug, page, PER_PAGE);
  return NextResponse.json({ items: result.items, nextPage: page * PER_PAGE < result.total ? page + 1 : null });
}
