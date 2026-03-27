import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  Browse: [
    { name: "Current Issue", href: "/issues" },
    { name: "Archives", href: "/issues" },
    { name: "Articles by Writer", href: "/articles/writers" },
    { name: "Articles by Topic", href: "/articles/topics" },
    { name: "E-Books", href: "/ebooks" },
  ],
  Queries: [
    { name: "By Writer", href: "/queries/writers" },
    { name: "By Topic", href: "/queries/topics" },
  ],
  About: [
    { name: "Mission", href: "/about" },
    { name: "Team", href: "/about/team" },
    { name: "Support Us", href: "/support" },
    { name: "Contact", href: "/contact" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="text-base font-semibold">Renaissance</span>
              </Link>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-[240px]">
                A journal of Islamic research and information, serving scholars and seekers of
                knowledge since 1991.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                ISSN 1605-0045
              </p>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-foreground">{category}</h3>
                <ul className="mt-3 space-y-2">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Monthly Renaissance. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Published by{" "}
            <span className="text-foreground/70">Al-Mawrid Institute of Islamic Sciences</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
