"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateArticle } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HtmlEditor } from "@/app/admin/_components/html-editor";
import {
  previewChannelName,
  previewUrl,
  storeArticlePreview,
  type ArticlePreviewPayload,
} from "@/lib/article-preview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, ExternalLink } from "lucide-react";
import { MutationError, MutationRequested } from "@/app/admin/_components/mutation-result";
import { WriterSelect } from "@/app/admin/_components/writer-select";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";

type Article = {
  id: number;
  slug: string;
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
  const [writerList, setWriterList] = useState<Writer[]>(writers);
  const [issueId, setIssueId] = useState(initialIssueId ? String(initialIssueId) : "");
  const [roleInIssue, setRoleInIssue] = useState<"regular" | "editorial" | "intro">(initialRoleInIssue);
  const [display, setDisplay] = useState(article.display);
  const [topicSearch, setTopicSearch] = useState("");
  const [issueSearch, setIssueSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  // Live preview: keep a single BroadcastChannel for this article and push the
  // current form state to localStorage + the channel on every change. The
  // preview tab (opened by the Preview button) reads the localStorage snapshot
  // on load and re-renders on each broadcast, so edits appear there as you type.
  const previewChannelRef = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(previewChannelName(article.id));
    previewChannelRef.current = channel;
    return () => {
      channel.close();
      previewChannelRef.current = null;
    };
  }, [article.id]);

  const previewPayload = useMemo<ArticlePreviewPayload>(() => {
    const selectedIssue = issues.find((i) => String(i.id) === issueId);
    return {
      id: article.id,
      title,
      bodyHtml,
      topicName: topics.find((t) => String(t.id) === topicId)?.title ?? "",
      writerName: writerList.find((w) => String(w.id) === writerId)?.name ?? "",
      translatorName:
        translatorId !== "none"
          ? writerList.find((w) => String(w.id) === translatorId)?.name ?? null
          : null,
      issueLabel: selectedIssue ? issueLabel(selectedIssue) : null,
      roleInIssue,
    };
  }, [
    article.id,
    title,
    bodyHtml,
    topicId,
    writerId,
    translatorId,
    issueId,
    roleInIssue,
    topics,
    writerList,
    issues,
  ]);

  useEffect(() => {
    storeArticlePreview(previewPayload);
    previewChannelRef.current?.postMessage(previewPayload);
  }, [previewPayload]);

  function handlePreview() {
    // Make sure the freshest snapshot is stored before the tab reads it.
    storeArticlePreview(previewPayload);
    window.open(previewUrl(article.id), `mr-preview-${article.id}`);
  }

  const filteredTopics = topics.filter((t) => {
    const q = topicSearch.toLowerCase();
    return t.title.toLowerCase().includes(q) || String(t.id).includes(q);
  });

  function addWriter(w: Writer) {
    setWriterList((prev) => [...prev, w].sort((a, b) => a.name.localeCompare(b.name)));
  }

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
    <div className="space-y-6">
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
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value) => topics.find((t) => String(t.id) === value)?.title}
              </SelectValue>
            </SelectTrigger>
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
                  <SelectItem key={t.id} value={String(t.id)}>#{t.id} — {t.title}</SelectItem>
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
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <WriterSelect
          label={<>Translator <span className="text-muted-foreground">(optional)</span></>}
          value={translatorId}
          onValueChange={setTranslatorId}
          writers={writerList}
          onWriterCreated={addWriter}
          isTeam={isTeam}
          includeNone
          placeholder="Select translator"
        />

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
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select issue">
              {(value) => {
                const sel = issues.find((i) => String(i.id) === value);
                return sel ? issueLabel(sel) : "Select issue";
              }}
            </SelectValue>
          </SelectTrigger>
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
                <SelectItem key={i.id} value={String(i.id)}>#{i.id} — {issueLabel(i)}</SelectItem>
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
        <Button variant="outline" onClick={handlePreview}>
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          Preview
        </Button>
        {article.display && (
          <a
            href={`/articles/${article.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            View published page
          </a>
        )}
        <Button variant="outline" onClick={() => router.push("/admin/articles")}>
          Cancel
        </Button>
      </div>

      {errorMsg && <MutationError message={errorMsg} />}
      {requested && <MutationRequested />}
    </div>
  );
}
