"use client";

import { toggleArticleDisplay, toggleQueryDisplay, toggleIssueDisplay, toggleWriterDisplay, toggleTopicDisplay, toggleBookDisplay } from "../actions";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

const toggleFns = {
  article: toggleArticleDisplay,
  query: toggleQueryDisplay,
  issue: toggleIssueDisplay,
  writer: toggleWriterDisplay,
  topic: toggleTopicDisplay,
  book: toggleBookDisplay,
};

export function ToggleDisplayButton({
  id,
  type,
}: {
  id: number;
  type: keyof typeof toggleFns;
}) {
  const action = toggleFns[type];

  return (
    <form action={() => action(id)}>
      <Button variant="ghost" size="sm" type="submit" className="h-7 w-7 p-0">
        <Eye className="h-3.5 w-3.5" />
        <span className="sr-only">Toggle display</span>
      </Button>
    </form>
  );
}
