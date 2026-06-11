"use client";

import { useState } from "react";

type Primitive = string | number | boolean | null;
type DiffValue = Primitive | Primitive[] | Record<string, Primitive>;

const LONG_HTML_FIELDS = new Set([
  "bodyHtml",
  "questionHtml",
  "answerHtml",
]);

const FIELD_LABELS: Record<string, string> = {
  bodyHtml: "Body (HTML)",
  questionHtml: "Question (HTML)",
  answerHtml: "Answer (HTML)",
  topicId: "Topic ID",
  writerId: "Writer ID",
  translatorId: "Translator ID",
  issueId: "Issue ID",
  roleInIssue: "Role in issue",
  isEbook: "E-book",
  isBook: "Book",
  isSpecial: "Special issue",
  displayOnSite: "Display on site",
  displayInList: "Display in list",
  isQueryWriter: "Query writer",
  fileName: "File name",
  volumeNumber: "Volume",
  issueNumber: "Issue number",
  issueDate: "Issue date",
};

function labelFor(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase());
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v instanceof Date) return v.toISOString();
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof Date) return a.toISOString() === b;
  if (b instanceof Date) return b.toISOString() === a;
  return formatValue(a) === formatValue(b);
}

function HtmlPreview({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = html.length > 1500;
  const shown = expanded || !isLong ? html : html.slice(0, 1500);

  return (
    <div>
      <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed max-h-96 overflow-y-auto">
        {shown}
        {!expanded && isLong ? "…" : ""}
      </pre>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-primary underline hover:no-underline"
        >
          {expanded ? "Show less" : `Show full (${html.length.toLocaleString()} chars)`}
        </button>
      )}
    </div>
  );
}

function CellValue({
  fieldKey,
  value,
}: {
  fieldKey: string;
  value: unknown;
}) {
  if (value === undefined) {
    return <span className="text-muted-foreground italic">(no change)</span>;
  }
  if (LONG_HTML_FIELDS.has(fieldKey) && typeof value === "string") {
    return <HtmlPreview html={value} />;
  }
  const formatted = formatValue(value);
  if (formatted === "—") {
    return <span className="text-muted-foreground">—</span>;
  }
  return <span className="break-words whitespace-pre-wrap">{formatted}</span>;
}

type DiffRow = {
  key: string;
  current: unknown;
  proposed: unknown;
  changed: boolean;
};

function buildRows(
  current: Record<string, unknown> | null,
  proposed: Record<string, unknown> | null,
  action: "CREATE" | "UPDATE" | "DELETE",
): DiffRow[] {
  if (action === "CREATE" && proposed) {
    return Object.entries(proposed).map(([key, value]) => ({
      key,
      current: undefined,
      proposed: value,
      changed: true,
    }));
  }
  if (action === "DELETE" && current) {
    return Object.entries(current).map(([key, value]) => ({
      key,
      current: value,
      proposed: undefined,
      changed: true,
    }));
  }
  if (!proposed) return [];
  return Object.entries(proposed).map(([key, value]) => {
    const cur = current ? current[key] : undefined;
    return {
      key,
      current: cur,
      proposed: value,
      changed: !valuesEqual(cur, value),
    };
  });
}

export function DiffPanel({
  action,
  current,
  proposed,
  currentMissing,
}: {
  action: "CREATE" | "UPDATE" | "DELETE";
  current: Record<string, unknown> | null;
  proposed: Record<string, unknown> | null;
  currentMissing?: boolean;
}) {
  const rows = buildRows(current, proposed, action);

  const showCurrent = action !== "CREATE";
  const showProposed = action !== "DELETE";

  if (action === "DELETE" && currentMissing) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        The target record no longer exists in the database (already deleted).
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        No fields to display.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div
        className="grid gap-px bg-border text-xs"
        style={{
          gridTemplateColumns:
            showCurrent && showProposed
              ? "minmax(140px, 1fr) minmax(0, 2fr) minmax(0, 2fr)"
              : "minmax(140px, 1fr) minmax(0, 4fr)",
        }}
      >
        <div className="bg-card px-3 py-2 font-medium">Field</div>
        {showCurrent && (
          <div className="bg-card px-3 py-2 font-medium">
            {action === "DELETE" ? "Value (to delete)" : "Current"}
          </div>
        )}
        {showProposed && (
          <div className="bg-card px-3 py-2 font-medium">Proposed</div>
        )}

        {rows.map((row) => (
          <RowFragment
            key={row.key}
            row={row}
            showCurrent={showCurrent}
            showProposed={showProposed}
          />
        ))}
      </div>
    </div>
  );
}

function RowFragment({
  row,
  showCurrent,
  showProposed,
}: {
  row: DiffRow;
  showCurrent: boolean;
  showProposed: boolean;
}) {
  return (
    <>
      <div className="bg-card px-3 py-2 align-top font-medium text-sm">
        {labelFor(row.key)}
      </div>
      {showCurrent && (
        <div
          className={`px-3 py-2 align-top text-sm ${row.changed ? "bg-muted" : "bg-card"}`}
        >
          <CellValue fieldKey={row.key} value={row.current} />
        </div>
      )}
      {showProposed && (
        <div
          className={`px-3 py-2 align-top text-sm ${row.changed ? "bg-primary/10" : "bg-card"}`}
        >
          <CellValue fieldKey={row.key} value={row.proposed} />
        </div>
      )}
    </>
  );
}
