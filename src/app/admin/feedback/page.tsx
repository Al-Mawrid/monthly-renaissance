import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { FeedbackControls } from "./feedback-controls";
import type { FeedbackStatus, FeedbackType } from "@prisma/client";

export const dynamic = "force-dynamic";

const PER_PAGE = 25;

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "NEW", label: "New" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "DISMISSED", label: "Dismissed" },
] as const;

const TYPE_TABS = [
  { key: "all", label: "All kinds" },
  { key: "PROBLEM", label: "Problems" },
  { key: "SUGGESTION", label: "Suggestions" },
] as const;

function statusTagClass(status: FeedbackStatus): string {
  switch (status) {
    case "NEW":
      return "mr-tag-info";
    case "IN_PROGRESS":
      return "mr-tag-warning";
    case "RESOLVED":
      return "mr-tag-success";
    case "DISMISSED":
      return "mr-tag-neutral";
    default:
      return "mr-tag-neutral";
  }
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; page?: string }>;
}) {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";
  const sp = await searchParams;

  const statusFilter: FeedbackStatus | undefined =
    sp.status && sp.status !== "all" && STATUS_TABS.some((t) => t.key === sp.status)
      ? (sp.status as FeedbackStatus)
      : undefined;
  const typeFilter: FeedbackType | undefined =
    sp.type === "PROBLEM" || sp.type === "SUGGESTION" ? (sp.type as FeedbackType) : undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
  };

  const [items, total, newCount] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        submittedBy: { select: { name: true, email: true } },
        resolvedBy: { select: { name: true } },
      },
    }),
    prisma.feedback.count({ where }),
    prisma.feedback.count({ where: { status: "NEW" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const status = overrides.status ?? (statusFilter ?? "all");
    const type = overrides.type ?? (typeFilter ?? "all");
    const p = overrides.page ?? "1";
    if (status && status !== "all") params.set("status", status);
    if (type && type !== "all") params.set("type", type);
    if (p && p !== "1") params.set("page", p);
    const qs = params.toString();
    return qs ? `/admin/feedback?${qs}` : "/admin/feedback";
  };

  const currentStatusKey = statusFilter ?? "all";
  const currentTypeKey = typeFilter ?? "all";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
        <p className="text-sm text-muted-foreground">
          {newCount} new &middot; {total} {statusFilter || typeFilter ? "in this view" : "total"}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((t) => (
            <Link
              key={t.key}
              href={buildHref({ status: t.key, page: "1" })}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                currentStatusKey === t.key
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TYPE_TABS.map((t) => (
            <Link
              key={t.key}
              href={buildHref({ type: t.key, page: "1" })}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                currentTypeKey === t.key
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No feedback in this view.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const ctx =
              item.context && typeof item.context === "object" && !Array.isArray(item.context)
                ? (item.context as Record<string, unknown>)
                : null;
            const articleSlug = typeof ctx?.articleSlug === "string" ? ctx.articleSlug : null;
            const reporter = item.submittedBy?.name || item.submittedBy?.email || null;

            return (
              <div key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 text-sm">
                  <span className="text-xs text-muted-foreground">#{item.id}</span>
                  <span
                    className={`mr-tag ${
                      item.type === "PROBLEM" ? "mr-tag-danger" : "mr-tag-info"
                    }`}
                  >
                    {item.type === "PROBLEM" ? "Problem" : "Suggestion"}
                  </span>
                  <span className={`mr-tag ${statusTagClass(item.status)}`}>
                    {item.status.replace("_", " ")}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {item.createdAt.toLocaleString()}
                  </span>
                </div>

                <div className="px-4 py-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {item.message}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                    {item.email && (
                      <span>
                        Email:{" "}
                        <a href={`mailto:${item.email}`} className="text-primary hover:underline">
                          {item.email}
                        </a>
                      </span>
                    )}
                    {reporter && <span>From: {reporter}</span>}
                    {articleSlug ? (
                      <span>
                        Article:{" "}
                        <Link href={`/articles/${articleSlug}`} className="text-primary hover:underline">
                          {articleSlug}
                        </Link>
                      </span>
                    ) : item.pageUrl ? (
                      <span>
                        Page:{" "}
                        <a
                          href={item.pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {item.pageTitle || item.pageUrl}
                        </a>
                      </span>
                    ) : null}
                    {item.resolvedBy?.name && item.resolvedAt && (
                      <span>
                        Resolved by {item.resolvedBy.name} on {item.resolvedAt.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <FeedbackControls
                  id={item.id}
                  status={item.status}
                  adminNote={item.adminNote}
                  isAdmin={isAdmin}
                />
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <PaginationNav
          page={page}
          totalPages={totalPages}
          prevHref={buildHref({ page: String(page - 1) })}
          nextHref={buildHref({ page: String(page + 1) })}
        />
      )}
    </div>
  );
}
