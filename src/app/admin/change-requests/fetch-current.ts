import { prisma } from "@/lib/db";

export async function fetchCurrentEntity(
  entityType: string,
  entityId: number | null,
): Promise<Record<string, unknown> | null> {
  if (!entityId) return null;

  switch (entityType) {
    case "article": {
      const row = await prisma.article.findUnique({
        where: { id: entityId },
        include: { issueLinks: { select: { issueId: true }, take: 1 } },
      });
      if (!row) return null;
      const inferredRole = row.isEditorial
        ? "editorial"
        : row.isIssueIntro
          ? "intro"
          : "regular";
      const inferredIssueId =
        row.editorialIssueId ??
        row.introIssueId ??
        row.issueLinks[0]?.issueId ??
        null;
      return {
        title: row.title,
        slug: row.slug,
        bodyHtml: row.bodyHtml,
        topicId: row.topicId,
        writerId: row.writerId,
        translatorId: row.translatorId,
        issueId: inferredIssueId,
        roleInIssue: inferredRole,
        display: row.display,
        isImportant: row.isImportant,
      };
    }
    case "query": {
      const row = await prisma.queryEntry.findUnique({ where: { id: entityId } });
      if (!row) return null;
      return {
        title: row.title,
        slug: row.slug,
        questionHtml: row.questionHtml,
        answerHtml: row.answerHtml,
        questioner: row.questioner,
        questionerEmail: row.questionerEmail,
        topicId: row.topicId,
        writerId: row.writerId,
        display: row.display,
        isImportant: row.isImportant,
      };
    }
    case "issue": {
      const row = await prisma.issue.findUnique({ where: { id: entityId } });
      if (!row) return null;
      return {
        title: row.title,
        slug: row.slug,
        volumeNumber: row.volumeNumber,
        issueNumber: row.issueNumber,
        issueDate: row.issueDate ? row.issueDate.toISOString().slice(0, 10) : null,
        display: row.display,
        isSpecial: row.isSpecial,
      };
    }
    case "writer": {
      const row = await prisma.writer.findUnique({ where: { id: entityId } });
      if (!row) return null;
      return {
        name: row.name,
        slug: row.slug,
        email: row.email,
        displayOnSite: row.displayOnSite,
        isQueryWriter: row.isQueryWriter,
      };
    }
    case "topic": {
      const row = await prisma.topic.findUnique({ where: { id: entityId } });
      if (!row) return null;
      return {
        title: row.title,
        slug: row.slug,
        ranking: row.ranking,
        display: row.display,
        displayInList: row.displayInList,
      };
    }
    case "book": {
      const row = await prisma.book.findUnique({ where: { id: entityId } });
      if (!row) return null;
      return {
        title: row.title,
        slug: row.slug,
        fileName: row.fileName,
        writerId: row.writerId,
        translatorId: row.translatorId,
        isEbook: row.isEbook,
        isBook: row.isBook,
        display: row.display,
      };
    }
    default:
      return null;
  }
}
