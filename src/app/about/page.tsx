import { BookOpen, Globe, Users, Library } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "About",
  description: "Learn about Monthly Renaissance and its mission.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight">Our Mission</h1>

      <div className="mt-8 font-serif text-lg leading-relaxed text-foreground/90 space-y-5">
        <p>
          <strong>Monthly Renaissance</strong> (ISSN 1605-0045) is a journal of
          Islamic research and information published by the Al-Mawrid Institute
          of Islamic Sciences. Since its founding in March 1991, it has served as
          a platform for rigorous yet accessible Islamic scholarship in the
          English language.
        </p>

        <p>
          The journal presents Islam as understood through a direct study of its
          primary sources — the Quran and the Sunnah — employing a methodology
          rooted in classical Arabic linguistics, established principles of
          interpretation, and coherent rational analysis.
        </p>

        <p>
          Our mission is to make authentic Islamic scholarship accessible to
          English-speaking audiences worldwide, providing thoughtful and
          well-researched perspectives on matters of faith, practice, ethics, and
          contemporary relevance.
        </p>
      </div>

      <Separator className="my-10" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Library, label: "Issues Published", value: "430+" },
          { icon: BookOpen, label: "Years of Publication", value: "35" },
          { icon: Users, label: "Contributing Scholars", value: "23" },
          { icon: Globe, label: "Topics Covered", value: "32" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-10" />

      <div className="font-serif text-lg leading-relaxed text-foreground/90 space-y-5">
        <h2 className="font-sans text-xl font-semibold">Our Approach</h2>
        <p>
          Renaissance is distinguished by its commitment to presenting Islamic
          teachings through a coherent and systematic framework. Each article
          undergoes careful editorial review to ensure scholarly rigor while
          maintaining readability for a general audience.
        </p>
        <p>
          The journal covers a wide range of topics including Quranic exegesis,
          Hadith studies, Islamic jurisprudence, ethics, history, interfaith
          dialogue, and contemporary issues facing Muslim communities globally.
        </p>
        <p>
          We believe that informed understanding leads to better practice, and
          that the rich intellectual tradition of Islam deserves to be presented
          with both authenticity and clarity.
        </p>
      </div>
    </div>
  );
}
