"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateIssue } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MutationError, MutationRequested } from "@/app/admin/_components/mutation-result";

type Issue = {
  id: number;
  title: string;
  volumeNumber: string | null;
  issueNumber: string | null;
  issueDate: Date | null;
  display: boolean;
  isSpecial: boolean;
};

export function IssueEditForm({ issue, isTeam }: { issue: Issue; isTeam: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(issue.title);
  const [volumeNumber, setVolumeNumber] = useState(issue.volumeNumber ?? "");
  const [issueNumber, setIssueNumber] = useState(issue.issueNumber ?? "");
  const [issueDate, setIssueDate] = useState(issue.issueDate?.toISOString().split("T")[0] ?? "");
  const [display, setDisplay] = useState(issue.display);
  const [isSpecial, setIsSpecial] = useState(issue.isSpecial);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  function handleSave() {
    setErrorMsg(null);
    setRequested(false);

    startTransition(async () => {
      try {
        const result = await updateIssue(issue.id, {
          title,
          volumeNumber: volumeNumber || undefined,
          issueNumber: issueNumber || undefined,
          issueDate: issueDate || undefined,
          display,
          isSpecial,
        });
        if (result && "ok" in result && result.ok === false) {
          setErrorMsg(result.error || "Failed to save changes.");
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
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
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

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={display} onChange={(e) => setDisplay(e.target.checked)} className="rounded" />
          Display on site
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isSpecial} onChange={(e) => setIsSpecial(e.target.checked)} className="rounded" />
          Special issue
        </label>
      </div>

      {isTeam && (
        <p className="mr-callout">
          As a team member, this will be submitted as a change request for admin approval.
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={pending}>
          {pending ? "Submitting..." : isTeam ? "Submit Request" : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/issues")}>Cancel</Button>
      </div>

      {errorMsg && <MutationError message={errorMsg} />}
      {requested && <MutationRequested />}
    </div>
  );
}
