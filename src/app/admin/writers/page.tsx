import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ToggleDisplayButton } from "../articles/toggle-button";
import { AssignUserSelect } from "./assign-user-select";
import { SortableHead } from "../sortable-head";
import { writerOrderBy, parseSort } from "../sort-utils";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default async function AdminWritersPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; order?: string }>;
}) {
  const params = await searchParams;
  const { sort, order } = parseSort(params);
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const [writers, assignableUsers] = await Promise.all([
    prisma.writer.findMany({
      orderBy: writerOrderBy(sort, order),
      include: {
        _count: { select: { articles: true, queries: true } },
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    isAdmin
      ? prisma.user.findMany({
          where: { role: { in: ["TEAM", "ADMIN"] }, isActive: true },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : [],
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Writers</h1>
        <p className="text-sm text-muted-foreground">{writers.length} total writers</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">ID</TableHead>
              <Suspense><SortableHead column="name">Name</SortableHead></Suspense>
              <Suspense><SortableHead column="email">Email</SortableHead></Suspense>
              <TableHead>Assigned User</TableHead>
              <TableHead>Articles</TableHead>
              <TableHead>Queries</TableHead>
              <TableHead>Query Writer</TableHead>
              <Suspense><SortableHead column="status" className="w-20">Displayed</SortableHead></Suspense>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {writers.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="text-muted-foreground text-xs">{w.oldId}</TableCell>
                <TableCell className="text-sm font-medium">{w.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{w.email ?? "—"}</TableCell>
                <TableCell>
                  {isAdmin ? (
                    <AssignUserSelect
                      writerId={w.id}
                      currentUserId={w.userId}
                      users={assignableUsers}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {w.user ? (
                        <span className="flex items-center gap-1.5">
                          {w.user.image ? (
                            <img src={w.user.image} alt="" className="h-5 w-5 rounded-full" />
                          ) : null}
                          {w.user.name ?? w.user.email}
                        </span>
                      ) : (
                        "Unassigned"
                      )}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{w._count.articles}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{w._count.queries}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{w.isQueryWriter ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${w.displayOnSite ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {w.displayOnSite ? "Yes" : "No"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <a href={`/articles/writers/${w.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <ToggleDisplayButton id={w.id} type="writer" />
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
