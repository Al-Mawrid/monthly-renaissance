import { signIn } from "@/lib/auth";

export const metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <div style={{ background: "var(--mr-cream)" }}>
      {/* Masthead strip */}
      <div
        className="border-b"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="mr-catalog">
            ACCESS<span className="dot">·</span>MEMBER RECORD
          </div>
          <div
            className="mr-eyebrow hidden sm:block"
            style={{ color: "var(--mr-saffron-700)" }}
          >
            — Est. MCMXCI —
          </div>
          <div className="mr-catalog">AUTHENTICATION</div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-20">
        <div className="mx-auto max-w-md">
          <div className="text-center mb-8">
            <div
              className="mr-eyebrow mb-3"
              style={{ color: "var(--mr-saffron-700)" }}
            >
              — Members’ Entrance —
            </div>
            <h1 className="font-serif text-[2.25rem] lg:text-[2.6rem] font-semibold leading-[1.05] tracking-tight">
              Welcome{" "}
              <em style={{ fontStyle: "italic", color: "var(--mr-green-800)" }}>
                back
              </em>
              .
            </h1>
            <p className="font-serif text-[15px] leading-relaxed text-[var(--mr-ink-soft)] mt-3">
              Sign in to access your reading record and contributions.
            </p>
          </div>

          {/* Illuminated plate */}
          <div
            className="relative p-8 pt-10"
            style={{
              background: "var(--card)",
              border: "1px solid var(--foreground)",
            }}
          >
            <span className="mr-corner tl" />
            <span className="mr-corner tr" />
            <span className="mr-corner bl" />
            <span className="mr-corner br" />

            <div className="mr-eyebrow text-center mb-4">Continue with</div>

            <div className="mr-ornament mb-5">
              <span className="mr-diamond" />
              <span className="mr-star" style={{ width: 12, height: 12 }} />
              <span className="mr-diamond" />
            </div>

            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="mr-btn mr-btn-outline w-full justify-center gap-3 py-3"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>
            </form>

            <p className="font-serif text-[12px] italic text-center text-muted-foreground mt-6">
              By signing in, you agree to our terms and privacy policy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
