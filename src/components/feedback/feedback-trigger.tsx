"use client";

import { useFeedback, type FeedbackContextValue } from "./feedback-provider";

type Variant = "footer" | "article" | "plain";

export function FeedbackTrigger({
  variant = "plain",
  context,
  className,
  children,
}: {
  variant?: Variant;
  context?: FeedbackContextValue;
  className?: string;
  children?: React.ReactNode;
}) {
  const { open } = useFeedback();

  if (variant === "footer") {
    return (
      <button
        type="button"
        onClick={() => open(context)}
        className="mr-footer-link text-[13px] text-muted-foreground py-1 text-left"
      >
        {children ?? "Report a Problem"}
      </button>
    );
  }

  if (variant === "article") {
    return (
      <button
        type="button"
        onClick={() => open(context)}
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="inline-block w-5 font-mono" style={{ color: "var(--mr-saffron-700)" }}>
          ⚑
        </span>
        {children ?? "Report a problem"}
      </button>
    );
  }

  return (
    <button type="button" onClick={() => open(context)} className={className}>
      {children}
    </button>
  );
}
