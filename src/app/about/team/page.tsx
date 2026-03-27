import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Team",
  description: "Meet the team behind Monthly Renaissance.",
};

const team = [
  {
    name: "Javed Ahmad Ghamidi",
    role: "Chief Editor & Founder",
    bio: "Renowned Pakistani Muslim theologian, Quran scholar, and founding president of Al-Mawrid Institute of Islamic Sciences. His scholarly framework forms the intellectual foundation of the journal.",
  },
  {
    name: "Shehzad Saleem",
    role: "Editor",
    bio: "Noted scholar, author, and translator who has been instrumental in making Ghamidi's scholarship accessible to English-speaking audiences.",
  },
  {
    name: "Dr. Shehzad Saleem",
    role: "Senior Contributor",
    bio: "A prominent scholar specializing in Quranic studies and Islamic jurisprudence.",
  },
  {
    name: "Jhangeer Hanif",
    role: "Research Scholar",
    bio: "Research scholar at Al-Mawrid and regular contributor on topics of Islamic law, ethics, and contemporary issues.",
  },
  {
    name: "Tariq Mahmood Hashmi",
    role: "Contributor",
    bio: "Scholar and writer contributing extensively to the discourse on Hadith studies and Islamic history.",
  },
];

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight">Our Team</h1>
      <p className="text-muted-foreground mt-2">
        The scholars and editors behind Monthly Renaissance.
      </p>

      <Separator className="my-8" />

      <div className="space-y-6">
        {team.map((member) => (
          <div
            key={member.name}
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-5"
          >
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold text-primary">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            </div>
            <div>
              <h2 className="font-semibold">{member.name}</h2>
              <span className="text-sm text-primary">{member.role}</span>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {member.bio}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
