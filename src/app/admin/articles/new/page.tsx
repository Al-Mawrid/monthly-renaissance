import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { ArticleCreateForm } from "./form";

export default async function NewArticlePage() {
  const session = await auth();
  const isAdmin = canManageContent(session!.user.role);

  const [topics, writers] = await Promise.all([
    prisma.topic.findMany({ orderBy: { title: "asc" } }),
    prisma.writer.findMany({ orderBy: { name: "asc" } }),
  ]);

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
        {isAdmin ? "New Article" : "Request New Article"}
      </h1>

      <ArticleCreateForm topics={topics} writers={writers} isTeam={!isAdmin} />
    </div>
  );
}
