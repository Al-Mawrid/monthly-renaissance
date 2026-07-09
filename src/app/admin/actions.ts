"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditContent, canManageUsers, canManageContent } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { Role, ChangeAction } from "@prisma/client";
import {
  parseChangeRequestPayload,
  schemaKindFor,
  type ChangeRequestKind,
} from "@/lib/validation/change-requests";
import { feedbackUpdateSchema } from "@/lib/validation/feedback";
import { sanitizeArticleHtml } from "@/lib/html-sanitize";
import { logError } from "@/lib/log";

// ─── Result Contract ────────────────────────────────────────

export type MutationResult =
  | { ok: true; applied: true }
  | { ok: true; requested: true }
  | { ok: false; error: string };

type RoleInIssue = "regular" | "editorial" | "intro";

// ─── Auth Helper ────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");
  if ((session.user as any)?.isActive === false) throw new Error("Account is inactive");
  if (!session.user?.role) throw new Error("Account is inactive");
  return session;
}

// ─── Prisma Error Mapping ───────────────────────────────────

function mapPrismaError(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | string | undefined) ?? "";
      const targetStr = Array.isArray(target) ? target.join(",") : String(target);
      if (targetStr.includes("slug") && targetStr.includes("article")) {
        return "An article with this slug already exists. Try a different title.";
      }
      if (targetStr.toLowerCase().includes("slug")) {
        return "An item with this slug already exists. Try a different title.";
      }
      return "A record with these values already exists.";
    }
    if (err.code === "P2003") {
      return "Related record not found — refresh and try again.";
    }
    if (err.code === "P2025") {
      return "Record not found — it may have been deleted.";
    }
  }
  return "Something went wrong. Please try again.";
}

function fail(
  err: unknown,
  context?: Record<string, unknown>,
): { ok: false; error: string } {
  const known =
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientValidationError;
  const message = mapPrismaError(err);
  if (!known) {
    logError("admin.action", err, context);
  }
  return { ok: false, error: message };
}

// ─── Change Request Helper ──────────────────────────────────

async function createChangeRequest(
  userId: string,
  action: ChangeAction,
  entityType: string,
  entityId: number | null,
  data: Record<string, unknown> | null,
  note?: string,
): Promise<MutationResult> {
  const kind = schemaKindFor(entityType, action);
  let parsed: Record<string, unknown> | null = null;
  if (kind) {
    const result = parseChangeRequestPayload(kind, data ?? {});
    if (!result.ok) {
      return { ok: false, error: `Invalid request payload: ${result.error}` };
    }
    parsed = result.data;
  } else {
    parsed = data;
  }

  await prisma.changeRequest.create({
    data: {
      action,
      entityType,
      entityId,
      data: (parsed ?? undefined) as Prisma.InputJsonValue | undefined,
      requestedById: userId,
      note,
    },
  });
  revalidatePath("/admin/change-requests");
  return { ok: true, requested: true };
}

// ─── Lookup helpers ─────────────────────────────────────────

async function verifyArticleRefs(
  topicId: number,
  writerId: number,
  translatorId: number | null | undefined,
  issueId: number | null | undefined,
): Promise<string | null> {
  const [topic, writer, translator, issue] = await Promise.all([
    prisma.topic.findUnique({ where: { id: topicId }, select: { id: true } }),
    prisma.writer.findUnique({ where: { id: writerId }, select: { id: true } }),
    translatorId
      ? prisma.writer.findUnique({ where: { id: translatorId }, select: { id: true } })
      : Promise.resolve({ id: -1 }),
    issueId
      ? prisma.issue.findUnique({ where: { id: issueId }, select: { id: true } })
      : Promise.resolve({ id: -1 }),
  ]);
  if (!topic) return "Topic not found.";
  if (!writer) return "Writer not found.";
  if (translatorId && !translator) return "Translator not found.";
  if (issueId && !issue) return "Issue not found.";
  return null;
}

async function findAvailableSlug(base: string): Promise<string> {
  let candidate = base;
  let n = 2;
  while (await prisma.article.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function findAvailableWriterSlug(base: string): Promise<string> {
  const safeBase = base || "writer";
  let candidate = safeBase;
  let n = 2;
  while (await prisma.writer.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${safeBase}-${n}`;
    n += 1;
  }
  return candidate;
}

function revalidateArticle(slug: string | null, issueId: number | null) {
  revalidatePath("/admin/articles");
  revalidatePath("/");
  revalidatePath("/issues");
  if (slug) revalidatePath(`/articles/${slug}`);
  if (issueId) revalidatePath(`/issues/${issueId}`);
}

function revalidateIssuePages(
  current: { slug: string | null; isSpecial: boolean } | null,
  next?: { slug: string | null; isSpecial: boolean },
) {
  revalidatePath("/admin/issues");
  revalidatePath("/issues");
  revalidatePath("/");

  const slugs = new Set<string>();
  if (current?.slug) slugs.add(current.slug);
  if (next?.slug) slugs.add(next.slug);
  for (const slug of slugs) {
    revalidatePath(`/issues/${slug}`);
  }

  if (current?.isSpecial || next?.isSpecial) {
    revalidatePath("/issues/special");
  }
}

// ─── Article Actions ─────────────────────────────────────────

export async function createArticle(data: {
  title: string;
  slug: string;
  bodyHtml: string;
  topicId: number;
  writerId: number;
  translatorId?: number | null;
  issueId: number;
  roleInIssue: RoleInIssue;
  display?: boolean;
}): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    try {
      const refError = await verifyArticleRefs(
        data.topicId,
        data.writerId,
        data.translatorId ?? null,
        data.issueId,
      );
      if (refError) return { ok: false, error: refError };

      const slug = await findAvailableSlug(data.slug);
      const role = data.roleInIssue;
      const bodyHtml = sanitizeArticleHtml(data.bodyHtml);

      const created = await prisma.$transaction(async (tx) => {
        const article = await tx.article.create({
          data: {
            title: data.title,
            slug,
            bodyHtml,
            topicId: data.topicId,
            writerId: data.writerId,
            translatorId: data.translatorId ?? null,
            display: data.display ?? true,
            dateAdded: new Date(),
            editorialIssueId: role === "editorial" ? data.issueId : null,
            isEditorial: role === "editorial",
            introIssueId: role === "intro" ? data.issueId : null,
            isIssueIntro: role === "intro",
          },
        });

        if (role === "regular") {
          await tx.articleIssueLink.create({
            data: { articleId: article.id, issueId: data.issueId },
          });
        }
        return article;
      });

      revalidateArticle(created.slug, data.issueId);
      return { ok: true, applied: true };
    } catch (err) {
      return fail(err, { entityType: "article", action: "CREATE" });
    }
  }

  return createChangeRequest(session.user.id, "CREATE", "article", null, data);
}

export async function updateArticle(
  id: number,
  data: {
    title?: string;
    slug?: string;
    bodyHtml?: string;
    topicId?: number;
    writerId?: number;
    translatorId?: number | null;
    issueId?: number;
    roleInIssue?: RoleInIssue;
    display?: boolean;
  },
): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    try {
      if (data.topicId || data.writerId || data.translatorId || data.issueId) {
        const refError = await verifyArticleRefs(
          data.topicId ?? -1,
          data.writerId ?? -1,
          data.translatorId,
          data.issueId,
        );
        // Only treat as error if the relevant id was provided AND missing
        if (refError) {
          if (
            (data.topicId && refError === "Topic not found.") ||
            (data.writerId && refError === "Writer not found.") ||
            (data.translatorId && refError === "Translator not found.") ||
            (data.issueId && refError === "Issue not found.")
          ) {
            return { ok: false, error: refError };
          }
        }
      }

      const { roleInIssue, issueId, ...rest } = data;
      if (rest.bodyHtml !== undefined) {
        rest.bodyHtml = sanitizeArticleHtml(rest.bodyHtml);
      }

      const updated = await prisma.$transaction(async (tx) => {
        const baseUpdate: Prisma.ArticleUpdateInput = {};
        if (rest.title !== undefined) baseUpdate.title = rest.title;
        if (rest.slug !== undefined) baseUpdate.slug = rest.slug;
        if (rest.bodyHtml !== undefined) baseUpdate.bodyHtml = rest.bodyHtml;
        if (rest.topicId !== undefined) baseUpdate.topic = { connect: { id: rest.topicId } };
        if (rest.writerId !== undefined) baseUpdate.writer = { connect: { id: rest.writerId } };
        if (rest.translatorId !== undefined) {
          baseUpdate.translator =
            rest.translatorId === null ? { disconnect: true } : { connect: { id: rest.translatorId } };
        }
        if (rest.display !== undefined) baseUpdate.display = rest.display;

        if (roleInIssue && issueId) {
          await tx.articleIssueLink.deleteMany({ where: { articleId: id } });
          baseUpdate.editorialIssueId = roleInIssue === "editorial" ? issueId : null;
          baseUpdate.isEditorial = roleInIssue === "editorial";
          baseUpdate.introIssueId = roleInIssue === "intro" ? issueId : null;
          baseUpdate.isIssueIntro = roleInIssue === "intro";
        }

        const article = await tx.article.update({ where: { id }, data: baseUpdate });

        if (roleInIssue === "regular" && issueId) {
          await tx.articleIssueLink.create({
            data: { articleId: id, issueId },
          });
        }
        return article;
      });

      revalidateArticle(updated.slug, issueId ?? null);
      revalidatePath(`/admin/articles/${id}/edit`);
      return { ok: true, applied: true };
    } catch (err) {
      return fail(err, { entityType: "article", entityId: id, action: "UPDATE" });
    }
  }

  return createChangeRequest(session.user.id, "UPDATE", "article", id, data);
}

export async function deleteArticle(id: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    try {
      const existing = await prisma.article.findUnique({
        where: { id },
        select: { slug: true, issueLinks: { select: { issueId: true } } },
      });
      await prisma.$transaction([
        prisma.articleIssueLink.deleteMany({ where: { articleId: id } }),
        prisma.article.delete({ where: { id } }),
      ]);
      const linkedIssueId = existing?.issueLinks[0]?.issueId ?? null;
      revalidateArticle(existing?.slug ?? null, linkedIssueId);
      return { ok: true, applied: true };
    } catch (err) {
      return fail(err, { entityType: "article", entityId: id, action: "DELETE" });
    }
  }

  return createChangeRequest(session.user.id, "DELETE", "article", id, null);
}

export async function toggleArticleDisplay(id: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  try {
    const article = await prisma.article.findUnique({
      where: { id },
      select: { display: true, slug: true, issueLinks: { select: { issueId: true } } },
    });
    if (!article) return { ok: false, error: "Not found" };

    if (canManageContent(session.user.role)) {
      await prisma.article.update({ where: { id }, data: { display: !article.display } });
      revalidateArticle(article.slug, article.issueLinks[0]?.issueId ?? null);
      return { ok: true, applied: true };
    }

    return createChangeRequest(
      session.user.id,
      "UPDATE",
      "article",
      id,
      { display: !article.display },
      `Toggle display to ${!article.display ? "visible" : "hidden"}`,
    );
  } catch (err) {
    return fail(err, { entityType: "article", entityId: id, action: "TOGGLE" });
  }
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
    try {
      await prisma.queryEntry.create({
        data: {
          title: data.title,
          slug: data.slug,
          questionHtml: sanitizeArticleHtml(data.questionHtml),
          answerHtml: data.answerHtml ? sanitizeArticleHtml(data.answerHtml) : "",
          questioner: data.questioner,
          topicId: data.topicId,
          writerId: data.writerId,
          display: data.display ?? true,
          dateAdded: new Date(),
        },
      });
      revalidatePath("/admin/queries");
      revalidatePath("/");
      return { ok: true, applied: true };
    } catch (err) {
      return fail(err, { entityType: "query", action: "CREATE" });
    }
  }

  return createChangeRequest(session.user.id, "CREATE", "query", null, data);
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
    try {
      const sanitized: typeof data = { ...data };
      if (sanitized.questionHtml !== undefined) {
        sanitized.questionHtml = sanitizeArticleHtml(sanitized.questionHtml);
      }
      if (sanitized.answerHtml !== undefined) {
        sanitized.answerHtml = sanitizeArticleHtml(sanitized.answerHtml);
      }
      await prisma.queryEntry.update({ where: { id }, data: sanitized });
      revalidatePath("/admin/queries");
      revalidatePath("/");
      return { ok: true, applied: true };
    } catch (err) {
      return fail(err, { entityType: "query", entityId: id, action: "UPDATE" });
    }
  }

  return createChangeRequest(session.user.id, "UPDATE", "query", id, data);
}

export async function deleteQuery(id: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    try {
      await prisma.$transaction([
        prisma.queryIssueLink.deleteMany({ where: { queryId: id } }),
        prisma.queryEntry.delete({ where: { id } }),
      ]);
      revalidatePath("/admin/queries");
      revalidatePath("/");
      return { ok: true, applied: true };
    } catch (err) {
      return fail(err, { entityType: "query", entityId: id, action: "DELETE" });
    }
  }

  return createChangeRequest(session.user.id, "DELETE", "query", id, null);
}

export async function toggleQueryDisplay(id: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  try {
    const query = await prisma.queryEntry.findUnique({ where: { id }, select: { display: true } });
    if (!query) return { ok: false, error: "Not found" };

    if (canManageContent(session.user.role)) {
      await prisma.queryEntry.update({ where: { id }, data: { display: !query.display } });
      revalidatePath("/admin/queries");
      revalidatePath("/");
      return { ok: true, applied: true };
    }

    return createChangeRequest(
      session.user.id,
      "UPDATE",
      "query",
      id,
      { display: !query.display },
      `Toggle display to ${!query.display ? "visible" : "hidden"}`,
    );
  } catch (err) {
    return fail(err, { entityType: "query", entityId: id, action: "TOGGLE" });
  }
}

// ─── Issue Actions ───────────────────────────────────────────

export async function createIssue(data: {
  title: string;
  description?: string | null;
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
    try {
      await prisma.issue.create({
        data: {
          title: data.title,
          description: normalizeOptionalText(data.description),
          slug: data.slug,
          volumeNumber: data.volumeNumber,
          issueNumber: data.issueNumber,
          issueDate: data.issueDate ? new Date(data.issueDate) : null,
          display: data.display ?? true,
          isSpecial: data.isSpecial ?? false,
        },
      });
      revalidateIssuePages(null, {
        slug: data.slug,
        isSpecial: data.isSpecial ?? false,
      });
      return { ok: true, applied: true };
    } catch (err) {
      return fail(err, { entityType: "issue", action: "CREATE" });
    }
  }

  return createChangeRequest(session.user.id, "CREATE", "issue", null, data);
}

export async function updateIssue(id: number, data: {
  title?: string;
  description?: string | null;
  volumeNumber?: string;
  issueNumber?: string;
  issueDate?: string;
  display?: boolean;
  isSpecial?: boolean;
}): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    try {
      const existing = await prisma.issue.findUnique({
        where: { id },
        select: { slug: true, isSpecial: true },
      });
      if (!existing) return { ok: false, error: "Not found" };

      const updateData: Record<string, unknown> = { ...data };
      if (data.issueDate) updateData.issueDate = new Date(data.issueDate);
      if ("description" in data) {
        updateData.description = normalizeOptionalText(data.description);
      }
      await prisma.issue.update({ where: { id }, data: updateData });
      revalidateIssuePages(existing, {
        slug: existing.slug,
        isSpecial: data.isSpecial ?? existing.isSpecial,
      });
      return { ok: true, applied: true };
    } catch (err) {
      return fail(err, { entityType: "issue", entityId: id, action: "UPDATE" });
    }
  }

  return createChangeRequest(session.user.id, "UPDATE", "issue", id, data);
}

export async function deleteIssue(id: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    try {
      const existing = await prisma.issue.findUnique({
        where: { id },
        select: { slug: true, isSpecial: true },
      });
      if (!existing) return { ok: false, error: "Not found" };

      await prisma.$transaction([
        prisma.articleIssueLink.deleteMany({ where: { issueId: id } }),
        prisma.queryIssueLink.deleteMany({ where: { issueId: id } }),
        prisma.issue.delete({ where: { id } }),
      ]);
      revalidateIssuePages(existing);
      return { ok: true, applied: true };
    } catch (err) {
      return fail(err, { entityType: "issue", entityId: id, action: "DELETE" });
    }
  }

  return createChangeRequest(session.user.id, "DELETE", "issue", id, null);
}

export async function toggleIssueDisplay(id: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  try {
    const issue = await prisma.issue.findUnique({
      where: { id },
      select: { display: true, slug: true, isSpecial: true },
    });
    if (!issue) return { ok: false, error: "Not found" };

    if (canManageContent(session.user.role)) {
      await prisma.issue.update({ where: { id }, data: { display: !issue.display } });
      revalidateIssuePages(issue);
      return { ok: true, applied: true };
    }

    return createChangeRequest(
      session.user.id,
      "UPDATE",
      "issue",
      id,
      { display: !issue.display },
      `Toggle display to ${!issue.display ? "visible" : "hidden"}`,
    );
  } catch (err) {
    return fail(err, { entityType: "issue", entityId: id, action: "TOGGLE" });
  }
}

// ─── Writer Actions ──────────────────────────────────────────

export type CreateWriterResult =
  | { ok: true; applied: true; writer: { id: number; name: string; slug: string; isQueryWriter: boolean } }
  | { ok: true; requested: true }
  | { ok: false; error: string };

export async function createWriter(data: {
  name: string;
  email?: string;
  displayOnSite?: boolean;
  isQueryWriter?: boolean;
}): Promise<CreateWriterResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  const name = data.name?.trim();
  if (!name) return { ok: false, error: "Name is required." };
  const email = data.email?.trim() || undefined;
  const payload = {
    name,
    email,
    displayOnSite: data.displayOnSite ?? true,
    isQueryWriter: data.isQueryWriter ?? false,
  };

  if (canManageContent(session.user.role)) {
    try {
      const slug = await findAvailableWriterSlug(slugify(name));
      const writer = await prisma.writer.create({
        data: { ...payload, slug },
        select: { id: true, name: true, slug: true, isQueryWriter: true },
      });
      revalidatePath("/admin/writers");
      revalidatePath("/");
      return { ok: true, applied: true, writer };
    } catch (err) {
      return fail(err, { entityType: "writer", action: "CREATE" });
    }
  }

  const cr = await createChangeRequest(session.user.id, "CREATE", "writer", null, payload);
  if (cr.ok === false) return cr;
  return { ok: true, requested: true };
}

export async function updateWriter(id: number, data: {
  name?: string;
  email?: string;
  displayOnSite?: boolean;
  isQueryWriter?: boolean;
}): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    try {
      await prisma.writer.update({ where: { id }, data });
      revalidatePath("/admin/writers");
      revalidatePath("/");
      return { ok: true, applied: true };
    } catch (err) {
      return fail(err, { entityType: "writer", entityId: id, action: "UPDATE" });
    }
  }

  return createChangeRequest(session.user.id, "UPDATE", "writer", id, data);
}

export async function toggleWriterDisplay(id: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  try {
    const writer = await prisma.writer.findUnique({
      where: { id },
      select: { displayOnSite: true },
    });
    if (!writer) return { ok: false, error: "Not found" };

    if (canManageContent(session.user.role)) {
      await prisma.writer.update({
        where: { id },
        data: { displayOnSite: !writer.displayOnSite },
      });
      revalidatePath("/admin/writers");
      revalidatePath("/");
      return { ok: true, applied: true };
    }

    return createChangeRequest(
      session.user.id,
      "UPDATE",
      "writer",
      id,
      { displayOnSite: !writer.displayOnSite },
      `Toggle display to ${!writer.displayOnSite ? "visible" : "hidden"}`,
    );
  } catch (err) {
    return fail(err, { entityType: "writer", entityId: id, action: "TOGGLE" });
  }
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
    try {
      await prisma.topic.update({ where: { id }, data });
      revalidatePath("/admin/topics");
      revalidatePath("/");
      return { ok: true, applied: true };
    } catch (err) {
      return fail(err, { entityType: "topic", entityId: id, action: "UPDATE" });
    }
  }

  return createChangeRequest(session.user.id, "UPDATE", "topic", id, data);
}

export async function toggleTopicDisplay(id: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  try {
    const topic = await prisma.topic.findUnique({
      where: { id },
      select: { displayInList: true },
    });
    if (!topic) return { ok: false, error: "Not found" };

    if (canManageContent(session.user.role)) {
      await prisma.topic.update({
        where: { id },
        data: { displayInList: !topic.displayInList },
      });
      revalidatePath("/admin/topics");
      revalidatePath("/");
      return { ok: true, applied: true };
    }

    return createChangeRequest(
      session.user.id,
      "UPDATE",
      "topic",
      id,
      { displayInList: !topic.displayInList },
      `Toggle display to ${!topic.displayInList ? "visible" : "hidden"}`,
    );
  } catch (err) {
    return fail(err, { entityType: "topic", entityId: id, action: "TOGGLE" });
  }
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
    try {
      await prisma.book.create({
        data: {
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
      return { ok: true, applied: true };
    } catch (err) {
      return fail(err, { entityType: "book", action: "CREATE" });
    }
  }

  return createChangeRequest(session.user.id, "CREATE", "book", null, data);
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
    try {
      await prisma.book.update({ where: { id }, data });
      revalidatePath("/admin/books");
      return { ok: true, applied: true };
    } catch (err) {
      return fail(err, { entityType: "book", entityId: id, action: "UPDATE" });
    }
  }

  return createChangeRequest(session.user.id, "UPDATE", "book", id, data);
}

export async function deleteBook(id: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  if (canManageContent(session.user.role)) {
    try {
      await prisma.$transaction([prisma.book.delete({ where: { id } })]);
      revalidatePath("/admin/books");
      return { ok: true, applied: true };
    } catch (err) {
      return fail(err, { entityType: "book", entityId: id, action: "DELETE" });
    }
  }

  return createChangeRequest(session.user.id, "DELETE", "book", id, null);
}

export async function toggleBookDisplay(id: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  try {
    const book = await prisma.book.findUnique({ where: { id }, select: { display: true } });
    if (!book) return { ok: false, error: "Not found" };

    if (canManageContent(session.user.role)) {
      await prisma.book.update({ where: { id }, data: { display: !book.display } });
      revalidatePath("/admin/books");
      return { ok: true, applied: true };
    }

    return createChangeRequest(
      session.user.id,
      "UPDATE",
      "book",
      id,
      { display: !book.display },
      `Toggle display to ${!book.display ? "visible" : "hidden"}`,
    );
  } catch (err) {
    return fail(err, { entityType: "book", entityId: id, action: "TOGGLE" });
  }
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

function parseForApproval(
  entityType: string,
  action: ChangeAction,
  raw: unknown,
):
  | { ok: true; kind: ChangeRequestKind | null; data: Record<string, unknown> }
  | { ok: false; error: string } {
  const kind = schemaKindFor(entityType, action);
  if (!kind) return { ok: true, kind: null, data: (raw ?? {}) as Record<string, unknown> };
  const parsed = parseChangeRequestPayload(kind, raw ?? {});
  if (!parsed.ok) return { ok: false, error: `Invalid stored payload: ${parsed.error}` };
  return { ok: true, kind, data: parsed.data };
}

export async function approveChangeRequest(requestId: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canManageContent(session.user.role)) throw new Error("Forbidden");

  const cr = await prisma.changeRequest.findUnique({ where: { id: requestId } });
  if (!cr || cr.status !== "PENDING") {
    return { ok: false, error: "Invalid change request" };
  }

  const parsed = parseForApproval(cr.entityType, cr.action, cr.data);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const data = parsed.data;

  // Defense in depth: re-sanitize HTML fields at apply time in case the
  // request pre-dates H3 or the sanitizer rules tightened since.
  for (const key of ["bodyHtml", "questionHtml", "answerHtml"] as const) {
    if (typeof data[key] === "string") {
      data[key] = sanitizeArticleHtml(data[key] as string);
    }
  }

  try {
    switch (cr.entityType) {
      case "article":
        if (cr.action === "CREATE") {
          const issueId = data.issueId as number | undefined;
          const role = (data.roleInIssue as RoleInIssue | undefined) ?? "regular";
          if (!issueId) return { ok: false, error: "Article change request missing issueId." };
          const refError = await verifyArticleRefs(
            data.topicId as number,
            data.writerId as number,
            (data.translatorId as number | undefined) ?? null,
            issueId,
          );
          if (refError) return { ok: false, error: refError };
          const slug = await findAvailableSlug(data.slug as string);
          await prisma.$transaction(async (tx) => {
            const article = await tx.article.create({
              data: {
                title: data.title as string,
                slug,
                bodyHtml: data.bodyHtml as string,
                topicId: data.topicId as number,
                writerId: data.writerId as number,
                translatorId: (data.translatorId as number | undefined) ?? null,
                display: (data.display as boolean | undefined) ?? true,
                dateAdded: new Date(),
                editorialIssueId: role === "editorial" ? issueId : null,
                isEditorial: role === "editorial",
                introIssueId: role === "intro" ? issueId : null,
                isIssueIntro: role === "intro",
              },
            });
            if (role === "regular") {
              await tx.articleIssueLink.create({
                data: { articleId: article.id, issueId },
              });
            }
          });
        } else if (cr.action === "UPDATE" && cr.entityId) {
          const { roleInIssue, issueId, ...rest } = data as {
            roleInIssue?: RoleInIssue;
            issueId?: number;
            [k: string]: unknown;
          };
          await prisma.$transaction(async (tx) => {
            if (roleInIssue && issueId) {
              await tx.articleIssueLink.deleteMany({ where: { articleId: cr.entityId! } });
              (rest as Record<string, unknown>).editorialIssueId =
                roleInIssue === "editorial" ? issueId : null;
              (rest as Record<string, unknown>).isEditorial = roleInIssue === "editorial";
              (rest as Record<string, unknown>).introIssueId =
                roleInIssue === "intro" ? issueId : null;
              (rest as Record<string, unknown>).isIssueIntro = roleInIssue === "intro";
            }
            await tx.article.update({ where: { id: cr.entityId! }, data: rest });
            if (roleInIssue === "regular" && issueId) {
              await tx.articleIssueLink.create({
                data: { articleId: cr.entityId!, issueId },
              });
            }
          });
        } else if (cr.action === "DELETE" && cr.entityId) {
          await prisma.$transaction([
            prisma.articleIssueLink.deleteMany({ where: { articleId: cr.entityId } }),
            prisma.article.delete({ where: { id: cr.entityId } }),
          ]);
        }
        revalidatePath("/admin/articles");
        revalidatePath("/");
        revalidatePath("/issues");
        break;

      case "query":
        if (cr.action === "CREATE") {
          await prisma.queryEntry.create({
            data: {
              title: data.title as string,
              slug: data.slug as string,
              questionHtml: data.questionHtml as string,
              answerHtml: (data.answerHtml as string) ?? "",
              questioner: data.questioner as string | undefined,
              topicId: data.topicId as number,
              writerId: data.writerId as number,
              display: (data.display as boolean | undefined) ?? true,
              dateAdded: new Date(),
            },
          });
        } else if (cr.action === "UPDATE" && cr.entityId) {
          await prisma.queryEntry.update({ where: { id: cr.entityId }, data });
        } else if (cr.action === "DELETE" && cr.entityId) {
          await prisma.$transaction([
            prisma.queryIssueLink.deleteMany({ where: { queryId: cr.entityId } }),
            prisma.queryEntry.delete({ where: { id: cr.entityId } }),
          ]);
        }
        revalidatePath("/admin/queries");
        revalidatePath("/");
        break;

      case "issue":
        if (cr.action === "CREATE") {
          await prisma.issue.create({
            data: {
              title: data.title as string,
              description: normalizeOptionalText(data.description as string | undefined),
              slug: data.slug as string,
              volumeNumber: data.volumeNumber as string | undefined,
              issueNumber: data.issueNumber as string | undefined,
              issueDate: data.issueDate ? new Date(data.issueDate as string) : null,
              display: (data.display as boolean | undefined) ?? true,
              isSpecial: (data.isSpecial as boolean | undefined) ?? false,
            },
          });
          revalidateIssuePages(null, {
            slug: data.slug as string,
            isSpecial: (data.isSpecial as boolean | undefined) ?? false,
          });
        } else if (cr.action === "UPDATE" && cr.entityId) {
          const existing = await prisma.issue.findUnique({
            where: { id: cr.entityId },
            select: { slug: true, isSpecial: true },
          });
          if (!existing) return { ok: false, error: "Issue not found." };
          const updateData: Record<string, unknown> = { ...data };
          if (data.issueDate) updateData.issueDate = new Date(data.issueDate as string);
          if ("description" in data) {
            updateData.description = normalizeOptionalText(data.description as string | undefined);
          }
          await prisma.issue.update({ where: { id: cr.entityId }, data: updateData });
          revalidateIssuePages(existing, {
            slug: existing.slug,
            isSpecial: (data.isSpecial as boolean | undefined) ?? existing.isSpecial,
          });
        } else if (cr.action === "DELETE" && cr.entityId) {
          const existing = await prisma.issue.findUnique({
            where: { id: cr.entityId },
            select: { slug: true, isSpecial: true },
          });
          if (!existing) return { ok: false, error: "Issue not found." };
          await prisma.$transaction([
            prisma.articleIssueLink.deleteMany({ where: { issueId: cr.entityId } }),
            prisma.queryIssueLink.deleteMany({ where: { issueId: cr.entityId } }),
            prisma.issue.delete({ where: { id: cr.entityId } }),
          ]);
          revalidateIssuePages(existing);
        }
        break;

      case "writer":
        if (cr.action === "CREATE") {
          const slug = await findAvailableWriterSlug(slugify(data.name as string));
          await prisma.writer.create({
            data: {
              name: data.name as string,
              slug,
              email: (data.email as string | undefined) ?? null,
              displayOnSite: (data.displayOnSite as boolean | undefined) ?? true,
              isQueryWriter: (data.isQueryWriter as boolean | undefined) ?? false,
            },
          });
        } else if (cr.action === "UPDATE" && cr.entityId) {
          await prisma.writer.update({ where: { id: cr.entityId }, data });
        }
        revalidatePath("/admin/writers");
        revalidatePath("/");
        break;

      case "topic":
        if (cr.action === "UPDATE" && cr.entityId) {
          await prisma.topic.update({ where: { id: cr.entityId }, data });
        }
        revalidatePath("/admin/topics");
        revalidatePath("/");
        break;

      case "book":
        if (cr.action === "CREATE") {
          await prisma.book.create({
            data: {
              title: data.title as string,
              slug: data.slug as string,
              fileName: data.fileName as string,
              writerId: (data.writerId as number | undefined) ?? null,
              translatorId: (data.translatorId as number | undefined) ?? null,
              isEbook: (data.isEbook as boolean | undefined) ?? false,
              isBook: (data.isBook as boolean | undefined) ?? false,
              display: (data.display as boolean | undefined) ?? true,
              postDate: new Date(),
            },
          });
        } else if (cr.action === "UPDATE" && cr.entityId) {
          await prisma.book.update({ where: { id: cr.entityId }, data });
        } else if (cr.action === "DELETE" && cr.entityId) {
          await prisma.$transaction([prisma.book.delete({ where: { id: cr.entityId } })]);
        }
        revalidatePath("/admin/books");
        break;
    }

    await prisma.changeRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    });
    revalidatePath("/admin/change-requests");
    return { ok: true, applied: true };
  } catch (err) {
    return fail(err, { entityType: "changeRequest", entityId: requestId, action: "APPROVE" });
  }
}

export async function rejectChangeRequest(
  requestId: number,
  reviewNote?: string,
): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canManageContent(session.user.role)) throw new Error("Forbidden");

  try {
    const cr = await prisma.changeRequest.findUnique({ where: { id: requestId } });
    if (!cr || cr.status !== "PENDING") {
      return { ok: false, error: "Invalid change request" };
    }

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
    return { ok: true, applied: true };
  } catch (err) {
    return fail(err, { entityType: "changeRequest", entityId: requestId, action: "REJECT" });
  }
}

// ─── Feedback Actions ────────────────────────────────────────
// Feedback is internal triage (not public content), so ADMIN + TEAM both
// update status/notes directly — no ChangeRequest detour. Only ADMIN deletes.

export async function updateFeedback(
  id: number,
  input: { status?: string; adminNote?: string | null },
): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canEditContent(session.user.role)) throw new Error("Forbidden");

  const parsed = feedbackUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message || "Invalid update." };
  }
  const { status, adminNote } = parsed.data;

  try {
    const data: Prisma.FeedbackUpdateInput = {};
    if (adminNote !== undefined) data.adminNote = adminNote;
    if (status !== undefined) {
      data.status = status;
      const isResolved = status === "RESOLVED" || status === "DISMISSED";
      data.resolvedAt = isResolved ? new Date() : null;
      data.resolvedBy = isResolved
        ? { connect: { id: session.user.id } }
        : { disconnect: true };
    }

    await prisma.feedback.update({ where: { id }, data });
    revalidatePath("/admin/feedback");
    return { ok: true, applied: true };
  } catch (err) {
    return fail(err, { entityType: "feedback", entityId: id, action: "UPDATE" });
  }
}

export async function deleteFeedback(id: number): Promise<MutationResult> {
  const session = await requireAuth();
  if (!canManageContent(session.user.role)) throw new Error("Forbidden");

  try {
    await prisma.feedback.delete({ where: { id } });
    revalidatePath("/admin/feedback");
    return { ok: true, applied: true };
  } catch (err) {
    return fail(err, { entityType: "feedback", entityId: id, action: "DELETE" });
  }
}
