"use client";

import { useState, useTransition } from "react";
import { createWriter } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus } from "lucide-react";
import { MutationError, MutationRequested } from "@/app/admin/_components/mutation-result";

export type Writer = { id: number; name: string };

export function WriterSelect({
  label,
  value,
  onValueChange,
  writers,
  onWriterCreated,
  isTeam,
  placeholder = "Select writer",
  includeNone = false,
  noneLabel = "None",
  defaultQueryWriter = false,
}: {
  label: React.ReactNode;
  value: string;
  onValueChange: (v: string) => void;
  writers: Writer[];
  onWriterCreated: (w: Writer) => void;
  isTeam: boolean;
  placeholder?: string;
  includeNone?: boolean;
  noneLabel?: string;
  defaultQueryWriter?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = writers.filter((w) => {
    const q = search.toLowerCase();
    return w.name.toLowerCase().includes(q) || String(w.id).includes(q);
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Plus className="size-3" />
          New writer
        </button>
      </div>

      <Select
        value={value}
        onValueChange={(v) => v && onValueChange(v)}
        onOpenChange={(open) => { if (!open) setSearch(""); }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {(v) =>
              includeNone && v === "none"
                ? noneLabel
                : writers.find((w) => String(w.id) === v)?.name ?? placeholder
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          alignItemWithTrigger={false}
          header={
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <Search className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Search writers..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          }
        >
          {includeNone && <SelectItem value="none">{noneLabel}</SelectItem>}
          {filtered.length > 0 ? (
            filtered.map((w) => (
              <SelectItem key={w.id} value={String(w.id)}>#{w.id} — {w.name}</SelectItem>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">No writers found</div>
          )}
        </SelectContent>
      </Select>

      <NewWriterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isTeam={isTeam}
        defaultQueryWriter={defaultQueryWriter}
        onCreated={(w) => {
          onWriterCreated(w);
          onValueChange(String(w.id));
        }}
      />
    </div>
  );
}

function NewWriterDialog({
  open,
  onOpenChange,
  isTeam,
  defaultQueryWriter,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTeam: boolean;
  defaultQueryWriter: boolean;
  onCreated: (w: Writer) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isQueryWriter, setIsQueryWriter] = useState(defaultQueryWriter);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setIsQueryWriter(defaultQueryWriter);
    setErrorMsg(null);
    setRequested(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleCreate() {
    if (!name.trim()) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const result = await createWriter({
          name: name.trim(),
          email: email.trim() || undefined,
          isQueryWriter,
        });
        if (result.ok === false) {
          setErrorMsg(result.error || "Failed to create writer.");
          return;
        }
        if ("requested" in result) {
          setRequested(true);
          return;
        }
        onCreated(result.writer);
        handleOpenChange(false);
      } catch {
        setErrorMsg("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New writer</DialogTitle>
          <DialogDescription>
            {isTeam
              ? "Submit a new writer for admin approval."
              : "Add a writer without leaving this form."}
          </DialogDescription>
        </DialogHeader>

        {requested ? (
          <div className="space-y-4">
            <MutationRequested message="Writer submitted for admin approval. It'll be selectable once an admin approves it." />
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-writer-name">Name</Label>
              <Input
                id="new-writer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Writer name"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && name.trim() && !pending) handleCreate(); }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-writer-email">Email <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="new-writer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="writer@example.com"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isQueryWriter}
                onChange={(e) => setIsQueryWriter(e.target.checked)}
                className="rounded"
              />
              Query writer (can be assigned to queries)
            </label>

            {errorMsg && <MutationError message={errorMsg} />}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={pending || !name.trim()}>
                {pending ? "Saving..." : isTeam ? "Submit Request" : "Add Writer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
