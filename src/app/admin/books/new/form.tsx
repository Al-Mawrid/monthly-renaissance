"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBook } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Writer = { id: number; name: string };

export function BookCreateForm({
  writers,
  isTeam,
}: {
  writers: Writer[];
  isTeam: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [originalFileName, setOriginalFileName] = useState("");
  const [writerId, setWriterId] = useState("none");
  const [translatorId, setTranslatorId] = useState("none");
  const [isEbook, setIsEbook] = useState(false);
  const [isBookType, setIsBookType] = useState(true);
  const [uploadError, setUploadError] = useState("");

  function generateSlug(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
      setOriginalFileName(data.originalName);

      // Auto-fill title from filename if empty
      if (!title) {
        const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
        setTitle(name.charAt(0).toUpperCase() + name.slice(1));
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    }
    setUploading(false);
  }

  function clearFile() {
    setFileName("");
    setOriginalFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave() {
    if (!title || !fileName) return;
    setSaving(true);
    try {
      const result = await createBook({
        title,
        slug: generateSlug(title),
        fileName,
        writerId: writerId !== "none" ? parseInt(writerId, 10) : undefined,
        translatorId: translatorId !== "none" ? parseInt(translatorId, 10) : undefined,
        isEbook,
        isBook: isBookType,
      });
      if ("requested" in result) {
        router.push("/admin/change-requests");
      } else {
        router.push("/admin/books");
      }
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* File Upload */}
      <div className="space-y-2">
        <Label>Book File</Label>
        {fileName ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{originalFileName}</p>
              <p className="text-xs text-muted-foreground">{fileName}</p>
            </div>
            <button onClick={clearFile} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-8 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`h-8 w-8 ${uploading ? "animate-pulse text-primary" : "text-muted-foreground"}`} />
            <p className="text-sm text-muted-foreground">
              {uploading ? "Uploading..." : "Click to upload PDF, EPUB, MOBI, or DOCX"}
            </p>
            <p className="text-xs text-muted-foreground">Max 50MB</p>
          </div>
        )}
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
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Writer</Label>
          <Select value={writerId} onValueChange={(v) => v && setWriterId(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {writers.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Translator</Label>
          <Select value={translatorId} onValueChange={(v) => v && setTranslatorId(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {writers.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
      </div>

      {isTeam && (
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
          As a team member, this will be submitted as a change request for admin approval.
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving || uploading || !title || !fileName}>
          {saving ? "Submitting..." : isTeam ? "Submit Request" : "Create Book"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/books")}>Cancel</Button>
      </div>
    </div>
  );
}
