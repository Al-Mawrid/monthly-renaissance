import Link from "next/link";
import {
  ArrowRight,
  User,
  Clock,
  Library,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/variants";
import { articles, issues, writers, topics, queries } from "@/lib/data";
import "./home1.css";

export const metadata = {
  title: "Home Variant 1 — Golden Manuscript",
};

/* ── Reusable SVG decorative components ── */

function ArabesqueBorder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1200 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      {/* Interlocking arabesque band */}
      <pattern id="arabesqueBand" x="0" y="0" width="120" height="60" patternUnits="userSpaceOnUse">
        {/* Central 8-pointed star */}
        <path d="M60 5 L70 20 L85 15 L75 30 L85 45 L70 40 L60 55 L50 40 L35 45 L45 30 L35 15 L50 20 Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
        {/* Connecting knotwork */}
        <path d="M0 30 Q15 15 30 30 Q15 45 0 30" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M90 30 Q105 15 120 30 Q105 45 90 30" stroke="currentColor" strokeWidth="0.8" fill="none" />
        {/* Small diamonds */}
        <path d="M30 5 L35 10 L30 15 L25 10 Z" stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.15" />
        <path d="M90 5 L95 10 L90 15 L85 10 Z" stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.15" />
        <path d="M30 45 L35 50 L30 55 L25 50 Z" stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.15" />
        <path d="M90 45 L95 50 L90 55 L85 50 Z" stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.15" />
        {/* Interlacing arcs */}
        <path d="M20 0 Q30 10 40 0" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <path d="M80 0 Q90 10 100 0" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <path d="M20 60 Q30 50 40 60" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <path d="M80 60 Q90 50 100 60" stroke="currentColor" strokeWidth="0.5" fill="none" />
      </pattern>
      <rect width="1200" height="60" fill="url(#arabesqueBand)" />
    </svg>
  );
}

function GeometricMedallion({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shamsa / sun medallion — classic Islamic illuminated manuscript motif */}
      {/* Outer ring of pointed petals */}
      {[...Array(16)].map((_, i) => {
        const angle = (i * 360) / 16;
        return (
          <g key={i} transform={`rotate(${angle} 100 100)`}>
            <path d="M100 15 L105 35 L100 40 L95 35 Z" stroke="currentColor" strokeWidth="0.8" fill="currentColor" fillOpacity="0.08" />
          </g>
        );
      })}
      {/* Middle ring — 8 larger petals */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 360) / 8;
        return (
          <g key={`m${i}`} transform={`rotate(${angle} 100 100)`}>
            <path d="M100 30 L108 55 L100 65 L92 55 Z" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.05" />
          </g>
        );
      })}
      {/* Concentric circles */}
      <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="75" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="42" stroke="currentColor" strokeWidth="1" />
      {/* Inner 8-pointed star */}
      <path d="M100 62 L110 85 L133 75 L115 92 L138 100 L115 108 L133 125 L110 115 L100 138 L90 115 L67 125 L85 108 L62 100 L85 92 L67 75 L90 85 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.06" />
      {/* Core circle */}
      <circle cx="100" cy="100" r="20" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
      <circle cx="100" cy="100" r="8" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Elaborate corner piece — interlocking arabesques */}
      {/* Outer L-frame */}
      <path d="M0 0 L150 0 L150 15 L15 15 L15 150 L0 150 Z" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.04" />
      <path d="M5 5 L140 5 L140 10 L10 10 L10 140 L5 140 Z" stroke="currentColor" strokeWidth="0.5" fill="none" />
      {/* Floral vine from corner */}
      <path d="M25 25 Q50 15 55 40 Q60 15 85 25" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M25 25 Q15 50 40 55 Q15 60 25 85" stroke="currentColor" strokeWidth="1" fill="none" />
      {/* Leaf shapes */}
      <path d="M45 20 Q55 28 48 38 Q40 28 45 20" stroke="currentColor" strokeWidth="0.7" fill="currentColor" fillOpacity="0.1" />
      <path d="M20 45 Q28 55 38 48 Q28 40 20 45" stroke="currentColor" strokeWidth="0.7" fill="currentColor" fillOpacity="0.1" />
      {/* Small florette */}
      <circle cx="55" cy="55" r="6" stroke="currentColor" strokeWidth="0.8" fill="currentColor" fillOpacity="0.08" />
      <circle cx="55" cy="55" r="2.5" stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.15" />
      {/* Diagonal line detail */}
      <path d="M30 30 L55 55" stroke="currentColor" strokeWidth="0.4" strokeDasharray="2 3" />
      <path d="M70 25 Q80 35 75 50" stroke="currentColor" strokeWidth="0.6" fill="none" />
      <path d="M25 70 Q35 80 50 75" stroke="currentColor" strokeWidth="0.6" fill="none" />
    </svg>
  );
}

function MashrabiyaPanel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 400" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <pattern id="mashrabiya" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
        {/* Interlocking hexagonal lattice */}
        <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="0.6" fill="none" />
        <circle cx="0" cy="0" r="20" stroke="currentColor" strokeWidth="0.6" fill="none" />
        <circle cx="50" cy="0" r="20" stroke="currentColor" strokeWidth="0.6" fill="none" />
        <circle cx="0" cy="50" r="20" stroke="currentColor" strokeWidth="0.6" fill="none" />
        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="0.6" fill="none" />
        {/* Star created by intersections */}
        <path d="M25 5 L30 15 L25 25 L20 15 Z" stroke="currentColor" strokeWidth="0.4" fill="currentColor" fillOpacity="0.08" />
        <path d="M5 25 L15 20 L25 25 L15 30 Z" stroke="currentColor" strokeWidth="0.4" fill="currentColor" fillOpacity="0.08" />
        <path d="M45 25 L35 20 L25 25 L35 30 Z" stroke="currentColor" strokeWidth="0.4" fill="currentColor" fillOpacity="0.08" />
        <path d="M25 45 L30 35 L25 25 L20 35 Z" stroke="currentColor" strokeWidth="0.4" fill="currentColor" fillOpacity="0.08" />
      </pattern>
      <rect width="100" height="400" fill="url(#mashrabiya)" />
    </svg>
  );
}

function OrnamentalDivider({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 800 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      {/* Central ornament */}
      <path d="M400 4 L410 16 L424 10 L414 22 L424 30 L410 26 L400 36 L390 26 L376 30 L386 22 L376 10 L390 16 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.12" />
      <circle cx="400" cy="20" r="5" stroke="currentColor" strokeWidth="0.8" fill="currentColor" fillOpacity="0.2" />
      {/* Extending scrollwork — left */}
      <path d="M370 20 Q355 10 340 20 Q325 30 310 20" stroke="currentColor" strokeWidth="0.8" fill="none" />
      <path d="M310 20 Q295 10 280 20 Q265 30 250 20" stroke="currentColor" strokeWidth="0.8" fill="none" />
      <path d="M250 20 L100 20" stroke="currentColor" strokeWidth="0.4" strokeDasharray="4 4" />
      <path d="M100 20 L0 20" stroke="currentColor" strokeWidth="0.3" opacity="0.4" />
      {/* Small diamonds along left */}
      <path d="M340 14 L343 17 L340 20 L337 17 Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M280 14 L283 17 L280 20 L277 17 Z" fill="currentColor" fillOpacity="0.25" />
      {/* Extending scrollwork — right */}
      <path d="M430 20 Q445 10 460 20 Q475 30 490 20" stroke="currentColor" strokeWidth="0.8" fill="none" />
      <path d="M490 20 Q505 10 520 20 Q535 30 550 20" stroke="currentColor" strokeWidth="0.8" fill="none" />
      <path d="M550 20 L700 20" stroke="currentColor" strokeWidth="0.4" strokeDasharray="4 4" />
      <path d="M700 20 L800 20" stroke="currentColor" strokeWidth="0.3" opacity="0.4" />
      {/* Small diamonds along right */}
      <path d="M460 14 L463 17 L460 20 L457 17 Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M520 14 L523 17 L520 20 L517 17 Z" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

export default function Home1() {
  const latestIssue = issues[0];
  const featuredArticle = articles[0];
  const recentArticles = articles.slice(1, 5);
  const latestQueries = queries.slice(0, 3);
  const featuredWriters = writers.slice(0, 4);
  const featuredTopics = topics.slice(0, 6);

  return (
    <div className="home1 flex flex-col">
      {/* ── Hero ── */}
      <section className="h1-hero relative overflow-hidden">
        {/* Full-page Islamic geometric tile background */}
        <div className="h1-geo-bg" aria-hidden="true" />

        {/* Corner ornaments — all four */}
        <CornerOrnament className="h1-corner-svg h1-corner-svg--tl" />
        <CornerOrnament className="h1-corner-svg h1-corner-svg--tr" />
        <CornerOrnament className="h1-corner-svg h1-corner-svg--bl" />
        <CornerOrnament className="h1-corner-svg h1-corner-svg--br" />

        {/* Arabesque border band at top */}
        <ArabesqueBorder className="h1-top-band" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 lg:py-28 relative z-10">
          {/* Medallion + Bismillah */}
          <div className="flex justify-center mb-12 relative">
            <GeometricMedallion className="h1-medallion" />
            <div className="h1-bismillah-wrap">
              <span className="font-arabic text-2xl sm:text-3xl lg:text-4xl text-[var(--h1-gold)] leading-none drop-shadow-sm">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr,auto,1fr] gap-6 lg:gap-0 items-start">
            {/* Left: Featured Article */}
            <div className="flex flex-col gap-5 lg:pr-10">
              <div className="flex items-center gap-3">
                <span className="h1-issue-badge">
                  {latestIssue.title}
                </span>
                <span className="text-xs text-[var(--h1-muted)]">Latest Issue</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.15] tracking-tight text-[var(--h1-ink)]">
                {featuredArticle.title}
              </h1>

              <p className="text-lg text-[var(--h1-muted)] leading-relaxed font-serif">
                {featuredArticle.excerpt}
              </p>

              <div className="flex items-center gap-4 text-sm text-[var(--h1-muted)]">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {featuredArticle.writer.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {featuredArticle.readingTime} min read
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <Link href={`/articles/${featuredArticle.slug}`} className="h1-btn-primary">
                  Read Article <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href={`/issues/${latestIssue.id}`} className="h1-btn-outline">
                  View Full Issue
                </Link>
              </div>
            </div>

            {/* Center: Mashrabiya divider (desktop only) */}
            <div className="hidden lg:block h1-mashrabiya-col">
              <MashrabiyaPanel className="h1-mashrabiya-svg" />
            </div>

            {/* Right: More from this issue */}
            <div className="flex flex-col gap-4 lg:pl-10">
              <h2 className="h1-section-label">
                <span className="h1-label-ornament" aria-hidden="true" />
                Also in this issue
                <span className="h1-label-ornament" aria-hidden="true" />
              </h2>
              <div className="flex flex-col gap-3">
                {recentArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="h1-article-card group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h1-topic-pill">{article.topic.name}</span>
                      <span className="text-xs text-[var(--h1-muted)]">{article.readingTime} min</span>
                    </div>
                    <h3 className="font-semibold text-[15px] leading-snug text-[var(--h1-ink)] group-hover:text-[var(--h1-burgundy)] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-[var(--h1-muted)] line-clamp-2">{article.excerpt}</p>
                    <span className="text-xs text-[var(--h1-muted)] mt-0.5">{article.writer.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Arabesque border band at bottom */}
        <ArabesqueBorder className="h1-bottom-band" />
      </section>

      {/* ── Ornamental divider ── */}
      <OrnamentalDivider className="h1-ornamental-divider" />

      {/* ── Browse by Topic ── */}
      <section className="h1-section-alt relative overflow-hidden">
        <div className="h1-section-geo-bg" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--h1-ink)]">Browse by Topic</h2>
              <p className="text-sm text-[var(--h1-muted)] mt-1">Explore 35 years of scholarship across key Islamic disciplines</p>
            </div>
            <Link href="/articles/topics" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:flex text-[var(--h1-muted)] hover:text-[var(--h1-ink)]")}>
              All Topics <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {featuredTopics.map((topic) => (
              <Link key={topic.id} href={`/articles/topics/${topic.slug}`} className="h1-topic-card group">
                <div className="h1-topic-card-inner">
                  <h3 className="font-semibold text-[15px] text-[var(--h1-ink)] group-hover:text-[var(--h1-burgundy)] transition-colors">
                    {topic.name}
                  </h3>
                  <p className="text-sm text-[var(--h1-muted)] mt-1.5 line-clamp-2">{topic.description}</p>
                  <span className="text-xs text-[var(--h1-gold-dark)] mt-3 font-medium">{topic.articleCount} articles</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ornamental divider ── */}
      <OrnamentalDivider className="h1-ornamental-divider" />

      {/* ── Reader Queries ── */}
      <section className="h1-section-main relative overflow-hidden">
        <div className="h1-section-geo-bg h1-section-geo-bg--light" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--h1-ink)]">Reader Queries</h2>
              <p className="text-sm text-[var(--h1-muted)] mt-1">Questions answered by our scholars on faith, practice, and life</p>
            </div>
            <Link href="/queries/topics" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:flex text-[var(--h1-muted)] hover:text-[var(--h1-ink)]")}>
              All Queries <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {latestQueries.map((query) => (
              <Link key={query.id} href={`/articles/${query.slug}`} className="h1-query-card group">
                <span className="h1-topic-pill w-fit">{query.topic.name}</span>
                <h3 className="font-semibold leading-snug text-[var(--h1-ink)] group-hover:text-[var(--h1-burgundy)] transition-colors">{query.title}</h3>
                <p className="text-sm text-[var(--h1-muted)] line-clamp-2">{query.excerpt}</p>
                <div className="flex items-center gap-3 text-xs text-[var(--h1-muted)] mt-auto">
                  <span>{query.writer.name}</span>
                  <span>{query.readingTime} min read</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Writers ── */}
      <section className="h1-section-alt relative overflow-hidden">
        <div className="h1-section-geo-bg" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--h1-ink)]">Our Writers</h2>
              <p className="text-sm text-[var(--h1-muted)] mt-1">Scholars and thinkers contributing to the discourse</p>
            </div>
            <Link href="/articles/writers" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:flex text-[var(--h1-muted)] hover:text-[var(--h1-ink)]")}>
              All Writers <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredWriters.map((writer) => (
              <Link key={writer.id} href={`/articles/writers/${writer.slug}`} className="h1-writer-card group">
                <div className="h1-writer-avatar">
                  <span className="text-xl font-semibold text-[var(--h1-gold-dark)]">
                    {writer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-[var(--h1-ink)] group-hover:text-[var(--h1-burgundy)] transition-colors">{writer.name}</h3>
                <span className="text-xs text-[var(--h1-muted)] mt-1">{writer.articleCount} articles</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Archive CTA ── */}
      <section className="h1-archive relative overflow-hidden">
        <div className="h1-archive-pattern" aria-hidden="true" />
        <ArabesqueBorder className="h1-archive-top-band" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
          <div className="flex flex-col items-center text-center gap-5">
            <GeometricMedallion className="h1-archive-medallion" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--h1-cream)]">
              35 Years of Islamic Scholarship
            </h2>
            <p className="text-base text-[var(--h1-cream)]/80 max-w-lg font-serif">
              Explore our complete archive of over 430 issues published since 1991,
              covering every major topic in Islamic thought and practice.
            </p>
            <div className="flex gap-3 pt-2">
              <Link href="/issues" className="h1-btn-gold">
                Browse Archive <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/ebooks" className="h1-btn-outline-light">E-Books</Link>
            </div>
          </div>
        </div>
        <ArabesqueBorder className="h1-archive-bottom-band" />
      </section>
    </div>
  );
}
