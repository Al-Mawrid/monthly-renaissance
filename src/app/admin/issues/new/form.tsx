"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createIssue } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MutationError, MutationRequested } from "@/app/admin/_components/mutation-result";

export function IssueCreateForm({ isTeam }: { isTeam: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [volumeNumber, setVolumeNumber] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [isSpecial, setIsSpecial] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  function generateSlug(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function handleSave() {
    if (!title) return;
    setErrorMsg(null);
    setRequested(false);

    startTransition(async () => {
      try {
        const result = await createIssue({
          title,
          slug: generateSlug(title),
          volumeNumber: volumeNumber || undefined,
          issueNumber: issueNumber || undefined,
          issueDate: issueDate || undefined,
          isSpecial,
        });
        if (result && "ok" in result && result.ok === false) {
          setErrorMsg(result.error || "Failed to create issue.");
          return;
        }
        if (result && "requested" in result && result.requested) {
          setRequested(true);
          return;
        }
        router.push("/admin/issues");
      } catch {
        setErrorMsg("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Issue title" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="volume">Volume Number</Label>
          <Input id="volume" value={volumeNumber} onChange={(e) => setVolumeNumber(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="issueNum">Issue Number</Label>
          <Input id="issueNum" value={issueNumber} onChange={(e) => setIssueNumber(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Issue Date</Label>
        <Input id="date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isSpecial} onChange={(e) => setIsSpecial(e.target.checked)} className="rounded" />
        Special issue
      </label>

      {isTeam && (
        <p className="mr-callout">
          As a team member, this will be submitted as a change request for admin approval.
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={pending || !title}>
          {pending ? "Submitting..." : isTeam ? "Submit Request" : "Create Issue"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/issues")}>Cancel</Button>
      </div>

      {errorMsg && <MutationError message={errorMsg} />}
      {requested && <MutationRequested />}
    </div>
  );
}
