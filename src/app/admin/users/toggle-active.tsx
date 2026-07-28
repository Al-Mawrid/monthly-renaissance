"use client";

import { useTransition } from "react";
import { toggleUserActive } from "../actions";
import { Button } from "@/components/ui/button";
import { Loader2, UserX } from "lucide-react";

export function ToggleActiveButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form action={() => startTransition(() => toggleUserActive(userId))}>
      <Button variant="ghost" size="sm" type="submit" className="h-7 w-7 p-0" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <UserX className="h-3.5 w-3.5" />
        )}
        <span className="sr-only">Toggle active</span>
      </Button>
    </form>
  );
}
