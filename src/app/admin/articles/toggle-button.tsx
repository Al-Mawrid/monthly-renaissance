"use client";

import { useTransition } from "react";
import { toggleArticleDisplay, toggleQueryDisplay, toggleIssueDisplay, toggleWriterDisplay, toggleTopicDisplay, toggleBookDisplay } from "../actions";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { useRegisterUndo } from "../undo-context";

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
  const [isPending, startTransition] = useTransition();
  const registerUndo = useRegisterUndo();

  function handleClick() {
    startTransition(async () => {
      await action(id);
      registerUndo(() => {
        startTransition(async () => {
          await action(id);
        });
      });
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Eye className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">Toggle display</span>
    </Button>
  );
}
