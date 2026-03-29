"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuery } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Topic = { id: number; title: string };
type Writer = { id: number; name: string };

export function QueryCreateForm({
  topics,
  writers,
  isTeam,
}: {
  topics: Topic[];
  writers: Writer[];
  isTeam: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [questioner, setQuestioner] = useState("");
  const [questionHtml, setQuestionHtml] = useState("");
  const [answerHtml, setAnswerHtml] = useState("");
  const [topicId, setTopicId] = useState("");
  const [writerId, setWriterId] = useState("");

  function generateSlug(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleSave() {
    if (!title || !topicId || !writerId) return;
    setSaving(true);
    try {
      const result = await createQuery({
        title,
        slug: generateSlug(title),
        questionHtml,
        answerHtml: answerHtml || undefined,
        questioner: questioner || undefined,
        topicId: parseInt(topicId, 10),
        writerId: parseInt(writerId, 10),
      });
      if ("requested" in result) {
        router.push("/admin/change-requests");
      } else {
        router.push("/admin/queries");
      }
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Query title" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="questioner">Questioner</Label>
        <Input id="questioner" value={questioner} onChange={(e) => setQuestioner(e.target.value)} placeholder="Name of questioner (optional)" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Topic</Label>
          <Select value={topicId} onValueChange={(v) => v && setTopicId(v)}>
            <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
            <SelectContent>
              {topics.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Writer</Label>
          <Select value={writerId} onValueChange={(v) => v && setWriterId(v)}>
            <SelectTrigger><SelectValue placeholder="Select writer" /></SelectTrigger>
            <SelectContent>
              {writers.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="question">Question HTML</Label>
        <Textarea id="question" value={questionHtml} onChange={(e) => setQuestionHtml(e.target.value)} rows={8} className="font-mono text-xs" placeholder="Enter question HTML..." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="answer">Answer HTML</Label>
        <Textarea id="answer" value={answerHtml} onChange={(e) => setAnswerHtml(e.target.value)} rows={15} className="font-mono text-xs" placeholder="Enter answer HTML..." />
      </div>

      {isTeam && (
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
          As a team member, this will be submitted as a change request for admin approval.
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving || !title || !topicId || !writerId}>
          {saving ? "Submitting..." : isTeam ? "Submit Request" : "Create Query"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/queries")}>Cancel</Button>
      </div>
    </div>
  );
}
