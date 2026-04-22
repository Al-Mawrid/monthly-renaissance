import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Unauthorized",
};

export default function UnauthorizedPage() {
  return (
    <div style={{ background: "var(--mr-cream)" }}>
      {/* Masthead strip */}
      <div
        className="border-b"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="mr-catalog">
            ERROR<span className="dot">·</span>№ 403
          </div>
          <div
            className="mr-eyebrow hidden sm:block"
            style={{ color: "var(--mr-saffron-700)" }}
          >
            — Restricted —
          </div>
          <div className="mr-catalog">ACCESS DENIED</div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-20">
        <div className="mx-auto max-w-md">
          <div className="text-center mb-8">
            <div
              className="mr-eyebrow mb-3"
              style={{ color: "var(--mr-clay-700)" }}
            >
              — Admittance Required —
            </div>
            <h1 className="font-serif text-[2.25rem] lg:text-[2.6rem] font-semibold leading-[1.05] tracking-tight">
              Access{" "}
              <em style={{ fontStyle: "italic", color: "var(--mr-clay-700)" }}>
                denied
              </em>
              .
            </h1>
            <p className="font-serif text-[15px] leading-relaxed text-[var(--mr-ink-soft)] mt-3">
              You do not have permission to view this page. Please contact an
              administrator if you believe this is an error.
            </p>
          </div>

          <div
            className="relative p-8 pt-10 text-center"
            style={{
              background: "var(--card)",
              border: "1px solid var(--foreground)",
            }}
          >
            <span className="mr-corner tl" />
            <span className="mr-corner tr" />
            <span className="mr-corner bl" />
            <span className="mr-corner br" />

            <div
              className="font-serif font-semibold leading-[0.9] tracking-[-0.04em] mb-2"
              style={{ fontSize: 96, color: "var(--mr-clay-700)" }}
            >
              403
            </div>

            <div className="mr-ornament my-4">
              <span className="mr-diamond" />
              <span className="mr-star" style={{ width: 12, height: 12 }} />
              <span className="mr-diamond" />
            </div>

            <div className="mr-eyebrow mb-5">The record is closed to you</div>

            <div className="flex gap-2.5 flex-wrap justify-center">
              <Link href="/" className="mr-btn mr-btn-primary">
                Return home <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/contact" className="mr-btn mr-btn-outline">
                Contact editor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
