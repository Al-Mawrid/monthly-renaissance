"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBook } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import { MutationError, MutationRequested } from "@/app/admin/_components/mutation-result";
import { WriterSelect, type Writer } from "@/app/admin/_components/writer-select";

type Book = {
  id: number;
  title: string;
  fileName: string;
  writerId: number | null;
  translatorId: number | null;
  isEbook: boolean;
  isBook: boolean;
  display: boolean;
};

export function BookEditForm({
  book,
  writers,
  isTeam,
}: {
  book: Book;
  writers: Writer[];
  isTeam: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [fileName, setFileName] = useState(book.fileName);
  const [displayFileName, setDisplayFileName] = useState(book.fileName);
  const [writerId, setWriterId] = useState(book.writerId ? String(book.writerId) : "none");
  const [translatorId, setTranslatorId] = useState(book.translatorId ? String(book.translatorId) : "none");
  const [writerList, setWriterList] = useState<Writer[]>(writers);
  const [isEbook, setIsEbook] = useState(book.isEbook);
  const [isBookType, setIsBookType] = useState(book.isBook);
  const [display, setDisplay] = useState(book.display);
  const [uploadError, setUploadError] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  function addWriter(w: Writer) {
    setWriterList((prev) => [...prev, w].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        setUploading(false);
        return;
      }

      setFileName(data.fileName);
      setDisplayFileName(data.originalName);
    } catch {
      setUploadError("Upload failed. Please try again.");
    }
    setUploading(false);
  }

  function handleSave() {
    setErrorMsg(null);
    setRequested(false);

    startTransition(async () => {
      try {
        const result = await updateBook(book.id, {
          title,
          fileName,
          writerId: writerId !== "none" ? parseInt(writerId, 10) : null,
          translatorId: translatorId !== "none" ? parseInt(translatorId, 10) : null,
          isEbook,
          isBook: isBookType,
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
        router.push("/admin/books");
      } catch {
        setErrorMsg("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Book File</Label>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayFileName}</p>
            {fileName !== displayFileName && (
              <p className="text-xs text-muted-foreground">{fileName}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {uploading ? "Uploading..." : "Replace"}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.epub,.mobi,.docx"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {uploadError && (
          <p className="text-sm text-destructive">{uploadError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <WriterSelect
          label="Writer"
          value={writerId}
          onValueChange={setWriterId}
          writers={writerList}
          onWriterCreated={addWriter}
          isTeam={isTeam}
          includeNone
          placeholder="Select writer"
        />
        <WriterSelect
          label="Translator"
          value={translatorId}
          onValueChange={setTranslatorId}
          writers={writerList}
          onWriterCreated={addWriter}
          isTeam={isTeam}
          includeNone
          placeholder="Select translator"
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isBookType} onChange={(e) => setIsBookType(e.target.checked)} className="rounded" />
          Book
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isEbook} onChange={(e) => setIsEbook(e.target.checked)} className="rounded" />
          E-Book
        </label>
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
        <Button onClick={handleSave} disabled={pending || uploading}>
          {pending ? "Submitting..." : isTeam ? "Submit Request" : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/books")}>Cancel</Button>
      </div>

      {errorMsg && <MutationError message={errorMsg} />}
      {requested && <MutationRequested />}
    </div>
  );
}
