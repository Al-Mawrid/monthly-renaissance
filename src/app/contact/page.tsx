import { Mail, MapPin, Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Contact",
  description: "Get in touch with the Monthly Renaissance team.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
      <p className="text-muted-foreground mt-2">
        We welcome your feedback, questions, and suggestions.
      </p>

      <Separator className="my-8" />

      <div className="space-y-6">
        <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
          <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="font-semibold">Email</h2>
            <p className="text-sm text-muted-foreground mt-1">
              For general inquiries, article submissions, or feedback:
            </p>
            <a
              href="mailto:info@monthly-renaissance.com"
              className="text-sm text-primary hover:underline mt-1 block"
            >
              info@monthly-renaissance.com
            </a>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
          <Globe className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="font-semibold">Al-Mawrid Institute</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Monthly Renaissance is published by Al-Mawrid Institute of Islamic
              Sciences.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
          <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="font-semibold">Address</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Al-Mawrid Institute of Islamic Sciences
              <br />
              51-K, Model Town, Lahore, Pakistan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
