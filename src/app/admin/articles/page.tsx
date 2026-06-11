import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { ToggleDisplayButton } from "./toggle-button";
import { DeleteButton } from "../delete-button";
import { SortableHead } from "../sortable-head";
import { articleOrderBy, parseSort } from "../sort-utils";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, ExternalLink } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; order?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const perPage = 25;
  const { sort, order } = parseSort(params);

  const session = await auth();
  const isAdmin = canManageContent(session!.user.role);

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      orderBy: articleOrderBy(sort, order),
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        writer: true,
        topic: true,
        issueLinks: {
          take: 1,
          include: { issue: { select: { id: true, title: true, slug: true, volumeNumber: true, issueNumber: true } } },
        },
      },
    }),
    prisma.article.count(),
  ]);

  const issueIdsToFetch = Array.from(
    new Set(
      articles
        .map((a) => a.editorialIssueId ?? a.introIssueId)
        .filter((id): id is number => typeof id === "number"),
    ),
  );
  const flagIssues = issueIdsToFetch.length
    ? await prisma.issue.findMany({
        where: { id: { in: issueIdsToFetch } },
        select: { id: true, title: true, slug: true, volumeNumber: true, issueNumber: true },
      })
    : [];
  const flagIssueMap = new Map(flagIssues.map((i) => [i.id, i]));

  const totalPages = Math.ceil(total / perPage);

  // Preserve sort in pagination links
  const sortQuery = sort ? `&sort=${sort}&order=${order}` : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
          <p className="text-sm text-muted-foreground">{total.toLocaleString()} total articles</p>
        </div>
        <Link href="/admin/articles/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            {isAdmin ? "New Article" : "Request New Article"}
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">ID</TableHead>
              <Suspense><SortableHead column="title">Title</SortableHead></Suspense>
              <Suspense><SortableHead column="writer">Writer</SortableHead></Suspense>
              <Suspense><SortableHead column="topic">Topic</SortableHead></Suspense>
              <TableHead>Issue</TableHead>
              <Suspense><SortableHead column="date">Date</SortableHead></Suspense>
              <Suspense><SortableHead column="status" className="w-20">Status</SortableHead></Suspense>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => {
              const flagIssue =
                article.editorialIssueId ? flagIssueMap.get(article.editorialIssueId) :
                article.introIssueId ? flagIssueMap.get(article.introIssueId) :
                undefined;
              const linkIssue = article.issueLinks[0]?.issue;
              const issue = flagIssue ?? linkIssue;
              const issueRole = article.editorialIssueId
                ? "Editorial"
                : article.introIssueId
                ? "Intro"
                : null;
              return (
              <TableRow key={article.id}>
                <TableCell
                  className="text-muted-foreground text-xs font-mono"
                  title={article.oldId != null ? `Legacy ID: ${article.oldId}` : "No legacy ID"}
                >
                  {article.id}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="text-sm font-medium hover:text-primary transition-colors line-clamp-1"
                  >
                    {article.title}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{article.writer.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{article.topic.title}</TableCell>
                <TableCell className="text-xs">
                  {issue ? (
                    <span className="text-muted-foreground">
                      {issue.title}
                      {issueRole && (
                        <span className="ml-1 inline-block rounded bg-primary/10 px-1 py-0.5 text-[10px] font-medium uppercase text-primary">
                          {issueRole}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="italic text-amber-600 dark:text-amber-400">Unattached</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {article.dateAdded?.toLocaleDateString() ?? "—"}
                </TableCell>
                <TableCell>
                  <span className={`mr-tag ${article.display ? "mr-tag-success" : "mr-tag-danger"}`}>
                    {article.display ? "Visible" : "Hidden"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <a href={`/articles/${article.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <Link href={`/admin/articles/${article.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <ToggleDisplayButton id={article.id} type="article" />
                    <DeleteButton id={article.id} type="article" title={article.title} isTeam={!isAdmin} />
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link href={`/admin/articles?page=${page - 1}${sortQuery}`} className="text-sm text-primary hover:underline">
              &larr; Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/articles?page=${page + 1}${sortQuery}`} className="text-sm text-primary hover:underline">
              Next &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
