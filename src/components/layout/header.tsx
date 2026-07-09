"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/variants";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/user-menu";
import { SearchBox } from "@/components/layout/search-box";

type NavLeaf = { name: string; href: string };
type NavGroup = { name: string; href: string; children: NavLeaf[] };
type NavItem = NavLeaf | NavGroup;

const navigation: NavItem[] = [
  {
    name: "Articles",
    href: "/articles/topics",
    children: [
      { name: "All Articles", href: "/articles/topics" },
      { name: "Writers", href: "/articles/writers" },
      { name: "Topics", href: "/articles/topics" },
    ],
  },
  {
    name: "Issues",
    href: "/issues",
    children: [
      { name: "All Issues", href: "/issues" },
      { name: "Special Issues", href: "/issues/special" },
    ],
  },
  { name: "Queries", href: "/queries/topics" },
  { name: "E-Books", href: "/ebooks" },
  { name: "Support", href: "/support" },
];

function isGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

export function Masthead({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="mr-masthead-link flex items-center gap-3.5 group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-box.svg"
        alt="Monthly Renaissance"
        width={compact ? 40 : 52}
        height={compact ? 40 : 52}
        className="flex-shrink-0 object-contain"
      />
      <div className="leading-[1.05]">
        <div
          className="font-serif font-bold tracking-tight"
          style={{ fontSize: compact ? 30 : 42, color: "var(--foreground)" }}
        >
          <span style={{ color: "var(--mr-green-800)" }}>Renaissance</span>
        </div>
        <div
          className="flex items-center gap-2 mt-1 font-semibold uppercase"
          style={{
            fontSize: compact ? 9 : 10,
            letterSpacing: "0.12em",
            color: "var(--mr-ink-soft)",
          }}
        >
          <span>A Monthly Islamic Journal</span>
          <span style={{ color: "var(--mr-saffron-700)", opacity: 0.55 }}>·</span>
          <span>Pakistan</span>
        </div>
      </div>
    </Link>
  );
}

function DesktopNavItem({ item }: { item: NavItem }) {
  if (!isGroup(item)) {
    return (
      <Link
        href={item.href}
        className="mr-nav-link text-[13px] font-semibold"
        style={{ color: "var(--mr-ink-soft)" }}
      >
        {item.name}
      </Link>
    );
  }
  return (
    <div className="mr-nav-group relative">
      <Link
        href={item.href}
        className="mr-nav-link mr-nav-trigger flex items-center gap-1 text-[13px] font-semibold"
        style={{ color: "var(--mr-ink-soft)" }}
      >
        {item.name}
        <ChevronDown className="h-3 w-3" aria-hidden />
      </Link>
      <div
        className="mr-nav-dropdown absolute left-1/2 top-full -translate-x-1/2 pt-3"
        role="menu"
      >
        <div
          className="min-w-[180px] py-1.5"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 22px rgba(36, 28, 19, 0.10), 0 2px 6px rgba(36, 28, 19, 0.06)",
            borderRadius: "var(--radius)",
          }}
        >
          {item.children.map((c) => (
            <Link
              key={c.href + c.name}
              href={c.href}
              role="menuitem"
              className="mr-nav-dropdown-item block px-3.5 py-2 text-[13px]"
              style={{ color: "var(--mr-ink-soft)" }}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex h-[72px] items-center justify-between gap-6">
          <Masthead compact />

          <nav className="hidden lg:flex items-center gap-7">
            {navigation.map((item) => (
              <DesktopNavItem key={item.name} item={item} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen((s) => !s)}
              className="text-foreground/80 hover:text-foreground"
              aria-label={searchOpen ? "Close search" : "Open search"}
              aria-expanded={searchOpen}
            >
              <Search className="h-4 w-4" />
            </Button>

            <UserMenu />

            <Sheet>
              <SheetTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden")}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 pt-12">
                <nav className="flex flex-col gap-0.5">
                  {navigation.map((item) => {
                    if (!isGroup(item)) {
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="px-3 py-2.5 text-base font-medium text-foreground/85 hover:text-foreground hover:bg-muted rounded-sm transition-colors"
                        >
                          {item.name}
                        </Link>
                      );
                    }
                    return (
                      <div key={item.name} className="flex flex-col">
                        <Link
                          href={item.href}
                          className="px-3 py-2.5 text-base font-semibold text-foreground/85 hover:text-foreground"
                        >
                          {item.name}
                        </Link>
                        <div className="flex flex-col pl-3">
                          {item.children.map((c) => (
                            <Link
                              key={c.name}
                              href={c.href}
                              className="px-3 py-1.5 text-[14px] text-muted-foreground hover:text-foreground rounded-sm transition-colors"
                            >
                              {c.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {searchOpen && (
          <div className="py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <SearchBox onClose={() => setSearchOpen(false)} />
          </div>
        )}
      </div>
    </header>
  );
}
