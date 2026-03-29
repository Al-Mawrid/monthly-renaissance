"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteArticle, deleteQuery, deleteIssue, deleteBook } from "./actions";

const deleteFns = {
  article: deleteArticle,
  query: deleteQuery,
  issue: deleteIssue,
  book: deleteBook,
};

export function DeleteButton({
  id,
  type,
  title,
  isTeam = false,
}: {
  id: number;
  type: keyof typeof deleteFns;
  title: string;
  isTeam?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const action = deleteFns[type];

  async function handleDelete() {
    setLoading(true);
    try {
      await action(id);
      setOpen(false);
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center justify-center h-7 w-7 p-0 rounded-md text-destructive hover:text-destructive hover:bg-accent transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sr-only">Delete</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isTeam ? "Request Deletion" : "Delete"} {type}
          </DialogTitle>
          <DialogDescription>
            {isTeam
              ? `Your request to delete "${title}" will be sent to an admin for approval.`
              : `Are you sure you want to delete "${title}"? This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading
              ? "Processing..."
              : isTeam
                ? "Submit Request"
                : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
