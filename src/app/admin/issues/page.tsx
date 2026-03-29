import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { ToggleDisplayButton } from "../articles/toggle-button";
import { DeleteButton } from "../delete-button";
import { SortableHead } from "../sortable-head";
import { issueOrderBy, parseSort } from "../sort-utils";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default async function AdminIssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; order?: string }>;
}) {
  const params = await searchParams;
  const { sort, order } = parseSort(params);
  const session = await auth();
  const isAdmin = canManageContent(session!.user.role);

  const issues = await prisma.issue.findMany({
    orderBy: issueOrderBy(sort, order),
    include: { _count: { select: { articleLinks: true, queryLinks: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Issues</h1>
          <p className="text-sm text-muted-foreground">{issues.length} total issues</p>
        </div>
        <Link href="/admin/issues/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            {isAdmin ? "New Issue" : "Request New Issue"}
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">ID</TableHead>
              <Suspense><SortableHead column="title">Title</SortableHead></Suspense>
              <Suspense><SortableHead column="volume">Volume</SortableHead></Suspense>
              <Suspense><SortableHead column="issueNumber">Issue #</SortableHead></Suspense>
              <Suspense><SortableHead column="date">Date</SortableHead></Suspense>
              <TableHead>Items</TableHead>
              <Suspense><SortableHead column="status" className="w-20">Status</SortableHead></Suspense>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell className="text-muted-foreground text-xs">{issue.oldId}</TableCell>
                <TableCell className="text-sm font-medium">{issue.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{issue.volumeNumber ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{issue.issueNumber ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {issue.issueDate?.toLocaleDateString() ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {issue._count.articleLinks + issue._count.queryLinks}
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${issue.display ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {issue.display ? "Visible" : "Hidden"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <a href={`/issues/${issue.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <Link href={`/admin/issues/${issue.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <ToggleDisplayButton id={issue.id} type="issue" />
                    <DeleteButton id={issue.id} type="issue" title={issue.title} isTeam={!isAdmin} />
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
