import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ToggleDisplayButton } from "../articles/toggle-button";
import { SortableHead } from "../sortable-head";
import { topicOrderBy, parseSort } from "../sort-utils";
import { Pencil, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PendingLink } from "@/components/ui/pending-link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminTopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; order?: string }>;
}) {
  const params = await searchParams;
  const { sort, order } = parseSort(params);
  await auth();

  const topics = await prisma.topic.findMany({
    orderBy: topicOrderBy(sort, order),
    include: { _count: { select: { articles: true, queries: true } } },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Topics</h1>
        <p className="text-sm text-muted-foreground">{topics.length} total topics</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">ID</TableHead>
              <Suspense><SortableHead column="title">Title</SortableHead></Suspense>
              <Suspense><SortableHead column="ranking">Ranking</SortableHead></Suspense>
              <TableHead>Articles</TableHead>
              <TableHead>Queries</TableHead>
              <Suspense><SortableHead column="status" className="w-20">Displayed</SortableHead></Suspense>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-muted-foreground text-xs">{t.oldId}</TableCell>
                <TableCell className="text-sm font-medium">{t.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{t.ranking}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{t._count.articles}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{t._count.queries}</TableCell>
                <TableCell>
                  <span className={`mr-tag ${t.displayInList ? "mr-tag-success" : "mr-tag-danger"}`}>
                    {t.displayInList ? "Yes" : "No"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <a href={`/articles/topics/${t.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <PendingLink
                      href={`/admin/topics/${t.id}/edit`}
                      icon={<Pencil aria-hidden="true" className="h-3.5 w-3.5" />}
                      iconClassName="h-3.5 w-3.5"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-sm transition-all hover:bg-muted hover:text-foreground"
                      aria-label="Edit topic"
                    />
                    <ToggleDisplayButton id={t.id} type="topic" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
