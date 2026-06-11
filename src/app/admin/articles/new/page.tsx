import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { ArticleCreateForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const session = await auth();
  const isAdmin = canManageContent(session!.user.role);

  const [topics, writers, issues] = await Promise.all([
    prisma.topic.findMany({ orderBy: { title: "asc" } }),
    prisma.writer.findMany({ orderBy: { name: "asc" } }),
    prisma.issue.findMany({
      orderBy: [{ issueDate: "desc" }, { id: "desc" }],
      select: { id: true, title: true, volumeNumber: true, issueNumber: true, issueDate: true },
    }),
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

      <ArticleCreateForm
        topics={topics}
        writers={writers}
        issues={issues.map((i) => ({
          id: i.id,
          title: i.title,
          volumeNumber: i.volumeNumber,
          issueNumber: i.issueNumber,
          issueDate: i.issueDate ? i.issueDate.toISOString() : null,
        }))}
        isTeam={!isAdmin}
      />
    </div>
  );
}
