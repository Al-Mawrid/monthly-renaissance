"use client";

import { createContext, useContext, useEffect, useRef, useCallback } from "react";

type UndoFn = () => void;

const UndoContext = createContext<(fn: UndoFn) => void>(() => {});

export function UndoProvider({ children }: { children: React.ReactNode }) {
  const undoRef = useRef<UndoFn | null>(null);

  const registerUndo = useCallback((fn: UndoFn) => {
    undoRef.current = fn;
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        const undo = undoRef.current;
        if (undo) {
          e.preventDefault();
          undoRef.current = null;
          undo();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <UndoContext.Provider value={registerUndo}>{children}</UndoContext.Provider>;
}

export function useRegisterUndo() {
  return useContext(UndoContext);
}
