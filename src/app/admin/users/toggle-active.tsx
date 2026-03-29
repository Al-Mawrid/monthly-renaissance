"use client";

import { toggleUserActive } from "../actions";
import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";

export function ToggleActiveButton({ userId }: { userId: string }) {
  return (
    <form action={() => toggleUserActive(userId)}>
      <Button variant="ghost" size="sm" type="submit" className="h-7 w-7 p-0">
        <UserX className="h-3.5 w-3.5" />
        <span className="sr-only">Toggle active</span>
      </Button>
    </form>
  );
}
