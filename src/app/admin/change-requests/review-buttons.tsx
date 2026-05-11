"use client";

import { useState } from "react";
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
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        className="mr-icon-btn mr-icon-btn-approve"
        onClick={handleApprove}
        disabled={loading}
        aria-label="Approve"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="mr-icon-btn mr-icon-btn-reject"
        onClick={handleReject}
        disabled={loading}
        aria-label="Reject"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
