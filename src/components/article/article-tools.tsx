"use client";

import { useEffect, useState } from "react";

type Props = {
  citation: string;
};

const TYPE_SIZES = [
  { label: "S", scale: 0.92 },
  { label: "M", scale: 1 },
  { label: "L", scale: 1.12 },
  { label: "XL", scale: 1.25 },
];

export function ArticleTools({ citation }: Props) {
  const [sizeIdx, setSizeIdx] = useState(1);
  const [readingMode, setReadingMode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(".article-content");
    if (!el) return;
    el.style.fontSize = `${TYPE_SIZES[sizeIdx].scale}em`;
  }, [sizeIdx]);

  useEffect(() => {
    document.body.classList.toggle("mr-reading", readingMode);
    return () => {
      document.body.classList.remove("mr-reading");
    };
  }, [readingMode]);

  const cycleSize = () => setSizeIdx((i) => (i + 1) % TYPE_SIZES.length);

  const handleCite = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // noop
    }
  };

  const tools: Array<{ icon: string; label: string; onClick: () => void }> = [
    {
      icon: "🅐",
      label: `Type size · ${TYPE_SIZES[sizeIdx].label}`,
      onClick: cycleSize,
    },
    {
      icon: "◑",
      label: readingMode ? "Reading mode on" : "Reading mode",
      onClick: () => setReadingMode((s) => !s),
    },
    {
      icon: "⇣",
      label: "Download PDF",
      onClick: () => window.print(),
    },
    {
      icon: "◈",
      label: copied ? "Copied!" : "Cite this",
      onClick: handleCite,
    },
  ];

  return (
    <div className="flex flex-col gap-1.5 mb-6 text-[12px]">
      {tools.map((t) => (
        <button
          key={t.label}
          type="button"
          onClick={t.onClick}
          className="flex items-center gap-2 text-left py-1.5 px-2 text-muted-foreground hover:text-foreground rounded-sm transition-colors cursor-pointer"
        >
          <span
            className="inline-block w-5 font-mono"
            style={{ color: "var(--mr-saffron-700)" }}
          >
            {t.icon}
          </span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
