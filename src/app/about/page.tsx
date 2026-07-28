import { BookOpen, Globe, Users, Library } from "lucide-react";

export const metadata = {
  title: "About",
  description: "Learn about Monthly Renaissance and its mission.",
};

const stats = [
  { icon: Library, label: "Issues published", value: "430+" },
  { icon: BookOpen, label: "Years in print", value: "35" },
  { icon: Users, label: "Contributing scholars", value: "23" },
  { icon: Globe, label: "Topics covered", value: "32" },
];

export default function AboutPage() {
  return (
    <div>
      <div className="border-b" style={{ borderColor: "var(--foreground)" }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10 py-14">
          <div className="mr-catalog mb-3">ISSN 1605-0045 · EST. 1991</div>
          <div className="mr-eyebrow mb-2.5" style={{ color: "var(--mr-saffron-700)" }}>
            — About the journal —
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold tracking-tight leading-[1.05]">
            A monthly record of{" "}
            <em className="not-italic" style={{ fontStyle: "italic", color: "var(--mr-green-800)" }}>
              Islamic scholarship
            </em>
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-10 py-12">
        <div className="article-content">
          <p>
            <strong>Monthly Renaissance</strong> is a journal of Islamic research and information published
            by the Al-Mawrid Institute of Islamic Sciences. Since its founding in March 1991, it has served
            as a platform for rigorous yet accessible Islamic scholarship in the English language.
          </p>
          <p>
            The journal presents Islam as understood through a direct study of its primary sources — the
            Qur'an and the Sunnah — employing a methodology rooted in classical Arabic linguistics,
            established principles of interpretation, and coherent rational analysis.
          </p>
          <p>
            Our mission is to make authentic Islamic scholarship accessible to English-speaking audiences
            worldwide — providing thoughtful, well-researched perspectives on matters of faith, practice,
            ethics, and contemporary relevance.
          </p>
        </div>

        <div className="mr-ornament my-10">
          <span className="mr-diamond" />
          <span className="mr-star" style={{ width: 12, height: 12 }} />
          <span className="mr-diamond" />
        </div>

        <div
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{ gap: 1, background: "var(--border)", border: "1px solid var(--border)" }}
        >
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-start gap-2 p-6" style={{ background: "var(--card)" }}>
              <s.icon className="h-5 w-5" style={{ color: "var(--mr-saffron-700)" }} />
              <div
                className="font-serif font-semibold leading-none"
                style={{ fontSize: 40, color: "var(--mr-clay-700)" }}
              >
                {s.value}
              </div>
              <div className="mr-eyebrow">{s.label}</div>
            </div>
          ))}
        </div>

        <h2 className="font-serif text-2xl font-semibold mt-14 mb-4 flex items-center gap-3">
          <span className="mr-star" style={{ width: 12, height: 12 }} />
          Our approach
        </h2>
        <div className="article-content">
          <p>
            Renaissance is distinguished by its commitment to presenting Islamic teachings through a
            coherent and systematic framework. Each article undergoes careful editorial review to ensure
            scholarly rigor while maintaining readability for a general audience.
          </p>
          <p>
            The journal covers a wide range of topics — Qur'anic exegesis, Hadith studies, Islamic
            jurisprudence, ethics, history, interfaith dialogue, and contemporary issues facing Muslim
            communities globally.
          </p>
          <p>
            We believe that informed understanding leads to better practice, and that the rich
            intellectual tradition of Islam deserves to be presented with both authenticity and clarity.
          </p>
        </div>
      </div>
    </div>
  );
}
