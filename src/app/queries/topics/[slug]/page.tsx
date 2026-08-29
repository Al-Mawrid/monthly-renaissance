import type { Metadata } from "next";
import {
  getCachedTopicBySlug,
  parseContentView,
  TopicProfile,
} from "@/components/content/topic-profile";
import { SITE_NAME, SITE_URL } from "@/lib/site-meta";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getCachedTopicBySlug(slug).catch(() => null);
  if (!topic) return { title: SITE_NAME };

  const title = `${topic.name} Queries | ${SITE_NAME}`;
  const description = `Reader questions and answers about ${topic.name} from ${SITE_NAME}.`;
  const canonical = `${SITE_URL}/queries/topics/${topic.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function QueryTopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; view?: string }>;
}) {
  const [{ slug }, { page: pageParam, view: viewParam }] = await Promise.all([
    params,
    searchParams,
  ]);
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const view = parseContentView(viewParam, "queries");

  return <TopicProfile slug={slug} page={page} view={view} />;
}
