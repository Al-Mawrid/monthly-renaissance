"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Flag, Lightbulb } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { submitFeedback } from "./actions";
import type { FeedbackContextValue, FeedbackType } from "./feedback-provider";

const TYPES: { value: FeedbackType; label: string; icon: typeof Flag; hint: string }[] = [
  { value: "PROBLEM", label: "Report a problem", icon: Flag, hint: "Something looks wrong or broken" },
  { value: "SUGGESTION", label: "Make a suggestion", icon: Lightbulb, hint: "An idea or improvement" },
];

const MAX = 5000;

export function FeedbackDialog({
  open,
  onOpenChange,
  context,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: FeedbackContextValue;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* The form is only mounted while open, so its state resets on each
            open — no reset effect needed. */}
        <FeedbackForm context={context} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function FeedbackForm({
  context,
  onClose,
}: {
  context?: FeedbackContextValue;
  onClose: () => void;
}) {
  const [type, setType] = useState<FeedbackType>(context?.defaultType ?? "PROBLEM");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!message.trim()) {
      setError("Please describe the problem or suggestion.");
      return;
    }

    const ctxPayload = context?.kind
      ? {
          kind: context.kind,
          ...(context.articleId ? { articleId: context.articleId } : {}),
          ...(context.articleSlug ? { articleSlug: context.articleSlug } : {}),
        }
      : undefined;

    const payload = {
      type,
      message: message.trim(),
      email: email.trim() || undefined,
      pageUrl: typeof window !== "undefined" ? window.location.href.slice(0, 500) : undefined,
      pageTitle: typeof document !== "undefined" ? document.title.slice(0, 300) : undefined,
      context: ctxPayload,
      website,
    };

    startTransition(async () => {
      const res = await submitFeedback(payload);
      if (res.ok) setDone(true);
      else setError(res.error);
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="h-10 w-10" style={{ color: "var(--mr-green-700)" }} />
        <DialogTitle className="font-serif text-lg">Thank you</DialogTitle>
        <DialogDescription className="max-w-xs">
          Your message has reached the editorial desk. We read every note, and
          follow up by email where one was provided.
        </DialogDescription>
        <Button className="mt-2" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="font-serif text-lg">Report a problem or suggestion</DialogTitle>
        <DialogDescription>
          {context?.label
            ? `About: ${context.label}`
            : "Spotted an error, a broken link, or have an idea? Tell us here."}
        </DialogDescription>
      </DialogHeader>

      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2">
        {TYPES.map((t) => {
          const active = type === t.value;
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-colors",
                active
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted/50",
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Icon className="h-4 w-4" />
                {t.label}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground">{t.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="feedback-message">
          {type === "PROBLEM" ? "What went wrong?" : "Your suggestion"}
        </Label>
        <Textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
          rows={5}
          required
          autoFocus
          placeholder={
            type === "PROBLEM"
              ? "Describe the problem and where you saw it…"
              : "Tell us your idea…"
          }
        />
        <div className="text-right text-[11px] text-muted-foreground">
          {message.length}/{MAX}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="feedback-email">
          Email <span className="font-normal text-muted-foreground">(optional, for a reply)</span>
        </Label>
        <Input
          id="feedback-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      {/* Honeypot — hidden from real users */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="feedback-website">Leave this field empty</label>
        <input
          id="feedback-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || !message.trim()}>
          {pending ? "Sending…" : "Send"}
        </Button>
      </div>
    </form>
  );
}
