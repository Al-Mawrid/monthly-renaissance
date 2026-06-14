/**
 * Shared lookup logic for the legacy ASP.NET URL 301 redirects.
 *
 * The old site lived at monthly-renaissance.com/issue/*.aspx. Every content
 * model carries an `oldId` (the original MSSQL identifier), which is what these
 * helpers resolve against. See MIGRATION_PLAN.md for the full URL map and
 * Fable-Improved-Plan.md section F.
 *
 * Route handlers under src/app/issue/*.aspx/ (and the root /content.aspx alias)
 * call these and 301-redirect to the returned path.
 */
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Public origin for building redirect targets. Behind Passenger the app binds
 * to 0.0.0.0:3000, so `request.nextUrl.origin` is the internal address and must
 * not be used in a Location header. Prefer the proxy-forwarded host.
 */
export function originFor(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return request.nextUrl.origin;
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** Parse the legacy `?id=` query value into a positive integer, or null. */
export function parseLegacyId(raw: string | null): number | null {
  if (!raw) return null;
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Resolve a legacy content id (`content.aspx?id=`) to a new-site path.
 * Articles and Q&A share the /articles/[slug] detail route; books land on
 * the ebooks index. Returns null when nothing matches.
 */
export async function resolveContentTarget(id: number): Promise<string | null> {
  const article = await prisma.article.findUnique({
    where: { oldId: id },
    select: { slug: true },
  });
  if (article) return `/articles/${article.slug}`;

  const query = await prisma.queryEntry.findUnique({
    where: { oldId: id },
    select: { slug: true },
  });
  if (query) return `/articles/${query.slug}`;

  const book = await prisma.book.findUnique({
    where: { oldId: id },
    select: { id: true },
  });
  if (book) return "/ebooks";

  return null;
}

/** Resolve a legacy issue id (`viewissue.aspx?id=`) to /issues/[slug], or null. */
export async function resolveIssueTarget(id: number): Promise<string | null> {
  const issue = await prisma.issue.findUnique({
    where: { oldId: id },
    select: { slug: true },
  });
  return issue ? `/issues/${issue.slug}` : null;
}
