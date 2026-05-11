"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuery } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HtmlEditor } from "@/app/admin/_components/html-editor";
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
    <div className="max-w-5xl space-y-6">
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
        <Label htmlFor="question">Question</Label>
        <HtmlEditor id="question" value={questionHtml} onChange={setQuestionHtml} rows={8} placeholder="Question text…" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="answer">Answer</Label>
        <HtmlEditor id="answer" value={answerHtml} onChange={setAnswerHtml} rows={15} placeholder="Answer text…" />
      </div>

      {isTeam && (
        <p className="mr-callout">
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
