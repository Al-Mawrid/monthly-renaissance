"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { approveChangeRequest, rejectChangeRequest } from "../actions";
import { MutationError } from "@/app/admin/_components/mutation-result";

export function ReviewButtons({ requestId }: { requestId: number }) {
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function run(action: "approve" | "reject", fn: () => Promise<unknown>) {
    setErrorMsg(null);
    setPendingAction(action);
    startTransition(async () => {
      try {
        const result = (await fn()) as
          | { ok: true; applied?: true; requested?: true }
          | { ok: false; error: string }
          | undefined;
        if (result && "ok" in result && result.ok === false) {
          setErrorMsg(result.error || "Action failed.");
        }
      } catch {
        setErrorMsg("Action failed.");
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="mr-icon-btn mr-icon-btn-approve"
          onClick={() => run("approve", () => approveChangeRequest(requestId))}
          disabled={pending}
          aria-label="Approve"
        >
          {pendingAction === "approve" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          className="mr-icon-btn mr-icon-btn-reject"
          onClick={() => run("reject", () => rejectChangeRequest(requestId))}
          disabled={pending}
          aria-label="Reject"
        >
          {pendingAction === "reject" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      {errorMsg && (
        <div className="w-72">
          <MutationError message={errorMsg} />
        </div>
      )}
    </div>
  );
}
