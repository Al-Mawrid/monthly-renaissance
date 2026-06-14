import Link from "next/link";
import { Masthead } from "./header";
import { ISSN } from "@/lib/site-meta";
import { FeedbackTrigger } from "@/components/feedback/feedback-trigger";

const footerColumns = [
  {
    h: "Read",
    links: [
      { name: "Articles", href: "/articles/topics" },
      { name: "Issues", href: "/issues" },
      { name: "Queries", href: "/queries/topics" },
    ],
  },
  {
    h: "Browse",
    links: [
      { name: "Writers", href: "/articles/writers" },
      { name: "Topics", href: "/articles/topics" },
      { name: "E-Books", href: "/ebooks" },
    ],
  },
  {
    h: "About",
    links: [
      { name: "About", href: "/about" },
      { name: "Team", href: "/about/team" },
      { name: "Support", href: "/support" },
      { name: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className="mt-5 border-t"
      style={{ borderColor: "var(--foreground)", background: "var(--card)" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 pt-9 pb-7">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-7">
          <div className="col-span-2">
            <Masthead compact />
            <p className="font-serif text-[13px] text-muted-foreground leading-relaxed mt-3.5 max-w-[340px]">
              A journal of Islamic research in continuous monthly circulation since 1991.
              Published by Al-Mawrid.
            </p>
          </div>
          {footerColumns.map((col) => (
            <div key={col.h}>
              <div className="mr-eyebrow mb-2.5">{col.h}</div>
              {col.links.map((l) => (
                <Link
                  key={l.name}
                  href={l.href}
                  className="mr-footer-link text-[13px] text-muted-foreground py-1"
                >
                  {l.name}
                </Link>
              ))}
              {col.h === "About" && <FeedbackTrigger variant="footer" />}
            </div>
          ))}
        </div>
        <div
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="hidden sm:flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-long.svg"
              alt="Monthly Renaissance"
              className="opacity-75"
              style={{ height: 20, width: "auto" }}
            />
            <div className="mr-catalog">EST. 1991 · LAHORE</div>
          </div>
          <div className="flex flex-row justify-between items-center sm:items-center gap-4">
            <a
              href="https://tableturnerr.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mr-nav-link mr-catalog"
            >
              MADE WITH <span style={{ color: "var(--mr-clay-700)" }}>♥</span> BY TABLETURNERR.COM
            </a>
            <div className="mr-catalog flex items-center gap-3">
              {ISSN && <span>ISSN: {ISSN}</span>}
              <span>© {new Date().getFullYear()} AL-MAWRID</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
