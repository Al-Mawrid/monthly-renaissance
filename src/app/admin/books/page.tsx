import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { ToggleDisplayButton } from "../articles/toggle-button";
import { DeleteButton } from "../delete-button";
import { SortableHead } from "../sortable-head";
import { bookOrderBy, parseSort } from "../sort-utils";
import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { PendingLink } from "@/components/ui/pending-link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; order?: string }>;
}) {
  const params = await searchParams;
  const { sort, order } = parseSort(params);
  const session = await auth();
  const isAdmin = canManageContent(session!.user.role);

  const books = await prisma.book.findMany({
    orderBy: bookOrderBy(sort, order),
    include: { writer: true, translator: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Books & E-Books</h1>
          <p className="text-sm text-muted-foreground">{books.length} total books</p>
        </div>
        <Link href="/admin/books/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            {isAdmin ? "New Book" : "Request New Book"}
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">ID</TableHead>
              <Suspense><SortableHead column="title">Title</SortableHead></Suspense>
              <Suspense><SortableHead column="writer">Writer</SortableHead></Suspense>
              <TableHead>Translator</TableHead>
              <Suspense><SortableHead column="type">Type</SortableHead></Suspense>
              <TableHead>File</TableHead>
              <Suspense><SortableHead column="status" className="w-20">Status</SortableHead></Suspense>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="text-muted-foreground text-xs">{b.oldId}</TableCell>
                <TableCell className="text-sm font-medium">{b.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{b.writer?.name ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{b.translator?.name ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {b.isBook ? "Book" : b.isEbook ? "E-Book" : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-32">{b.fileName}</TableCell>
                <TableCell>
                  <span className={`mr-tag ${b.display ? "mr-tag-success" : "mr-tag-danger"}`}>
                    {b.display ? "Visible" : "Hidden"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <PendingLink
                      href={`/admin/books/${b.id}/edit`}
                      icon={<Pencil aria-hidden="true" className="h-3.5 w-3.5" />}
                      iconClassName="h-3.5 w-3.5"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-sm transition-all hover:bg-muted hover:text-foreground"
                      aria-label="Edit book"
                    />
                    <ToggleDisplayButton id={b.id} type="book" />
                    <DeleteButton id={b.id} type="book" title={b.title} isTeam={!isAdmin} />
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
