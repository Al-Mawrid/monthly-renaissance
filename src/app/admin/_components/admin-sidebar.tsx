"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
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
  MessageSquareWarning,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { PendingLink } from "@/components/ui/pending-link";

type NavItem = { name: string; href: string; icon: LucideIcon };

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Articles", href: "/admin/articles", icon: FileText },
  { name: "Queries", href: "/admin/queries", icon: HelpCircle },
  { name: "Issues", href: "/admin/issues", icon: Calendar },
  { name: "Writers", href: "/admin/writers", icon: Users },
  { name: "Topics", href: "/admin/topics", icon: Tag },
  { name: "Books", href: "/admin/books", icon: BookOpen },
];

const sharedExtraItems: NavItem[] = [
  { name: "Change Requests", href: "/admin/change-requests", icon: GitPullRequest },
  { name: "Feedback", href: "/admin/feedback", icon: MessageSquareWarning },
];

const adminOnlyItems: NavItem[] = [
  { name: "Users", href: "/admin/users", icon: Shield },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const COOKIE_NAME = "admin_sidebar_collapsed";

export function AdminSidebar({
  role,
  user,
  defaultCollapsed,
}: {
  role: string;
  user: { name?: string | null; image?: string | null };
  defaultCollapsed: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(item.href);
    return (
      <PendingLink
        href={item.href}
        icon={<item.icon aria-hidden="true" className="h-4 w-4 shrink-0" />}
        title={collapsed ? item.name : undefined}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          collapsed ? "justify-center" : ""
        } ${
          active
            ? "bg-muted text-foreground"
            : "text-foreground/70 hover:bg-muted hover:text-foreground"
        }`}
      >
        {!collapsed && item.name}
      </PendingLink>
    );
  }

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 border-r border-border bg-card overflow-y-auto transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div
        className={`flex items-center gap-2.5 border-b border-border py-4 ${
          collapsed ? "justify-center px-2" : "px-5"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-box.svg"
          alt="Monthly Renaissance"
          width={32}
          height={32}
          className="object-contain flex-shrink-0"
        />
        {!collapsed && (
          <div className="leading-[1.1]">
            <div className="font-serif text-[14px] font-semibold">Monthly Renaissance</div>
            <div className="mr-catalog" style={{ fontSize: 10 }}>EDITORIAL</div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-muted hover:text-foreground transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              Collapse
            </>
          )}
        </button>

        <div className="my-3 border-t border-border" />

        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <div className="my-3 border-t border-border" />
        {sharedExtraItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {role === "ADMIN" && (
          <>
            {adminOnlyItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}
      </nav>

      <div className={`border-t border-border py-4 ${collapsed ? "px-2" : "px-6"}`}>
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-primary">
                {user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">{role}</p>
            </div>
          )}
        </div>
        <PendingLink
          href="/"
          icon={<ArrowLeft aria-hidden="true" className="h-4 w-4 shrink-0" />}
          title={collapsed ? "Back to site" : undefined}
          className={`mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {!collapsed && "Back to site"}
        </PendingLink>
      </div>
    </aside>
  );
}
