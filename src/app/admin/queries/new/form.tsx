"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createQuery } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HtmlEditor } from "@/app/admin/_components/html-editor";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { MutationError, MutationRequested } from "@/app/admin/_components/mutation-result";
import { WriterSelect } from "@/app/admin/_components/writer-select";

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
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [questioner, setQuestioner] = useState("");
  const [questionHtml, setQuestionHtml] = useState("");
  const [answerHtml, setAnswerHtml] = useState("");
  const [topicId, setTopicId] = useState("");
  const [writerId, setWriterId] = useState("");
  const [writerList, setWriterList] = useState<Writer[]>(writers);
  const [topicSearch, setTopicSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  const filteredTopics = topics.filter((t) => {
    const q = topicSearch.toLowerCase();
    return t.title.toLowerCase().includes(q) || String(t.id).includes(q);
  });

  function addWriter(w: Writer) {
    setWriterList((prev) => [...prev, w].sort((a, b) => a.name.localeCompare(b.name)));
  }

  function generateSlug(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function handleSave() {
    if (!title || !topicId || !writerId) return;
    setErrorMsg(null);
    setRequested(false);

    startTransition(async () => {
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
        if (result && "ok" in result && result.ok === false) {
          setErrorMsg(result.error || "Failed to create query.");
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
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Query title" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="questioner">Questioner</Label>
        <Input id="questioner" value={questioner} onChange={(e) => setQuestioner(e.target.value)} placeholder="Name of questioner (optional)" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Topic</Label>
          <Select
            value={topicId}
            onValueChange={(v) => v && setTopicId(v)}
            onOpenChange={(open) => { if (!open) setTopicSearch(""); }}
          >
            <SelectTrigger className="w-full"><SelectValue placeholder="Select topic" /></SelectTrigger>
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
        <WriterSelect
          label="Writer"
          value={writerId}
          onValueChange={setWriterId}
          writers={writerList}
          onWriterCreated={addWriter}
          isTeam={isTeam}
          defaultQueryWriter
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="question">Question</Label>
        <HtmlEditor id="question" value={questionHtml} onChange={setQuestionHtml} rows={8} placeholder="Question text…" entityType="query" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="answer">Answer</Label>
        <HtmlEditor id="answer" value={answerHtml} onChange={setAnswerHtml} rows={15} placeholder="Answer text…" entityType="query" />
      </div>

      {isTeam && (
        <p className="mr-callout">
          As a team member, this will be submitted as a change request for admin approval.
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={pending || !title || !topicId || !writerId}>
          {pending ? "Submitting..." : isTeam ? "Submit Request" : "Create Query"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/queries")}>Cancel</Button>
      </div>

      {errorMsg && <MutationError message={errorMsg} />}
      {requested && <MutationRequested />}
    </div>
  );
}
