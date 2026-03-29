"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditContent, canManageUsers, canManageContent } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import type { Role, ChangeAction, Prisma } from "@prisma/client";

// ─── Auth Helper ────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");
  return session;
}

// ─── Change Request Helper ──────────────────────────────────
// TEAM users create change requests; ADMIN users apply directly.

async function createChangeRequest(
  userId: string,
  action: ChangeAction,
  entityType: string,
  entityId: number | null,
  data: Record<string, unknown> | null,
  note?: string,
) {
  await prisma.changeRequest.create({
    data: {
      action,
      entityType,
      entityId,
      data: (data ?? undefined) as Prisma.InputJsonValue | undefined,
      requestedById: userId,
      note,
    },
  });
  revalidatePath("/admin/change-requests");
}

type MutationResult = { applied: true } | { requested: true };

// ─── Article Actions ─────────────────────────────────────────

export async function createArticle(data: {
  title: string;
  slug: string;
  bodyHtml: string;
  topicId: number;
  writerId: number;
  display?: boolean;
}): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    await prisma.article.create({
      data: {
        oldId: 0,
        title: data.title,
        slug: data.slug,
        bodyHtml: data.bodyHtml,
        topicId: data.topicId,
        writerId: data.writerId,
        display: data.display ?? true,
        dateAdded: new Date(),
      },
    });
    revalidatePath("/admin/articles");
    return { applied: true };
  }

  await createChangeRequest(session.user.id, "CREATE", "article", null, data);
  return { requested: true };
}

export async function updateArticle(id: number, data: {
  title?: string;
  bodyHtml?: string;
  topicId?: number;
  writerId?: number;
  display?: boolean;
}): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    await prisma.article.update({ where: { id }, data });
    revalidatePath("/admin/articles");
    revalidatePath(`/admin/articles/${id}/edit`);
    return { applied: true };
  }

  await createChangeRequest(session.user.id, "UPDATE", "article", id, data);
  return { requested: true };
}

export async function deleteArticle(id: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    // Delete issue links first, then the article
    await prisma.articleIssueLink.deleteMany({ where: { articleId: id } });
    await prisma.article.delete({ where: { id } });
    revalidatePath("/admin/articles");
    return { applied: true };
  }

  await createChangeRequest(session.user.id, "DELETE", "article", id, null);
  return { requested: true };
}

export async function toggleArticleDisplay(id: number) {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  const article = await prisma.article.findUnique({ where: { id }, select: { display: true } });
  if (!article) throw new Error("Not found");

  if (canManageContent(session.user.role)) {
    await prisma.article.update({ where: { id }, data: { display: !article.display } });
    revalidatePath("/admin/articles");
    return;
  }

  await createChangeRequest(
    session.user.id, "UPDATE", "article", id,
    { display: !article.display },
    `Toggle display to ${!article.display ? "visible" : "hidden"}`,
  );
}

// ─── Query Actions ───────────────────────────────────────────

export async function createQuery(data: {
  title: string;
  slug: string;
  questionHtml: string;
  answerHtml?: string;
  questioner?: string;
  topicId: number;
  writerId: number;
  display?: boolean;
}): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    await prisma.queryEntry.create({
      data: {
        oldId: 0,
        title: data.title,
        slug: data.slug,
        questionHtml: data.questionHtml,
        answerHtml: data.answerHtml ?? "",
        questioner: data.questioner,
        topicId: data.topicId,
        writerId: data.writerId,
        display: data.display ?? true,
        dateAdded: new Date(),
      },
    });
    revalidatePath("/admin/queries");
    return { applied: true };
  }

  await createChangeRequest(session.user.id, "CREATE", "query", null, data);
  return { requested: true };
}

export async function updateQuery(id: number, data: {
  title?: string;
  questionHtml?: string;
  answerHtml?: string;
  questioner?: string;
  topicId?: number;
  writerId?: number;
  display?: boolean;
}): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    await prisma.queryEntry.update({ where: { id }, data });
    revalidatePath("/admin/queries");
    return { applied: true };
  }

  await createChangeRequest(session.user.id, "UPDATE", "query", id, data);
  return { requested: true };
}

export async function deleteQuery(id: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    await prisma.queryIssueLink.deleteMany({ where: { queryId: id } });
    await prisma.queryEntry.delete({ where: { id } });
    revalidatePath("/admin/queries");
    return { applied: true };
  }

  await createChangeRequest(session.user.id, "DELETE", "query", id, null);
  return { requested: true };
}

export async function toggleQueryDisplay(id: number) {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  const query = await prisma.queryEntry.findUnique({ where: { id }, select: { display: true } });
  if (!query) throw new Error("Not found");

  if (canManageContent(session.user.role)) {
    await prisma.queryEntry.update({ where: { id }, data: { display: !query.display } });
    revalidatePath("/admin/queries");
    return;
  }

  await createChangeRequest(
    session.user.id, "UPDATE", "query", id,
    { display: !query.display },
    `Toggle display to ${!query.display ? "visible" : "hidden"}`,
  );
}

// ─── Issue Actions ───────────────────────────────────────────

export async function createIssue(data: {
  title: string;
  slug: string;
  volumeNumber?: string;
  issueNumber?: string;
  issueDate?: string;
  display?: boolean;
  isSpecial?: boolean;
}): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    await prisma.issue.create({
      data: {
        oldId: 0,
        title: data.title,
        slug: data.slug,
        volumeNumber: data.volumeNumber,
        issueNumber: data.issueNumber,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        display: data.display ?? true,
        isSpecial: data.isSpecial ?? false,
      },
    });
    revalidatePath("/admin/issues");
    return { applied: true };
  }

  await createChangeRequest(session.user.id, "CREATE", "issue", null, data);
  return { requested: true };
}

export async function updateIssue(id: number, data: {
  title?: string;
  volumeNumber?: string;
  issueNumber?: string;
  issueDate?: string;
  display?: boolean;
  isSpecial?: boolean;
}): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.issueDate) updateData.issueDate = new Date(data.issueDate);
    await prisma.issue.update({ where: { id }, data: updateData });
    revalidatePath("/admin/issues");
    return { applied: true };
  }

  await createChangeRequest(session.user.id, "UPDATE", "issue", id, data);
  return { requested: true };
}

export async function deleteIssue(id: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    await prisma.articleIssueLink.deleteMany({ where: { issueId: id } });
    await prisma.queryIssueLink.deleteMany({ where: { issueId: id } });
    await prisma.issue.delete({ where: { id } });
    revalidatePath("/admin/issues");
    return { applied: true };
  }

  await createChangeRequest(session.user.id, "DELETE", "issue", id, null);
  return { requested: true };
}

export async function toggleIssueDisplay(id: number) {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  const issue = await prisma.issue.findUnique({ where: { id }, select: { display: true } });
  if (!issue) throw new Error("Not found");

  if (canManageContent(session.user.role)) {
    await prisma.issue.update({ where: { id }, data: { display: !issue.display } });
    revalidatePath("/admin/issues");
    return;
  }

  await createChangeRequest(
    session.user.id, "UPDATE", "issue", id,
    { display: !issue.display },
    `Toggle display to ${!issue.display ? "visible" : "hidden"}`,
  );
}

// ─── Writer Actions ──────────────────────────────────────────

export async function updateWriter(id: number, data: {
  name?: string;
  email?: string;
  displayOnSite?: boolean;
  isQueryWriter?: boolean;
}): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    await prisma.writer.update({ where: { id }, data });
    revalidatePath("/admin/writers");
    return { applied: true };
  }

  await createChangeRequest(session.user.id, "UPDATE", "writer", id, data);
  return { requested: true };
}

export async function toggleWriterDisplay(id: number) {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  const writer = await prisma.writer.findUnique({ where: { id }, select: { displayOnSite: true } });
  if (!writer) throw new Error("Not found");

  if (canManageContent(session.user.role)) {
    await prisma.writer.update({ where: { id }, data: { displayOnSite: !writer.displayOnSite } });
    revalidatePath("/admin/writers");
    return;
  }

  await createChangeRequest(
    session.user.id, "UPDATE", "writer", id,
    { displayOnSite: !writer.displayOnSite },
    `Toggle display to ${!writer.displayOnSite ? "visible" : "hidden"}`,
  );
}

// ─── Topic Actions ───────────────────────────────────────────

export async function updateTopic(id: number, data: {
  title?: string;
  ranking?: number;
  display?: boolean;
  displayInList?: boolean;
}): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    await prisma.topic.update({ where: { id }, data });
    revalidatePath("/admin/topics");
    return { applied: true };
  }

  await createChangeRequest(session.user.id, "UPDATE", "topic", id, data);
  return { requested: true };
}

export async function toggleTopicDisplay(id: number) {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  const topic = await prisma.topic.findUnique({ where: { id }, select: { displayInList: true } });
  if (!topic) throw new Error("Not found");

  if (canManageContent(session.user.role)) {
    await prisma.topic.update({ where: { id }, data: { displayInList: !topic.displayInList } });
    revalidatePath("/admin/topics");
    return;
  }

  await createChangeRequest(
    session.user.id, "UPDATE", "topic", id,
    { displayInList: !topic.displayInList },
    `Toggle display to ${!topic.displayInList ? "visible" : "hidden"}`,
  );
}

// ─── Book Actions ────────────────────────────────────────────

export async function createBook(data: {
  title: string;
  slug: string;
  fileName: string;
  writerId?: number;
  translatorId?: number;
  isEbook?: boolean;
  isBook?: boolean;
  display?: boolean;
}): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    await prisma.book.create({
      data: {
        oldId: 0,
        title: data.title,
        slug: data.slug,
        fileName: data.fileName,
        writerId: data.writerId ?? null,
        translatorId: data.translatorId ?? null,
        isEbook: data.isEbook ?? false,
        isBook: data.isBook ?? false,
        display: data.display ?? true,
        postDate: new Date(),
      },
    });
    revalidatePath("/admin/books");
    return { applied: true };
  }

  await createChangeRequest(session.user.id, "CREATE", "book", null, data);
  return { requested: true };
}

export async function updateBook(id: number, data: {
  title?: string;
  fileName?: string;
  writerId?: number | null;
  translatorId?: number | null;
  isEbook?: boolean;
  isBook?: boolean;
  display?: boolean;
}): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    await prisma.book.update({ where: { id }, data });
    revalidatePath("/admin/books");
    return { applied: true };
  }

  await createChangeRequest(session.user.id, "UPDATE", "book", id, data);
  return { requested: true };
}

export async function deleteBook(id: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    await prisma.book.delete({ where: { id } });
    revalidatePath("/admin/books");
    return { applied: true };
  }

  await createChangeRequest(session.user.id, "DELETE", "book", id, null);
  return { requested: true };
}

export async function toggleBookDisplay(id: number) {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  const book = await prisma.book.findUnique({ where: { id }, select: { display: true } });
  if (!book) throw new Error("Not found");

  if (canManageContent(session.user.role)) {
    await prisma.book.update({ where: { id }, data: { display: !book.display } });
    revalidatePath("/admin/books");
    return;
  }

  await createChangeRequest(
    session.user.id, "UPDATE", "book", id,
    { display: !book.display },
    `Toggle display to ${!book.display ? "visible" : "hidden"}`,
  );
}

// ─── Writer-User Assignment (Admin Only) ─────────────────────

export async function assignWriterToUser(writerId: number, userId: string | null) {
  const session = await requireAuth();
  if (!canManageUsers(session.user.role)) throw new Error("Forbidden");

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) throw new Error("User not found");
    if (user.role !== "TEAM" && user.role !== "ADMIN") {
      throw new Error("Can only assign writers to TEAM or ADMIN users");
    }

    const existing = await prisma.writer.findUnique({ where: { userId }, select: { id: true } });
    if (existing && existing.id !== writerId) {
      throw new Error("User is already assigned to another writer");
    }
  }

  await prisma.writer.update({ where: { id: writerId }, data: { userId } });
  revalidatePath("/admin/writers");
  revalidatePath("/admin/users");
}

// ─── User Actions (Admin Only) ───────────────────────────────

export async function updateUserRole(userId: string, role: Role) {
  const session = await requireAuth();
  if (!canManageUsers(session.user.role)) throw new Error("Forbidden");

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}

export async function toggleUserActive(userId: string) {
  const session = await requireAuth();
  if (!canManageUsers(session.user.role)) throw new Error("Forbidden");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
  if (!user) throw new Error("Not found");

  await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
  revalidatePath("/admin/users");
}

// ─── Change Request Review Actions (Admin Only) ─────────────

export async function approveChangeRequest(requestId: number) {
  const session = await requireAuth();
  if (!canManageContent(session.user.role)) throw new Error("Forbidden");

  const cr = await prisma.changeRequest.findUnique({ where: { id: requestId } });
  if (!cr || cr.status !== "PENDING") throw new Error("Invalid change request");

  const data = cr.data as Record<string, unknown> | null;

  // Apply the change
  switch (cr.entityType) {
    case "article":
      if (cr.action === "CREATE" && data) {
        await prisma.article.create({
          data: {
            oldId: 0,
            title: data.title as string,
            slug: data.slug as string,
            bodyHtml: data.bodyHtml as string,
            topicId: data.topicId as number,
            writerId: data.writerId as number,
            display: (data.display as boolean) ?? true,
            dateAdded: new Date(),
          },
        });
      } else if (cr.action === "UPDATE" && cr.entityId && data) {
        await prisma.article.update({ where: { id: cr.entityId }, data });
      } else if (cr.action === "DELETE" && cr.entityId) {
        await prisma.articleIssueLink.deleteMany({ where: { articleId: cr.entityId } });
        await prisma.article.delete({ where: { id: cr.entityId } });
      }
      revalidatePath("/admin/articles");
      break;

    case "query":
      if (cr.action === "CREATE" && data) {
        await prisma.queryEntry.create({
          data: {
            oldId: 0,
            title: data.title as string,
            slug: data.slug as string,
            questionHtml: data.questionHtml as string,
            answerHtml: (data.answerHtml as string) ?? "",
            questioner: data.questioner as string | undefined,
            topicId: data.topicId as number,
            writerId: data.writerId as number,
            display: (data.display as boolean) ?? true,
            dateAdded: new Date(),
          },
        });
      } else if (cr.action === "UPDATE" && cr.entityId && data) {
        await prisma.queryEntry.update({ where: { id: cr.entityId }, data });
      } else if (cr.action === "DELETE" && cr.entityId) {
        await prisma.queryIssueLink.deleteMany({ where: { queryId: cr.entityId } });
        await prisma.queryEntry.delete({ where: { id: cr.entityId } });
      }
      revalidatePath("/admin/queries");
      break;

    case "issue":
      if (cr.action === "CREATE" && data) {
        await prisma.issue.create({
          data: {
            oldId: 0,
            title: data.title as string,
            slug: data.slug as string,
            volumeNumber: data.volumeNumber as string | undefined,
            issueNumber: data.issueNumber as string | undefined,
            issueDate: data.issueDate ? new Date(data.issueDate as string) : null,
            display: (data.display as boolean) ?? true,
            isSpecial: (data.isSpecial as boolean) ?? false,
          },
        });
      } else if (cr.action === "UPDATE" && cr.entityId && data) {
        const updateData: Record<string, unknown> = { ...data };
        if (data.issueDate) updateData.issueDate = new Date(data.issueDate as string);
        await prisma.issue.update({ where: { id: cr.entityId }, data: updateData });
      } else if (cr.action === "DELETE" && cr.entityId) {
        await prisma.articleIssueLink.deleteMany({ where: { issueId: cr.entityId } });
        await prisma.queryIssueLink.deleteMany({ where: { issueId: cr.entityId } });
        await prisma.issue.delete({ where: { id: cr.entityId } });
      }
      revalidatePath("/admin/issues");
      break;

    case "writer":
      if (cr.action === "UPDATE" && cr.entityId && data) {
        await prisma.writer.update({ where: { id: cr.entityId }, data });
      }
      revalidatePath("/admin/writers");
      break;

    case "topic":
      if (cr.action === "UPDATE" && cr.entityId && data) {
        await prisma.topic.update({ where: { id: cr.entityId }, data });
      }
      revalidatePath("/admin/topics");
      break;

    case "book":
      if (cr.action === "CREATE" && data) {
        await prisma.book.create({
          data: {
            oldId: 0,
            title: data.title as string,
            slug: data.slug as string,
            fileName: data.fileName as string,
            writerId: (data.writerId as number) ?? null,
            translatorId: (data.translatorId as number) ?? null,
            isEbook: (data.isEbook as boolean) ?? false,
            isBook: (data.isBook as boolean) ?? false,
            display: (data.display as boolean) ?? true,
            postDate: new Date(),
          },
        });
      } else if (cr.action === "UPDATE" && cr.entityId && data) {
        await prisma.book.update({ where: { id: cr.entityId }, data });
      } else if (cr.action === "DELETE" && cr.entityId) {
        await prisma.book.delete({ where: { id: cr.entityId } });
      }
      revalidatePath("/admin/books");
      break;
  }

  // Mark as approved
  await prisma.changeRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });
  revalidatePath("/admin/change-requests");
}

export async function rejectChangeRequest(requestId: number, reviewNote?: string) {
  const session = await requireAuth();
  if (!canManageContent(session.user.role)) throw new Error("Forbidden");

  const cr = await prisma.changeRequest.findUnique({ where: { id: requestId } });
  if (!cr || cr.status !== "PENDING") throw new Error("Invalid change request");

  await prisma.changeRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewNote,
    },
  });
  revalidatePath("/admin/change-requests");
}
