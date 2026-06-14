"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { FeedbackDialog } from "./feedback-dialog";

export type FeedbackType = "PROBLEM" | "SUGGESTION";

export type FeedbackContextValue = {
  kind?: "page" | "article";
  articleId?: number;
  articleSlug?: string;
  /** Human label shown in the dialog (display only, not stored). */
  label?: string;
  defaultType?: FeedbackType;
};

type FeedbackApi = { open: (context?: FeedbackContextValue) => void };

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used inside <FeedbackProvider>");
  }
  return ctx;
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<FeedbackContextValue | undefined>(undefined);

  const openDialog = useCallback((c?: FeedbackContextValue) => {
    setContext(c);
    setOpen(true);
  }, []);

  const api = useMemo<FeedbackApi>(() => ({ open: openDialog }), [openDialog]);

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      <FeedbackDialog open={open} onOpenChange={setOpen} context={context} />
    </FeedbackContext.Provider>
  );
}
