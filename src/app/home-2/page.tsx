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
import "./home2.css";

export const metadata = {
  title: "Home Variant 2 — Midnight Mosque",
};

/* ── SVG Components ── */

function MosqueArch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 600 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
      {/* Pointed Islamic arch (ogee / horseshoe hybrid) */}
      <path
        d="M0 200 L0 120 Q0 40 80 20 Q140 0 200 20 Q250 35 280 60 Q295 20 300 0 Q305 20 320 60 Q350 35 400 20 Q460 0 520 20 Q600 40 600 120 L600 200"
        stroke="currentColor" strokeWidth="1.5" fill="none"
      />
      {/* Inner arch line */}
      <path
        d="M20 200 L20 125 Q20 50 95 32 Q150 15 205 32 Q252 45 280 68 Q295 28 300 12 Q305 28 320 68 Q348 45 395 32 Q450 15 505 32 Q580 50 580 125 L580 200"
        stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.5"
      />
      {/* Keystone ornament at apex */}
      <path d="M290 18 L300 0 L310 18 L305 18 L300 8 L295 18 Z" fill="currentColor" fillOpacity="0.3" />
      {/* Small decorative circles along the arch */}
      <circle cx="100" cy="30" r="3" stroke="currentColor" strokeWidth="0.5" fill="currentColor" fillOpacity="0.1" />
      <circle cx="200" cy="22" r="3" stroke="currentColor" strokeWidth="0.5" fill="currentColor" fillOpacity="0.1" />
      <circle cx="400" cy="22" r="3" stroke="currentColor" strokeWidth="0.5" fill="currentColor" fillOpacity="0.1" />
      <circle cx="500" cy="30" r="3" stroke="currentColor" strokeWidth="0.5" fill="currentColor" fillOpacity="0.1" />
    </svg>
  );
}

function MosqueSilhouette({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1200 300" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
      {/* Full mosque skyline silhouette */}
      {/* Central dome */}
      <path d="M500 300 L500 140 Q500 50 600 20 Q700 50 700 140 L700 300" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.03" />
      {/* Dome crescent finial */}
      <path d="M598 22 Q590 10 598 2 Q608 10 600 22" stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.08" />
      {/* Left minaret */}
      <path d="M380 300 L380 60 L385 55 Q390 45 395 55 L400 60 L400 300" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="390" cy="42" r="3" stroke="currentColor" strokeWidth="0.4" fill="currentColor" fillOpacity="0.06" />
      {/* Right minaret */}
      <path d="M800 300 L800 60 L805 55 Q810 45 815 55 L820 60 L820 300" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="810" cy="42" r="3" stroke="currentColor" strokeWidth="0.4" fill="currentColor" fillOpacity="0.06" />
      {/* Left small dome */}
      <path d="M420 300 L420 180 Q420 130 480 120 Q500 130 500 180 L500 300" stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.02" />
      {/* Right small dome */}
      <path d="M700 300 L700 180 Q700 130 760 120 Q780 130 780 180 L780 300" stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.02" />
      {/* Far left structure */}
      <path d="M200 300 L200 200 Q200 170 250 160 Q300 170 300 200 L300 300" stroke="currentColor" strokeWidth="0.4" fill="currentColor" fillOpacity="0.015" />
      {/* Far right structure */}
      <path d="M900 300 L900 200 Q900 170 950 160 Q1000 170 1000 200 L1000 300" stroke="currentColor" strokeWidth="0.4" fill="currentColor" fillOpacity="0.015" />
      {/* Horizontal ground line */}
      <line x1="0" y1="300" x2="1200" y2="300" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

function ZelligePattern({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <pattern id="zellige" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        {/* 8-pointed star (octagram) — core zellige motif */}
        <path d="M50 10 L58 30 L78 22 L66 40 L86 46 L66 52 L78 72 L58 64 L50 84 L42 64 L22 72 L34 52 L14 46 L34 40 L22 22 L42 30 Z" stroke="currentColor" strokeWidth="0.8" fill="none" />
        {/* Inner star */}
        <path d="M50 25 L55 38 L68 33 L60 44 L73 48 L60 52 L68 63 L55 58 L50 71 L45 58 L32 63 L40 52 L27 48 L40 44 L32 33 L45 38 Z" stroke="currentColor" strokeWidth="0.4" fill="currentColor" fillOpacity="0.04" />
        {/* Central octagon */}
        <path d="M44 40 L56 40 L62 48 L56 56 L44 56 L38 48 Z" stroke="currentColor" strokeWidth="0.5" fill="currentColor" fillOpacity="0.06" />
        {/* Corner rosettes */}
        <circle cx="0" cy="0" r="12" stroke="currentColor" strokeWidth="0.4" fill="none" />
        <circle cx="100" cy="0" r="12" stroke="currentColor" strokeWidth="0.4" fill="none" />
        <circle cx="0" cy="100" r="12" stroke="currentColor" strokeWidth="0.4" fill="none" />
        <circle cx="100" cy="100" r="12" stroke="currentColor" strokeWidth="0.4" fill="none" />
        {/* Cross connectors */}
        <path d="M50 0 L50 10" stroke="currentColor" strokeWidth="0.3" />
        <path d="M50 84 L50 100" stroke="currentColor" strokeWidth="0.3" />
        <path d="M0 50 L14 46" stroke="currentColor" strokeWidth="0.3" />
        <path d="M86 46 L100 50" stroke="currentColor" strokeWidth="0.3" />
      </pattern>
      <rect width="100" height="100" fill="url(#zellige)" />
    </svg>
  );
}

function RubElHizb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Rub el Hizb — ۞ — overlapping squares */}
      <rect x="20" y="20" width="60" height="60" transform="rotate(0 50 50)" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.04" />
      <rect x="20" y="20" width="60" height="60" transform="rotate(45 50 50)" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.04" />
      {/* Inner circle */}
      <circle cx="50" cy="50" r="16" stroke="currentColor" strokeWidth="0.8" fill="currentColor" fillOpacity="0.06" />
      <circle cx="50" cy="50" r="8" stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.1" />
      {/* Outer ring of dots */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 360) / 8 * (Math.PI / 180);
        const cx = 50 + 35 * Math.cos(angle);
        const cy = 50 + 35 * Math.sin(angle);
        return <circle key={i} cx={cx} cy={cy} r="2" fill="currentColor" fillOpacity="0.15" />;
      })}
    </svg>
  );
}

function GeometricBand({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1200 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <pattern id="geoBand" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        {/* Interlocking hexagons with stars */}
        <path d="M40 0 L70 20 L70 60 L40 80 L10 60 L10 20 Z" stroke="currentColor" strokeWidth="0.6" fill="none" />
        {/* 6-pointed star inside hexagon */}
        <path d="M40 15 L52 35 L40 55 L28 35 Z" stroke="currentColor" strokeWidth="0.4" fill="currentColor" fillOpacity="0.04" />
        <path d="M25 25 L55 25 L55 55 L25 55 Z" stroke="currentColor" strokeWidth="0.4" fill="none" transform="rotate(30 40 40)" />
        {/* Central dot */}
        <circle cx="40" cy="40" r="2" fill="currentColor" fillOpacity="0.15" />
      </pattern>
      <rect width="1200" height="80" fill="url(#geoBand)" />
    </svg>
  );
}

function ArchFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("h2-arch-frame", className)}>
      {/* Top arch SVG */}
      <svg className="h2-arch-frame-top" viewBox="0 0 400 80" fill="none" preserveAspectRatio="xMidYMin meet">
        <path d="M0 80 L0 50 Q0 10 60 5 Q120 0 180 5 Q195 7 200 0 Q205 7 220 5 Q280 0 340 5 Q400 10 400 50 L400 80" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M10 80 L10 52 Q10 16 65 11 Q125 6 182 11 Q196 13 200 6 Q204 13 218 11 Q275 6 335 11 Q390 16 390 52 L390 80" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.4" />
        {/* Keystone */}
        <circle cx="200" cy="6" r="4" stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.1" />
      </svg>
      <div className="h2-arch-frame-body">{children}</div>
    </div>
  );
}

export default function Home2() {
  const latestIssue = issues[0];
  const featuredArticle = articles[0];
  const recentArticles = articles.slice(1, 5);
  const latestQueries = queries.slice(0, 3);
  const featuredWriters = writers.slice(0, 4);
  const featuredTopics = topics.slice(0, 6);

  return (
    <div className="home2 flex flex-col">
      {/* ── Hero ── */}
      <section className="h2-hero relative overflow-hidden">
        {/* Zellige tile background */}
        <div className="h2-zellige-bg" aria-hidden="true" />
        {/* Mosque silhouette at bottom */}
        <MosqueSilhouette className="h2-mosque-silhouette" />
        {/* Geometric band at very top */}
        <GeometricBand className="h2-hero-topband" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32 lg:pb-28 relative z-10">
          {/* Bismillah with Rub el Hizb */}
          <div className="flex flex-col items-center mb-12">
            <RubElHizb className="h2-rub-el-hizb" />
            <div className="h2-bismillah-wrap">
              <span className="font-arabic text-2xl sm:text-3xl lg:text-4xl leading-none">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Left: Featured Article */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <span className="h2-issue-badge">{latestIssue.title}</span>
                <span className="text-xs text-[var(--h2-muted)]">Latest Issue</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.15] tracking-tight text-[var(--h2-text)]">
                {featuredArticle.title}
              </h1>

              <p className="text-lg text-[var(--h2-muted)] leading-relaxed font-serif">
                {featuredArticle.excerpt}
              </p>

              <div className="flex items-center gap-4 text-sm text-[var(--h2-muted)]">
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
                <Link href={`/articles/${featuredArticle.slug}`} className="h2-btn-primary">
                  Read Article <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href={`/issues/${latestIssue.id}`} className="h2-btn-outline">
                  View Full Issue
                </Link>
              </div>
            </div>

            {/* Right: More from this issue — inside arch frame */}
            <ArchFrame>
              <h2 className="h2-section-label">Also in this issue</h2>
              <div className="flex flex-col gap-3 mt-4">
                {recentArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="h2-article-card group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h2-topic-pill">{article.topic.name}</span>
                      <span className="text-xs text-[var(--h2-muted)]">{article.readingTime} min</span>
                    </div>
                    <h3 className="font-semibold text-[15px] leading-snug text-[var(--h2-text)] group-hover:text-[var(--h2-emerald)] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-[var(--h2-muted)] line-clamp-2">{article.excerpt}</p>
                    <span className="text-xs text-[var(--h2-muted)] mt-0.5">{article.writer.name}</span>
                  </Link>
                ))}
              </div>
            </ArchFrame>
          </div>
        </div>

        {/* Large arch at bottom of hero */}
        <MosqueArch className="h2-hero-bottom-arch" />
      </section>

      {/* ── Browse by Topic ── */}
      <section className="h2-section-dark relative overflow-hidden">
        <div className="h2-zellige-bg h2-zellige-bg--subtle" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--h2-text)]">Browse by Topic</h2>
              <p className="text-sm text-[var(--h2-muted)] mt-1">Explore 35 years of scholarship across key Islamic disciplines</p>
            </div>
            <Link href="/articles/topics" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:flex text-[var(--h2-muted)] hover:text-[var(--h2-text)]")}>
              All Topics <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {featuredTopics.map((topic) => (
              <Link key={topic.id} href={`/articles/topics/${topic.slug}`} className="h2-topic-card group">
                <div className="h2-topic-card-inner">
                  <h3 className="font-semibold text-[15px] text-[var(--h2-text)] group-hover:text-[var(--h2-emerald)] transition-colors">
                    {topic.name}
                  </h3>
                  <p className="text-sm text-[var(--h2-muted)] mt-1.5 line-clamp-2">{topic.description}</p>
                  <span className="text-xs text-[var(--h2-gold)] mt-3 font-medium">{topic.articleCount} articles</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reader Queries ── */}
      <section className="h2-section-darker relative overflow-hidden">
        <div className="h2-zellige-bg h2-zellige-bg--warm" aria-hidden="true" />
        <GeometricBand className="h2-section-topband" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--h2-text)]">Reader Queries</h2>
              <p className="text-sm text-[var(--h2-muted)] mt-1">Questions answered by our scholars on faith, practice, and life</p>
            </div>
            <Link href="/queries/topics" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:flex text-[var(--h2-muted)] hover:text-[var(--h2-text)]")}>
              All Queries <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {latestQueries.map((query) => (
              <Link key={query.id} href={`/articles/${query.slug}`} className="h2-query-card group">
                <span className="h2-topic-pill w-fit">{query.topic.name}</span>
                <h3 className="font-semibold leading-snug text-[var(--h2-text)] group-hover:text-[var(--h2-emerald)] transition-colors">{query.title}</h3>
                <p className="text-sm text-[var(--h2-muted)] line-clamp-2">{query.excerpt}</p>
                <div className="flex items-center gap-3 text-xs text-[var(--h2-muted)] mt-auto">
                  <span>{query.writer.name}</span>
                  <span>{query.readingTime} min read</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <GeometricBand className="h2-section-bottomband" />
      </section>

      {/* ── Featured Writers ── */}
      <section className="h2-section-dark relative overflow-hidden">
        <div className="h2-zellige-bg h2-zellige-bg--subtle" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--h2-text)]">Our Writers</h2>
              <p className="text-sm text-[var(--h2-muted)] mt-1">Scholars and thinkers contributing to the discourse</p>
            </div>
            <Link href="/articles/writers" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:flex text-[var(--h2-muted)] hover:text-[var(--h2-text)]")}>
              All Writers <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredWriters.map((writer) => (
              <Link key={writer.id} href={`/articles/writers/${writer.slug}`} className="h2-writer-card group">
                <div className="h2-writer-avatar">
                  <span className="text-xl font-semibold text-[var(--h2-gold)]">
                    {writer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-[var(--h2-text)] group-hover:text-[var(--h2-emerald)] transition-colors">{writer.name}</h3>
                <span className="text-xs text-[var(--h2-muted)] mt-1">{writer.articleCount} articles</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Archive CTA ── */}
      <section className="h2-archive relative overflow-hidden">
        <div className="h2-zellige-bg h2-zellige-bg--archive" aria-hidden="true" />
        <MosqueSilhouette className="h2-archive-mosque" />
        <div className="h2-archive-glow" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 lg:py-28 relative z-10">
          <div className="flex flex-col items-center text-center gap-5">
            <RubElHizb className="h2-archive-rub" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--h2-text)]">
              35 Years of Islamic Scholarship
            </h2>
            <p className="text-base text-[var(--h2-muted)] max-w-lg font-serif">
              Explore our complete archive of over 430 issues published since 1991,
              covering every major topic in Islamic thought and practice.
            </p>
            <div className="flex gap-3 pt-2">
              <Link href="/issues" className="h2-btn-emerald">
                Browse Archive <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/ebooks" className="h2-btn-outline">E-Books</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
