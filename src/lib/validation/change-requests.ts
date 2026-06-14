import { z } from "zod";

const roleInIssue = z.enum(["regular", "editorial", "intro"]);

export const articleCreateSchema = z
  .object({
    title: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    bodyHtml: z.string(),
    topicId: z.number().int().positive(),
    writerId: z.number().int().positive(),
    translatorId: z.number().int().positive().optional(),
    issueId: z.number().int().positive(),
    roleInIssue,
    display: z.boolean().optional(),
    isImportant: z.boolean().optional(),
  })
  .strict();

export const articleUpdateSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).optional(),
    bodyHtml: z.string().optional(),
    topicId: z.number().int().positive().optional(),
    writerId: z.number().int().positive().optional(),
    translatorId: z.number().int().positive().nullable().optional(),
    issueId: z.number().int().positive().optional(),
    roleInIssue: roleInIssue.optional(),
    display: z.boolean().optional(),
    isImportant: z.boolean().optional(),
  })
  .strict();

export const articleDeleteSchema = z.object({}).strict();

export const queryCreateSchema = z
  .object({
    title: z.string().min(1),
    slug: z.string().min(1),
    questionHtml: z.string(),
    answerHtml: z.string().optional(),
    questioner: z.string().optional(),
    questionerEmail: z.string().email().optional(),
    topicId: z.number().int().positive(),
    writerId: z.number().int().positive(),
    display: z.boolean().optional(),
    isImportant: z.boolean().optional(),
  })
  .strict();

export const queryUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    questionHtml: z.string().optional(),
    answerHtml: z.string().optional(),
    questioner: z.string().optional(),
    questionerEmail: z.string().email().optional(),
    topicId: z.number().int().positive().optional(),
    writerId: z.number().int().positive().optional(),
    display: z.boolean().optional(),
    isImportant: z.boolean().optional(),
  })
  .strict();

export const queryDeleteSchema = z.object({}).strict();

export const issueCreateSchema = z
  .object({
    title: z.string().min(1),
    slug: z.string().min(1),
    volumeNumber: z.string().optional(),
    issueNumber: z.string().optional(),
    issueDate: z.string().optional(),
    display: z.boolean().optional(),
    isSpecial: z.boolean().optional(),
  })
  .strict();

export const issueUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    volumeNumber: z.string().optional(),
    issueNumber: z.string().optional(),
    issueDate: z.string().optional(),
    display: z.boolean().optional(),
    isSpecial: z.boolean().optional(),
  })
  .strict();

export const issueDeleteSchema = z.object({}).strict();

export const bookCreateSchema = z
  .object({
    title: z.string().min(1),
    slug: z.string().min(1),
    fileName: z.string().min(1),
    writerId: z.number().int().positive().optional(),
    translatorId: z.number().int().positive().optional(),
    isEbook: z.boolean().optional(),
    isBook: z.boolean().optional(),
    display: z.boolean().optional(),
  })
  .strict();

export const bookUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    fileName: z.string().min(1).optional(),
    writerId: z.number().int().positive().nullable().optional(),
    translatorId: z.number().int().positive().nullable().optional(),
    isEbook: z.boolean().optional(),
    isBook: z.boolean().optional(),
    display: z.boolean().optional(),
  })
  .strict();

export const bookDeleteSchema = z.object({}).strict();

export const writerCreateSchema = z
  .object({
    name: z.string().min(1).max(255),
    email: z.string().email().optional(),
    displayOnSite: z.boolean().optional(),
    isQueryWriter: z.boolean().optional(),
  })
  .strict();

const schemas = {
  "article-create": articleCreateSchema,
  "article-update": articleUpdateSchema,
  "article-delete": articleDeleteSchema,
  "query-create": queryCreateSchema,
  "query-update": queryUpdateSchema,
  "query-delete": queryDeleteSchema,
  "issue-create": issueCreateSchema,
  "issue-update": issueUpdateSchema,
  "issue-delete": issueDeleteSchema,
  "book-create": bookCreateSchema,
  "book-update": bookUpdateSchema,
  "book-delete": bookDeleteSchema,
  "writer-create": writerCreateSchema,
} as const;

export type ChangeRequestKind = keyof typeof schemas;

export function schemaKindFor(
  entityType: string,
  action: "CREATE" | "UPDATE" | "DELETE",
): ChangeRequestKind | null {
  const verb = action.toLowerCase() as "create" | "update" | "delete";
  const key = `${entityType}-${verb}` as ChangeRequestKind;
  return key in schemas ? key : null;
}

export function parseChangeRequestPayload(
  kind: ChangeRequestKind,
  payload: unknown,
):
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string } {
  const schema = schemas[kind];
  const result = schema.safeParse(payload ?? {});
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path?.join(".") || "(root)";
    const msg = first?.message || "invalid";
    const extras = result.error.issues
      .filter((i) => i.code === "unrecognized_keys")
      .flatMap((i) => (i as any).keys as string[]);
    const extrasNote = extras.length ? ` (unexpected: ${extras.join(", ")})` : "";
    return { ok: false, error: `${path}: ${msg}${extrasNote}` };
  }
  return { ok: true, data: result.data as Record<string, unknown> };
}
