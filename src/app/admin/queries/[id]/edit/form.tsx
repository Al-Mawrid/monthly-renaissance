"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateQuery } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HtmlEditor } from "@/app/admin/_components/html-editor";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { MutationError, MutationRequested } from "@/app/admin/_components/mutation-result";

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
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(query.title);
  const [questionHtml, setQuestionHtml] = useState(query.questionHtml);
  const [answerHtml, setAnswerHtml] = useState(query.answerHtml ?? "");
  const [questioner, setQuestioner] = useState(query.questioner ?? "");
  const [topicId, setTopicId] = useState(String(query.topicId));
  const [writerId, setWriterId] = useState(String(query.writerId));
  const [display, setDisplay] = useState(query.display);
  const [topicSearch, setTopicSearch] = useState("");
  const [writerSearch, setWriterSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  const filteredTopics = topics.filter((t) => {
    const q = topicSearch.toLowerCase();
    return t.title.toLowerCase().includes(q) || String(t.id).includes(q);
  });
  const filteredWriters = writers.filter((w) => {
    const q = writerSearch.toLowerCase();
    return w.name.toLowerCase().includes(q) || String(w.id).includes(q);
  });

  function handleSave() {
    setErrorMsg(null);
    setRequested(false);

    startTransition(async () => {
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
        if (result && "ok" in result && result.ok === false) {
          setErrorMsg(result.error || "Failed to save changes.");
          return;
        }
        if (result && "requested" in result && result.requested) {
          setRequested(true);
          return;
        }
        router.push("/admin/queries");
      } catch {
        setErrorMsg("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="max-w-5xl space-y-6">
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
          <Select
            value={topicId}
            onValueChange={(v) => v && setTopicId(v)}
            onOpenChange={(open) => { if (!open) setTopicSearch(""); }}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent
              alignItemWithTrigger={false}
              header={
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <Search className="size-3.5 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Search topics..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    autoFocus
                  />
                </div>
              }
            >
              {filteredTopics.length > 0 ? (
                filteredTopics.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">No topics found</div>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Writer</Label>
          <Select
            value={writerId}
            onValueChange={(v) => v && setWriterId(v)}
            onOpenChange={(open) => { if (!open) setWriterSearch(""); }}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent
              alignItemWithTrigger={false}
              header={
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <Search className="size-3.5 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    value={writerSearch}
                    onChange={(e) => setWriterSearch(e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Search writers..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    autoFocus
                  />
                </div>
              }
            >
              {filteredWriters.length > 0 ? (
                filteredWriters.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">No writers found</div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="question">Question</Label>
        <HtmlEditor id="question" value={questionHtml} onChange={setQuestionHtml} rows={10} entityType="query" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="answer">Answer</Label>
        <HtmlEditor id="answer" value={answerHtml} onChange={setAnswerHtml} rows={15} entityType="query" />
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={display} onChange={(e) => setDisplay(e.target.checked)} className="rounded" />
          Display on site
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
        <Button variant="outline" onClick={() => router.push("/admin/queries")}>Cancel</Button>
      </div>

      {errorMsg && <MutationError message={errorMsg} />}
      {requested && <MutationRequested />}
    </div>
  );
}
