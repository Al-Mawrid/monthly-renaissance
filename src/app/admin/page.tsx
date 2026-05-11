import { FileText, HelpCircle, Calendar, Users, BookOpen, Video, GitPullRequest } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const [articles, queries, issues, writers, books, videos, pendingRequests] = await Promise.all([
    prisma.article.count(),
    prisma.queryEntry.count(),
    prisma.issue.count(),
    prisma.writer.count({ where: { displayOnSite: true } }),
    prisma.book.count({ where: { display: true } }),
    prisma.video.count({ where: { display: true } }),
    prisma.changeRequest.count({ where: { status: "PENDING" } }),
  ]);

  const stats = [
    { name: "Articles", value: articles, icon: FileText },
    { name: "Queries", value: queries, icon: HelpCircle },
    { name: "Issues", value: issues, icon: Calendar },
    { name: "Writers", value: writers, icon: Users },
    { name: "Books", value: books, icon: BookOpen },
    { name: "Videos", value: videos, icon: Video },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Dashboard</h1>

      {/* Pending requests alert */}
      {pendingRequests > 0 && (
        <Link href="/admin/change-requests" className="mr-callout mb-6">
          <GitPullRequest className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <p className="mr-callout-title">
              {pendingRequests} pending change request{pendingRequests !== 1 ? "s" : ""}
            </p>
            <p className="mr-callout-sub">
              {isAdmin ? "Review and approve or reject" : "Awaiting admin review"}
            </p>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{stat.name}</span>
            </div>
            <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-3">Recent Articles</h2>
        <RecentArticles />
      </div>
    </div>
  );
}

async function RecentArticles() {
  const articles = await prisma.article.findMany({
    orderBy: { dateAdded: "desc" },
    take: 10,
    include: { writer: true, topic: true },
  });

  return (
    <div className="space-y-2">
      {articles.map((a) => (
        <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{a.title}</p>
            <p className="text-xs text-muted-foreground">
              {a.writer.name} &middot; {a.topic.title}
            </p>
          </div>
          <span className={`mr-tag ${a.display ? "mr-tag-success" : "mr-tag-danger"}`}>
            {a.display ? "Visible" : "Hidden"}
          </span>
        </div>
      ))}
    </div>
  );
}
