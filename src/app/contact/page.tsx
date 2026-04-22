import { Mail, MapPin, Globe } from "lucide-react";

export const metadata = {
  title: "Contact",
  description: "Get in touch with the Monthly Renaissance team.",
};

const rows = [
  {
    icon: Mail,
    label: "Editorial desk",
    title: "Email",
    body: "For general inquiries, article submissions, or feedback.",
    link: { href: "mailto:info@monthly-renaissance.com", text: "info@monthly-renaissance.com" },
  },
  {
    icon: Globe,
    label: "Publisher",
    title: "Al-Mawrid Institute",
    body: "Monthly Renaissance is published by Al-Mawrid Institute of Islamic Sciences.",
  },
  {
    icon: MapPin,
    label: "Correspondence",
    title: "Address",
    body: "Al-Mawrid Institute of Islamic Sciences\n51-K, Model Town, Lahore, Pakistan",
  },
];

export default function ContactPage() {
  return (
    <div>
      <div className="border-b" style={{ borderColor: "var(--foreground)" }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10 py-14">
          <div className="mr-eyebrow mb-2.5" style={{ color: "var(--mr-saffron-700)" }}>
            — Correspondence —
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight leading-none">
            Contact the journal
          </h1>
          <p className="font-serif text-[17px] text-muted-foreground mt-4 max-w-xl leading-relaxed">
            We welcome your feedback, questions, and suggestions — from readers, librarians, and scholars alike.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10 py-12">
        <div
          className="grid grid-cols-1"
          style={{ gap: 1, background: "var(--border)", border: "1px solid var(--border)" }}
        >
          {rows.map(({ icon: Icon, label, title, body, link }) => (
            <div
              key={title}
              className="flex items-start gap-5 p-7 border-l-[3px] border-transparent hover:border-l-[var(--mr-saffron-700)] transition-colors"
              style={{ background: "var(--card)" }}
            >
              <Icon className="h-5 w-5 mt-1 flex-shrink-0" style={{ color: "var(--mr-green-700)" }} />
              <div className="flex-1">
                <div className="mr-eyebrow mb-1.5">{label}</div>
                <h2 className="font-serif text-xl font-semibold">{title}</h2>
                <p className="text-[14px] text-muted-foreground mt-1.5 leading-relaxed whitespace-pre-line">
                  {body}
                </p>
                {link && (
                  <a href={link.href} className="mr-link inline-block text-[13px] mt-2.5 font-medium" style={{ color: "var(--mr-green-700)" }}>
                    {link.text} →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
