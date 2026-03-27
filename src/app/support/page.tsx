import { Heart, CreditCard, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Support Us",
  description: "Support Monthly Renaissance and help sustain Islamic scholarship.",
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="text-center mb-10">
        <Heart className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold tracking-tight">Support Us</h1>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
          Monthly Renaissance is a non-profit publication. Your support helps us
          continue producing quality Islamic scholarship for readers worldwide.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <CreditCard className="h-8 w-8 text-primary mx-auto mb-3" />
          <h2 className="font-semibold text-lg">One-Time Donation</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Make a one-time contribution of any amount to support our ongoing
            work.
          </p>
          <Button className="mt-4 bg-primary hover:bg-teal-dark">
            Donate Now
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
          <h2 className="font-semibold text-lg">Subscribe</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Subscribe to receive the journal and support our mission through
            your subscription.
          </p>
          <Button variant="outline" className="mt-4">
            Subscribe
          </Button>
        </div>
      </div>

      <Separator className="my-10" />

      <div className="text-center">
        <h2 className="font-semibold text-lg mb-2">Other Ways to Help</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Share our articles with friends and family, link to our content from
          your website, or reach out to discuss partnership opportunities.
        </p>
      </div>
    </div>
  );
}
