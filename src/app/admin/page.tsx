import { FileText, HelpCircle, Calendar, Users, BookOpen, Video, GitPullRequest } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

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
        <Link
          href="/admin/change-requests"
          className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-5 py-4 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          <GitPullRequest className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              {pendingRequests} pending change request{pendingRequests !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
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
          <span className={`text-xs px-2 py-0.5 rounded-full ${a.display ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
            {a.display ? "Visible" : "Hidden"}
          </span>
        </div>
      ))}
    </div>
  );
}
