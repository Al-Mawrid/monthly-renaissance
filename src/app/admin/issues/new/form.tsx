"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createIssue } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function IssueCreateForm({ isTeam }: { isTeam: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [volumeNumber, setVolumeNumber] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [isSpecial, setIsSpecial] = useState(false);

  function generateSlug(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleSave() {
    if (!title) return;
    setSaving(true);
    try {
      const result = await createIssue({
        title,
        slug: generateSlug(title),
        volumeNumber: volumeNumber || undefined,
        issueNumber: issueNumber || undefined,
        issueDate: issueDate || undefined,
        isSpecial,
      });
      if ("requested" in result) {
        router.push("/admin/change-requests");
      } else {
        router.push("/admin/issues");
      }
    } catch {
      setSaving(false);
    }
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
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
          As a team member, this will be submitted as a change request for admin approval.
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving || !title}>
          {saving ? "Submitting..." : isTeam ? "Submit Request" : "Create Issue"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/issues")}>Cancel</Button>
      </div>
    </div>
  );
}
