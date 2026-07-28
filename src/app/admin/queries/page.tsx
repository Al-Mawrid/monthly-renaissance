import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { ToggleDisplayButton } from "../articles/toggle-button";
import { DeleteButton } from "../delete-button";
import { Button } from "@/components/ui/button";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { PendingLink } from "@/components/ui/pending-link";
import { Pencil, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SortableHead } from "../sortable-head";
import { queryOrderBy, parseSort } from "../sort-utils";

export const dynamic = "force-dynamic";

export default async function AdminQueriesPage({
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

  const [queries, total] = await Promise.all([
    prisma.queryEntry.findMany({
      orderBy: queryOrderBy(sort, order),
      skip: (page - 1) * perPage,
      take: perPage,
      include: { writer: true, topic: true },
    }),
    prisma.queryEntry.count(),
  ]);

  const totalPages = Math.ceil(total / perPage);
  const sortQuery = sort ? `&sort=${sort}&order=${order}` : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Queries</h1>
          <p className="text-sm text-muted-foreground">{total.toLocaleString()} total queries</p>
        </div>
        <Link href="/admin/queries/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            {isAdmin ? "New Query" : "Request New Query"}
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">ID</TableHead>
              <Suspense>
                <SortableHead column="title">Title</SortableHead>
              </Suspense>
              <Suspense>
                <SortableHead column="writer">Writer</SortableHead>
              </Suspense>
              <Suspense>
                <SortableHead column="topic">Topic</SortableHead>
              </Suspense>
              <Suspense>
                <SortableHead column="date">Date</SortableHead>
              </Suspense>
              <Suspense>
                <SortableHead column="status">Status</SortableHead>
              </Suspense>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queries.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="text-muted-foreground text-xs">{q.oldId}</TableCell>
                <TableCell>
                  <Link
                    href={`/admin/queries/${q.id}/edit`}
                    className="text-sm font-medium hover:text-primary transition-colors line-clamp-1"
                  >
                    {q.title}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{q.writer.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{q.topic.title}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {q.dateAdded?.toLocaleDateString() ?? "—"}
                </TableCell>
                <TableCell>
                  <span className={`mr-tag ${q.display ? "mr-tag-success" : "mr-tag-danger"}`}>
                    {q.display ? "Visible" : "Hidden"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <a href={`/articles/${q.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <PendingLink
                      href={`/admin/queries/${q.id}/edit`}
                      icon={<Pencil aria-hidden="true" className="h-3.5 w-3.5" />}
                      iconClassName="h-3.5 w-3.5"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-sm transition-all hover:bg-muted hover:text-foreground"
                      aria-label="Edit query"
                    />
                    <ToggleDisplayButton id={q.id} type="query" />
                    <DeleteButton id={q.id} type="query" title={q.title} isTeam={!isAdmin} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <PaginationNav
          page={page}
          totalPages={totalPages}
          prevHref={`/admin/queries?page=${page - 1}${sortQuery}`}
          nextHref={`/admin/queries?page=${page + 1}${sortQuery}`}
        />
      )}
    </div>
  );
}
