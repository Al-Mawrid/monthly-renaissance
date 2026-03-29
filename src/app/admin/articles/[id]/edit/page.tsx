import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { ArticleEditForm } from "./form";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const articleId = parseInt(id, 10);
  if (isNaN(articleId)) notFound();

  const session = await auth();
  const isAdmin = canManageContent(session!.user.role);

  const [article, topics, writers] = await Promise.all([
    prisma.article.findUnique({
      where: { id: articleId },
      include: { topic: true, writer: true },
    }),
    prisma.topic.findMany({ orderBy: { title: "asc" } }),
    prisma.writer.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!article) notFound();

  return (
    <div>
      <Link
        href="/admin/articles"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4 -ml-2 text-muted-foreground")}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to Articles
      </Link>

      <h1 className="text-2xl font-bold tracking-tight mb-6">
        {isAdmin ? "Edit Article" : "Request Article Edit"}
      </h1>

      <ArticleEditForm
        article={article}
        topics={topics}
        writers={writers}
        isTeam={!isAdmin}
      />
    </div>
  );
}
