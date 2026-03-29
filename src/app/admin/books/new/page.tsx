import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { BookCreateForm } from "./form";

export default async function NewBookPage() {
  const session = await auth();
  const isAdmin = canManageContent(session!.user.role);

  const writers = await prisma.writer.findMany({ orderBy: { name: "asc" } });

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
        {isAdmin ? "New Book" : "Request New Book"}
      </h1>
      <BookCreateForm writers={writers} isTeam={!isAdmin} />
    </div>
  );
}
