"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateArticle } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HtmlEditor } from "@/app/admin/_components/html-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { MutationError, MutationRequested } from "@/app/admin/_components/mutation-result";

type Article = {
  id: number;
  title: string;
  bodyHtml: string;
  topicId: number;
  writerId: number;
  translatorId: number | null;
  display: boolean;
};

type Topic = { id: number; title: string };
type Writer = { id: number; name: string };
type IssueOption = {
  id: number;
  title: string;
  volumeNumber: string | null;
  issueNumber: string | null;
  issueDate: string | null;
};

function issueLabel(i: IssueOption) {
  const d = i.issueDate ? new Date(i.issueDate) : null;
  const date = d
    ? d.toLocaleDateString(undefined, { year: "numeric", month: "short" })
    : null;
  const vi = [
    i.volumeNumber ? `Vol. ${i.volumeNumber}` : null,
    i.issueNumber ? `No. ${i.issueNumber}` : null,
  ].filter(Boolean).join(" · ");
  return [i.title, vi, date].filter(Boolean).join(" — ");
}

export function ArticleEditForm({
  article,
  topics,
  writers,
  issues,
  initialIssueId,
  initialRoleInIssue,
  isTeam = false,
}: {
  article: Article;
  topics: Topic[];
  writers: Writer[];
  issues: IssueOption[];
  initialIssueId: number | null;
  initialRoleInIssue: "regular" | "editorial" | "intro";
  isTeam?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(article.title);
  const [bodyHtml, setBodyHtml] = useState(article.bodyHtml);
  const [topicId, setTopicId] = useState(String(article.topicId));
  const [writerId, setWriterId] = useState(String(article.writerId));
  const [translatorId, setTranslatorId] = useState(
    article.translatorId ? String(article.translatorId) : "none",
  );
  const [issueId, setIssueId] = useState(initialIssueId ? String(initialIssueId) : "");
  const [roleInIssue, setRoleInIssue] = useState<"regular" | "editorial" | "intro">(initialRoleInIssue);
  const [display, setDisplay] = useState(article.display);
  const [topicSearch, setTopicSearch] = useState("");
  const [writerSearch, setWriterSearch] = useState("");
  const [translatorSearch, setTranslatorSearch] = useState("");
  const [issueSearch, setIssueSearch] = useState("");
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
  const filteredTranslators = writers.filter((w) => {
    const q = translatorSearch.toLowerCase();
    return w.name.toLowerCase().includes(q) || String(w.id).includes(q);
  });
  const filteredIssues = issues.filter((i) => {
    const q = issueSearch.toLowerCase();
    return (
      i.title.toLowerCase().includes(q) ||
      (i.volumeNumber ?? "").toLowerCase().includes(q) ||
      (i.issueNumber ?? "").toLowerCase().includes(q)
    );
  });

  function handleSave() {
    if (!issueId) {
      setErrorMsg("Please select an issue.");
      return;
    }
    setErrorMsg(null);
    setRequested(false);

    startTransition(async () => {
      try {
        const result = await updateArticle(article.id, {
          title,
          bodyHtml,
          topicId: parseInt(topicId, 10),
          writerId: parseInt(writerId, 10),
          translatorId: translatorId !== "none" ? parseInt(translatorId, 10) : null,
          issueId: parseInt(issueId, 10),
          roleInIssue,
          display,
        } as Parameters<typeof updateArticle>[1]);

        if (result && "ok" in result && result.ok === false) {
          setErrorMsg(result.error || "Failed to save changes.");
          return;
        }
        if (result && "requested" in result && result.requested) {
          setRequested(true);
          return;
        }
        router.push("/admin/articles");
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Translator <span className="text-muted-foreground">(optional)</span></Label>
          <Select
            value={translatorId}
            onValueChange={(v) => v && setTranslatorId(v)}
            onOpenChange={(open) => { if (!open) setTranslatorSearch(""); }}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent
              alignItemWithTrigger={false}
              header={
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <Search className="size-3.5 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    value={translatorSearch}
                    onChange={(e) => setTranslatorSearch(e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Search writers..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    autoFocus
                  />
                </div>
              }
            >
              <SelectItem value="none">None</SelectItem>
              {filteredTranslators.length > 0 ? (
                filteredTranslators.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">No writers found</div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Role in issue</Label>
          <Select value={roleInIssue} onValueChange={(v) => setRoleInIssue(v as typeof roleInIssue)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="editorial">Editorial</SelectItem>
              <SelectItem value="intro">Issue intro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Issue</Label>
        <Select
          value={issueId}
          onValueChange={(v) => v && setIssueId(v)}
          onOpenChange={(open) => { if (!open) setIssueSearch(""); }}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="Select issue" /></SelectTrigger>
          <SelectContent
            alignItemWithTrigger={false}
            header={
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={issueSearch}
                  onChange={(e) => setIssueSearch(e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Search issues..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>
            }
          >
            {filteredIssues.length > 0 ? (
              filteredIssues.map((i) => (
                <SelectItem key={i.id} value={String(i.id)}>{issueLabel(i)}</SelectItem>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">No issues found</div>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Body</Label>
        <HtmlEditor
          id="body"
          value={bodyHtml}
          onChange={setBodyHtml}
          rows={20}
          placeholder="Article body…"
          entityType="article"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={display}
            onChange={(e) => setDisplay(e.target.checked)}
            className="rounded"
          />
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
        <Button variant="outline" onClick={() => router.push("/admin/articles")}>
          Cancel
        </Button>
      </div>

      {errorMsg && <MutationError message={errorMsg} />}
      {requested && <MutationRequested />}
    </div>
  );
}
