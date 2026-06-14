"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateFeedback, deleteFeedback } from "../actions";

const STATUS_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "DISMISSED", label: "Dismissed" },
];

export function FeedbackControls({
  id,
  status,
  adminNote,
  isAdmin,
}: {
  id: number;
  status: string;
  adminNote: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [statusVal, setStatusVal] = useState(status);
  const [note, setNote] = useState(adminNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dirty = statusVal !== status || note !== (adminNote ?? "");

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateFeedback(id, {
        status: statusVal,
        adminNote: note.trim() ? note.trim() : null,
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await deleteFeedback(id);
      if (res.ok) {
        setDeleteOpen(false);
        router.refresh();
      } else {
        setError(res.error);
        setDeleting(false);
      }
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-4 py-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Status</span>
          <Select value={statusVal} onValueChange={(v) => v && setStatusVal(v)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <span className="text-xs text-muted-foreground">Internal note</span>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Notes for the team (not shown to the reporter)…"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {saved && !dirty && <span className="text-xs text-muted-foreground">Saved</span>}
        {error && <span className="text-xs text-destructive">{error}</span>}

        {isAdmin && (
          <div className="ml-auto">
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger className="inline-flex items-center gap-1.5 text-xs text-destructive hover:underline">
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete feedback</DialogTitle>
                  <DialogDescription>
                    This permanently removes this submission. This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                    {deleting ? "Deleting…" : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
