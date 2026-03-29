"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { approveChangeRequest, rejectChangeRequest } from "../actions";

export function ReviewButtons({ requestId }: { requestId: number }) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      await approveChangeRequest(requestId);
    } catch {
      setLoading(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    try {
      await rejectChangeRequest(requestId);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
        onClick={handleApprove}
        disabled={loading}
      >
        <Check className="h-3.5 w-3.5" />
        <span className="sr-only">Approve</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        onClick={handleReject}
        disabled={loading}
      >
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Reject</span>
      </Button>
    </div>
  );
}
