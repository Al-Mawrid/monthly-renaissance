import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { ToggleDisplayButton } from "../articles/toggle-button";
import { DeleteButton } from "../delete-button";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SortableHead } from "../sortable-head";
import { queryOrderBy, parseSort } from "../sort-utils";

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
                  <span className={`text-xs px-2 py-0.5 rounded-full ${q.display ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
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
                    <Link href={`/admin/queries/${q.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
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
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && <Link href={`/admin/queries?page=${page - 1}${sortQuery}`} className="text-sm text-primary hover:underline">&larr; Previous</Link>}
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={`/admin/queries?page=${page + 1}${sortQuery}`} className="text-sm text-primary hover:underline">Next &rarr;</Link>}
        </div>
      )}
    </div>
  );
}
