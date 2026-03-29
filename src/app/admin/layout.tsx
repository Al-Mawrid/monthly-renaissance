import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  HelpCircle,
  Calendar,
  Users,
  Tag,
  BookOpen,
  Settings,
  Shield,
  GitPullRequest,
} from "lucide-react";
import { auth } from "@/lib/auth";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Articles", href: "/admin/articles", icon: FileText },
  { name: "Queries", href: "/admin/queries", icon: HelpCircle },
  { name: "Issues", href: "/admin/issues", icon: Calendar },
  { name: "Writers", href: "/admin/writers", icon: Users },
  { name: "Topics", href: "/admin/topics", icon: Tag },
  { name: "Books", href: "/admin/books", icon: BookOpen },
];

const sharedExtraItems = [
  { name: "Change Requests", href: "/admin/change-requests", icon: GitPullRequest },
];

const adminOnlyItems = [
  { name: "Users", href: "/admin/users", icon: Shield },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "TEAM") {
    redirect("/unauthorized");
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col shrink-0 border-r border-border bg-card overflow-y-auto">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-semibold">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}

          <div className="my-3 border-t border-border" />
          {sharedExtraItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}

          {role === "ADMIN" && (
            <>
              {adminOnlyItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="px-6 py-4 border-t border-border">
          <div className="flex items-center gap-3">
            {session.user.image ? (
              <img src={session.user.image} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {session.user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">{role}</p>
            </div>
          </div>
          <Link
            href="/"
            className="mt-3 block text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
