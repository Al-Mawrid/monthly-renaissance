"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateQuery } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type QueryEntry = {
  id: number;
  title: string;
  questionHtml: string;
  answerHtml: string | null;
  questioner: string | null;
  topicId: number;
  writerId: number;
  display: boolean;
};
type Topic = { id: number; title: string };
type Writer = { id: number; name: string };

export function QueryEditForm({
  query,
  topics,
  writers,
  isTeam,
}: {
  query: QueryEntry;
  topics: Topic[];
  writers: Writer[];
  isTeam: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(query.title);
  const [questionHtml, setQuestionHtml] = useState(query.questionHtml);
  const [answerHtml, setAnswerHtml] = useState(query.answerHtml ?? "");
  const [questioner, setQuestioner] = useState(query.questioner ?? "");
  const [topicId, setTopicId] = useState(String(query.topicId));
  const [writerId, setWriterId] = useState(String(query.writerId));
  const [display, setDisplay] = useState(query.display);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateQuery(query.id, {
        title,
        questionHtml,
        answerHtml,
        questioner: questioner || undefined,
        topicId: parseInt(topicId, 10),
        writerId: parseInt(writerId, 10),
        display,
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
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="questioner">Questioner</Label>
        <Input id="questioner" value={questioner} onChange={(e) => setQuestioner(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Topic</Label>
          <Select value={topicId} onValueChange={(v) => v && setTopicId(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
            <SelectTrigger><SelectValue /></SelectTrigger>
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
        <Textarea id="question" value={questionHtml} onChange={(e) => setQuestionHtml(e.target.value)} rows={10} className="font-mono text-xs" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="answer">Answer HTML</Label>
        <Textarea id="answer" value={answerHtml} onChange={(e) => setAnswerHtml(e.target.value)} rows={15} className="font-mono text-xs" />
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={display} onChange={(e) => setDisplay(e.target.checked)} className="rounded" />
          Display on site
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
        <Button variant="outline" onClick={() => router.push("/admin/queries")}>Cancel</Button>
      </div>
    </div>
  );
}
