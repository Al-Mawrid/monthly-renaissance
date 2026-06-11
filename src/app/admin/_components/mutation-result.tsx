"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

export function MutationError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function MutationRequested({
  message = "Change request submitted for admin review.",
}: {
  message?: string;
}) {
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>{message}</span>
    </div>
  );
}
