import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { QueryEditForm } from "./form";

export default async function EditQueryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryId = parseInt(id, 10);
  if (isNaN(queryId)) notFound();

  const session = await auth();
  const isAdmin = canManageContent(session!.user.role);

  const [query, topics, writers] = await Promise.all([
    prisma.queryEntry.findUnique({ where: { id: queryId } }),
    prisma.topic.findMany({ orderBy: { title: "asc" } }),
    prisma.writer.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!query) notFound();

  return (
    <div>
      <Link
        href="/admin/queries"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4 -ml-2 text-muted-foreground")}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to Queries
      </Link>

      <h1 className="text-2xl font-bold tracking-tight mb-6">
        {isAdmin ? "Edit Query" : "Request Query Edit"}
      </h1>

      <QueryEditForm query={query} topics={topics} writers={writers} isTeam={!isAdmin} />
    </div>
  );
}
