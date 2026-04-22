import { Heart, CreditCard, Mail, Share2 } from "lucide-react";

export const metadata = {
  title: "Support Us",
  description: "Support Monthly Renaissance and help sustain Islamic scholarship.",
};

const ways = [
  {
    icon: CreditCard,
    label: "Direct",
    title: "One-time donation",
    body: "Make a one-time contribution of any amount toward our ongoing editorial and archive work.",
    cta: { text: "Donate now →", primary: true },
  },
  {
    icon: Mail,
    label: "Recurring",
    title: "Subscribe",
    body: "Subscribe to receive the journal and support our mission through a standing contribution.",
    cta: { text: "Subscribe →", primary: false },
  },
  {
    icon: Share2,
    label: "Participate",
    title: "Share the work",
    body: "Share our articles, link to our archive, or reach out about partnerships and reprints.",
  },
];

export default function SupportPage() {
  return (
    <div>
      <div className="border-b" style={{ borderColor: "var(--foreground)" }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10 py-14">
          <div className="mr-eyebrow mb-2.5" style={{ color: "var(--mr-saffron-700)" }}>
            — Sustaining the journal —
          </div>
          <div className="flex items-start gap-4">
            <Heart className="h-8 w-8 mt-2 flex-shrink-0" style={{ color: "var(--mr-clay-700)" }} />
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight leading-none">
                Support the record
              </h1>
              <p className="font-serif text-[17px] text-muted-foreground mt-4 max-w-xl leading-relaxed">
                Monthly Renaissance is a non-profit publication. Your support helps us continue producing
                quality Islamic scholarship for readers worldwide — and keep the full archive free to read.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10 py-12">
        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: 1, background: "var(--border)", border: "1px solid var(--border)" }}
        >
          {ways.map(({ icon: Icon, label, title, body, cta }) => (
            <div
              key={title}
              className="mr-hover-card flex flex-col gap-3 p-7"
              style={{ background: "var(--card)" }}
            >
              <Icon className="h-6 w-6" style={{ color: "var(--mr-green-700)" }} />
              <div className="mr-eyebrow">{label}</div>
              <h2 className="font-serif text-xl font-semibold">{title}</h2>
              <p className="text-[14px] text-muted-foreground leading-relaxed">{body}</p>
              {cta && (
                <button
                  className={`mt-3 self-start mr-btn ${cta.primary ? "mr-btn-primary" : "mr-btn-outline"}`}
                >
                  {cta.text}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
