"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/variants";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Issues",
    href: "/issues",
  },
  {
    name: "Articles",
    items: [
      { name: "By Writer", href: "/articles/writers" },
      { name: "By Topic", href: "/articles/topics" },
    ],
  },
  {
    name: "Queries",
    items: [
      { name: "By Writer", href: "/queries/writers" },
      { name: "By Topic", href: "/queries/topics" },
    ],
  },
  {
    name: "E-Books",
    href: "/ebooks",
  },
  {
    name: "About",
    items: [
      { name: "Mission", href: "/about" },
      { name: "Team", href: "/about/team" },
      { name: "Support Us", href: "/support" },
    ],
  },
];

export function Header() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold leading-tight tracking-tight">
                Renaissance
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground leading-none">
                A Monthly Journal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) =>
              item.href ? (
                <Link
                  key={item.name}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors rounded-md hover:bg-muted"
                >
                  {item.name}
                </Link>
              ) : (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.name)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors rounded-md hover:bg-muted">
                    {item.name}
                  </button>
                  {openDropdown === item.name && item.items && (
                    <div className="absolute top-full left-0 mt-0.5 w-44 rounded-lg border border-border bg-card p-1.5 shadow-lg">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className="block rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </nav>

          {/* Right side: Search + Mobile Menu */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground">
              <Search className="h-4.5 w-4.5" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden text-foreground/70 hover:text-foreground")}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 pt-12">
                <nav className="flex flex-col gap-1">
                  {navigation.map((item) =>
                    item.href ? (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="px-3 py-2.5 text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <div key={item.name} className="flex flex-col">
                        <span className="px-3 py-2.5 text-base font-medium text-foreground/60">
                          {item.name}
                        </span>
                        {item.items?.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className="pl-6 pr-3 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-muted rounded-md transition-colors"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
