import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { BookEditForm } from "./form";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookId = parseInt(id, 10);
  if (isNaN(bookId)) notFound();

  const session = await auth();
  const isAdmin = canManageContent(session!.user.role);

  const [book, writers] = await Promise.all([
    prisma.book.findUnique({ where: { id: bookId } }),
    prisma.writer.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!book) notFound();

  return (
    <div>
      <Link
        href="/admin/books"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4 -ml-2 text-muted-foreground")}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to Books
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-6">
        {isAdmin ? "Edit Book" : "Request Book Edit"}
      </h1>
      <BookEditForm book={book} writers={writers} isTeam={!isAdmin} />
    </div>
  );
}
