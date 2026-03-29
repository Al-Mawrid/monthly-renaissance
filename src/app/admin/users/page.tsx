import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RoleSelect } from "./role-select";
import { ToggleActiveButton } from "./toggle-active";
import { SortableHead } from "../sortable-head";
import { userOrderBy, parseSort } from "../sort-utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; order?: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/unauthorized");

  const params = await searchParams;
  const { sort, order } = parseSort(params);

  const users = await prisma.user.findMany({
    orderBy: userOrderBy(sort, order),
    include: {
      writer: { select: { id: true, name: true, _count: { select: { articles: true, queries: true } } } },
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">{users.length} registered users</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <Suspense><SortableHead column="name">Name</SortableHead></Suspense>
              <Suspense><SortableHead column="email">Email</SortableHead></Suspense>
              <Suspense><SortableHead column="role">Role</SortableHead></Suspense>
              <TableHead>Linked Writer</TableHead>
              <Suspense><SortableHead column="status">Active</SortableHead></Suspense>
              <Suspense><SortableHead column="joined">Joined</SortableHead></Suspense>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <img src={user.image} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "U"}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium">{user.name ?? "—"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <RoleSelect userId={user.id} currentRole={user.role} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.writer ? (
                    <span>
                      <span className="font-medium text-foreground">{user.writer.name}</span>
                      <span className="text-xs ml-1.5">
                        ({user.writer._count.articles}a / {user.writer._count.queries}q)
                      </span>
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {user.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <ToggleActiveButton userId={user.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
