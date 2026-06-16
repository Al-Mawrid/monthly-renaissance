"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWriter } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MutationError, MutationRequested } from "@/app/admin/_components/mutation-result";

export function WriterCreateForm({ isTeam }: { isTeam: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [displayOnSite, setDisplayOnSite] = useState(true);
  const [isQueryWriter, setIsQueryWriter] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  function handleSave() {
    if (!name.trim()) return;
    setErrorMsg(null);
    setRequested(false);

    startTransition(async () => {
      try {
        const result = await createWriter({
          name: name.trim(),
          email: email.trim() || undefined,
          displayOnSite,
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
        router.push("/admin/writers");
      } catch {
        setErrorMsg("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Writer name" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email <span className="text-muted-foreground">(optional)</span></Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="writer@example.com" />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={displayOnSite} onChange={(e) => setDisplayOnSite(e.target.checked)} className="rounded" />
          Display on site
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isQueryWriter} onChange={(e) => setIsQueryWriter(e.target.checked)} className="rounded" />
          Query writer
        </label>
      </div>

      {isTeam && (
        <p className="mr-callout">
          As a team member, this will be submitted as a change request for admin approval.
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={pending || !name.trim()}>
          {pending ? "Submitting..." : isTeam ? "Submit Request" : "Create Writer"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/writers")}>Cancel</Button>
      </div>

      {errorMsg && <MutationError message={errorMsg} />}
      {requested && <MutationRequested />}
    </div>
  );
}
