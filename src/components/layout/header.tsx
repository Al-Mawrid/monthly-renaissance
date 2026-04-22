"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/variants";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/user-menu";
import { SearchBox } from "@/components/layout/search-box";

const navigation = [
  { name: "Articles", href: "/articles/topics" },
  { name: "Issues", href: "/issues" },
  { name: "Queries", href: "/queries/topics" },
  { name: "Writers", href: "/articles/writers" },
  { name: "Topics", href: "/articles/topics" },
  { name: "E-Books", href: "/ebooks" },
];

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
          className="font-serif font-semibold tracking-tight"
          style={{ fontSize: compact ? 17 : 22 }}
        >
          Monthly <span className="italic" style={{ color: "var(--mr-green-800)" }}>Renaissance</span>
        </div>
        <div
          className="flex items-center gap-1.5 mt-0.5 font-semibold uppercase text-muted-foreground"
          style={{ fontSize: compact ? 9 : 10, letterSpacing: "0.18em" }}
        >
          <span>An affiliate of Al-Mawrid</span>
        </div>
      </div>
    </Link>
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
              <Link
                key={item.name}
                href={item.href}
                className="mr-nav-link text-[13px] font-medium text-muted-foreground"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen((s) => !s)}
              className="text-muted-foreground hover:text-foreground"
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
                <nav className="flex flex-col gap-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="px-3 py-2.5 text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-sm transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
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
