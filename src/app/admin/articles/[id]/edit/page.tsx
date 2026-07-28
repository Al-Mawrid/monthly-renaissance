import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { PendingLink } from "@/components/ui/pending-link";
import { ArticleEditForm } from "./form";

export const dynamic = "force-dynamic";

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

  const [article, topics, writers, issues, articleLink] = await Promise.all([
    prisma.article.findUnique({
      where: { id: articleId },
      include: { topic: true, writer: true },
    }),
    prisma.topic.findMany({ orderBy: { title: "asc" } }),
    prisma.writer.findMany({ orderBy: { name: "asc" } }),
    prisma.issue.findMany({
      orderBy: [{ issueDate: "desc" }, { id: "desc" }],
      select: { id: true, title: true, volumeNumber: true, issueNumber: true, issueDate: true },
    }),
    prisma.articleIssueLink.findFirst({
      where: { articleId },
      select: { issueId: true },
    }),
  ]);

  if (!article) notFound();

  let initialIssueId: number | null = null;
  let initialRoleInIssue: "regular" | "editorial" | "intro" = "regular";
  if (article.introIssueId) {
    initialIssueId = article.introIssueId;
    initialRoleInIssue = "intro";
  } else if (article.editorialIssueId) {
    initialIssueId = article.editorialIssueId;
    initialRoleInIssue = "editorial";
  } else if (articleLink) {
    initialIssueId = articleLink.issueId;
    initialRoleInIssue = "regular";
  }

  return (
    <div>
      <PendingLink
        href="/admin/articles"
        icon={<ArrowLeft aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />}
        iconClassName="mr-1.5 h-3.5 w-3.5"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4 -ml-2 text-muted-foreground")}
      >
        Back to Articles
      </PendingLink>

      <h1 className="text-2xl font-bold tracking-tight mb-6">
        {isAdmin ? "Edit Article" : "Request Article Edit"}
      </h1>

      <ArticleEditForm
        article={{
          id: article.id,
          slug: article.slug,
          title: article.title,
          bodyHtml: article.bodyHtml,
          topicId: article.topicId,
          writerId: article.writerId,
          translatorId: article.translatorId,
          display: article.display,
        }}
        topics={topics}
        writers={writers}
        issues={issues.map((i) => ({
          id: i.id,
          title: i.title,
          volumeNumber: i.volumeNumber,
          issueNumber: i.issueNumber,
          issueDate: i.issueDate ? i.issueDate.toISOString() : null,
        }))}
        initialIssueId={initialIssueId}
        initialRoleInIssue={initialRoleInIssue}
        isTeam={!isAdmin}
      />
    </div>
  );
}
