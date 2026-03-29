"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTopic } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Topic = {
  id: number;
  title: string;
  ranking: number;
  display: boolean;
  displayInList: boolean;
};

export function TopicEditForm({ topic, isTeam }: { topic: Topic; isTeam: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(topic.title);
  const [ranking, setRanking] = useState(String(topic.ranking));
  const [display, setDisplay] = useState(topic.display);
  const [displayInList, setDisplayInList] = useState(topic.displayInList);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateTopic(topic.id, {
        title,
        ranking: parseInt(ranking, 10) || 0,
        display,
        displayInList,
      });
      if ("requested" in result) {
        router.push("/admin/change-requests");
      } else {
        router.push("/admin/topics");
      }
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ranking">Ranking</Label>
        <Input id="ranking" type="number" value={ranking} onChange={(e) => setRanking(e.target.value)} />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={display} onChange={(e) => setDisplay(e.target.checked)} className="rounded" />
          Display
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={displayInList} onChange={(e) => setDisplayInList(e.target.checked)} className="rounded" />
          Display in list
        </label>
      </div>

      {isTeam && (
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
          As a team member, this will be submitted as a change request for admin approval.
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Submitting..." : isTeam ? "Submit Request" : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/topics")}>Cancel</Button>
      </div>
    </div>
  );
}
