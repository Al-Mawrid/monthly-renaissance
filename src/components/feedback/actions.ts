"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { feedbackSubmitSchema } from "@/lib/validation/feedback";
import { checkRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/log";

export type SubmitFeedbackResult = { ok: true } | { ok: false; error: string };

// Public, unauthenticated. Anyone on the site can submit, so this is hardened
// with a honeypot + per-IP rate limit and never trusts the client.
export async function submitFeedback(input: unknown): Promise<SubmitFeedbackResult> {
  const parsed = feedbackSubmitSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message || "Please check the form and try again." };
  }

  const { type, message, email, pageUrl, pageTitle, context, website } = parsed.data;

  // Honeypot: bots fill hidden fields. Pretend success, store nothing.
  if (website && website.trim().length > 0) {
    return { ok: true };
  }

  const h = await headers();
  const ip =
    (h.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "unknown";

  const limit = checkRateLimit(`feedback:${ip}`, { max: 5, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) {
    return {
      ok: false,
      error: "You've sent a few messages already. Please try again in a little while.",
    };
  }

  const ipHash = crypto
    .createHash("sha256")
    .update(`${ip}:${process.env.AUTH_SECRET ?? ""}`)
    .digest("hex");

  // Attach the user row if they happen to be signed in (optional).
  const session = await auth().catch(() => null);
  const submittedById = session?.user?.id ?? null;

  const userAgent = h.get("user-agent")?.slice(0, 500) ?? undefined;
  const fullContext = { ...(context ?? {}), ...(userAgent ? { userAgent } : {}) };

  try {
    await prisma.feedback.create({
      data: {
        type,
        message,
        email: email ? email : null,
        pageUrl: pageUrl || null,
        pageTitle: pageTitle || null,
        context: Object.keys(fullContext).length ? fullContext : undefined,
        ipHash,
        submittedById,
      },
    });
    return { ok: true };
  } catch (err) {
    logError("feedback.submit", err, { type });
    return { ok: false, error: "Something went wrong sending your message. Please try again." };
  }
}
