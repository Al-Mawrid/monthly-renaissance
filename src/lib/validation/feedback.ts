import { z } from "zod";

// Context auto-captured by the client (page, article, user agent). Kept loose
// since it is informational only and stored as JSON.
export const feedbackContextSchema = z
  .object({
    kind: z.enum(["page", "article"]).optional(),
    articleId: z.number().int().positive().optional(),
    articleSlug: z.string().max(255).optional(),
    userAgent: z.string().max(500).optional(),
  })
  .strict()
  .optional();

// Public submission payload. `website` is a honeypot — real users never see it,
// bots that fill it are dropped silently in the action.
export const feedbackSubmitSchema = z
  .object({
    type: z.enum(["PROBLEM", "SUGGESTION"]),
    message: z.string().trim().min(1, "Please describe the problem or suggestion.").max(5000),
    email: z.string().trim().email().max(255).optional().or(z.literal("")),
    pageUrl: z.string().trim().max(500).optional(),
    pageTitle: z.string().trim().max(300).optional(),
    context: feedbackContextSchema,
    website: z.string().max(0).optional().or(z.string()), // honeypot, any value allowed
  })
  .strict();

export type FeedbackSubmitInput = z.infer<typeof feedbackSubmitSchema>;

// Admin triage payload (status + note).
export const feedbackUpdateSchema = z
  .object({
    status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED", "DISMISSED"]).optional(),
    adminNote: z.string().trim().max(5000).nullable().optional(),
  })
  .strict()
  .refine((d) => d.status !== undefined || d.adminNote !== undefined, {
    message: "Nothing to update.",
  });

export type FeedbackUpdateInput = z.infer<typeof feedbackUpdateSchema>;
