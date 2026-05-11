"use client";

import { useEffect, useRef, useState } from "react";
import { Accessibility } from "lucide-react";

type Props = {
  citation: string;
};

const TYPE_SIZES = [
  { label: "S", scale: 0.92 },
  { label: "M", scale: 1 },
  { label: "L", scale: 1.12 },
  { label: "XL", scale: 1.45 },
];

const FAB_SIZE = 42;
const EDGE_PAD = 12;
const STORAGE_KEY = "mr-reading-fab-pos";
const DRAG_THRESHOLD = 6;

export function ReadingToolsFab({ citation }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [sizeIdx, setSizeIdx] = useState(1);
  const [readingMode, setReadingMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const dragState = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
    pointerId: number;
    samples: Array<{ t: number; x: number; y: number }>;
  } | null>(null);

  function getTopSafeArea() {
    const header = document.querySelector("header");
    const h = header?.getBoundingClientRect().height ?? 0;
    return h + EDGE_PAD;
  }

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          setPos(clampToViewport(parsed.x, parsed.y));
          return;
        }
      } catch {
        // fall through
      }
    }
    setPos({
      x: window.innerWidth - FAB_SIZE - EDGE_PAD,
      y: window.innerHeight - FAB_SIZE - EDGE_PAD - 80,
    });
  }, []);

  useEffect(() => {
    const showT = window.setTimeout(() => setShowHint(true), 5000);
    const hideT = window.setTimeout(() => setShowHint(false), 10000);
    return () => {
      clearTimeout(showT);
      clearTimeout(hideT);
    };
  }, []);

  // hide hint as soon as the user interacts
  useEffect(() => {
    if (open || dragging) setShowHint(false);
  }, [open, dragging]);

  useEffect(() => {
    const onResize = () => {
      setPos((p) => (p ? clampToViewport(p.x, p.y) : p));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  function clampToViewport(x: number, y: number) {
    const minY = getTopSafeArea();
    const maxX = window.innerWidth - FAB_SIZE - EDGE_PAD;
    const maxY = window.innerHeight - FAB_SIZE - EDGE_PAD;
    return {
      x: Math.max(EDGE_PAD, Math.min(x, maxX)),
      y: Math.max(minY, Math.min(y, maxY)),
    };
  }

  function snapToCorner(x: number, y: number, vx = 0, vy = 0) {
    const minY = getTopSafeArea();
    const maxX = window.innerWidth - FAB_SIZE - EDGE_PAD;
    const maxY = window.innerHeight - FAB_SIZE - EDGE_PAD;
    const VELOCITY_THRESHOLD = 0.3; // px/ms
    const speed = Math.hypot(vx, vy);

    let goRight: boolean;
    let goBottom: boolean;
    if (speed > VELOCITY_THRESHOLD) {
      goRight = vx > 0;
      goBottom = vy > 0;
      // if motion is mostly along one axis, decide the other axis by position
      if (Math.abs(vx) < VELOCITY_THRESHOLD) {
        goRight = x + FAB_SIZE / 2 > window.innerWidth / 2;
      }
      if (Math.abs(vy) < VELOCITY_THRESHOLD) {
        goBottom = y + FAB_SIZE / 2 > window.innerHeight / 2;
      }
    } else {
      goRight = x + FAB_SIZE / 2 > window.innerWidth / 2;
      goBottom = y + FAB_SIZE / 2 > window.innerHeight / 2;
    }
    return {
      x: goRight ? maxX : EDGE_PAD,
      y: goBottom ? maxY : minY,
    };
  }

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pos) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      moved: false,
      pointerId: e.pointerId,
      samples: [{ t: performance.now(), x: e.clientX, y: e.clientY }],
    };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const ds = dragState.current;
    if (!ds || ds.pointerId !== e.pointerId) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (!ds.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    ds.moved = true;
    const now = performance.now();
    ds.samples.push({ t: now, x: e.clientX, y: e.clientY });
    // keep only last ~100ms of samples
    while (ds.samples.length > 2 && now - ds.samples[0].t > 100) {
      ds.samples.shift();
    }
    setPos(clampToViewport(ds.originX + dx, ds.originY + dy));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const ds = dragState.current;
    if (!ds || ds.pointerId !== e.pointerId) return;
    const moved = ds.moved;
    const samples = ds.samples;
    dragState.current = null;
    setDragging(false);
    if (moved) {
      let vx = 0;
      let vy = 0;
      if (samples.length >= 2) {
        const last = samples[samples.length - 1];
        const first = samples[0];
        const dt = Math.max(1, last.t - first.t);
        vx = (last.x - first.x) / dt;
        vy = (last.y - first.y) / dt;
      }
      setPos((p) => {
        if (!p) return p;
        const snapped = snapToCorner(p.x, p.y, vx, vy);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapped));
        return snapped;
      });
    } else {
      setOpen((o) => !o);
    }
  };

  const handleCite = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // noop
    }
  };

  const tools = [
    {
      icon: "🅐",
      label: `Type size · ${TYPE_SIZES[sizeIdx].label}`,
      onClick: () => setSizeIdx((i) => (i + 1) % TYPE_SIZES.length),
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

  if (!pos) return null;

  const panelOnLeft = pos.x + FAB_SIZE / 2 > window.innerWidth / 2;
  const panelAbove = pos.y + FAB_SIZE / 2 > window.innerHeight / 2;

  return (
    <div className="lg:hidden">
      {open && (
        <button
          type="button"
          aria-label="Close reading tools"
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className="fixed z-50"
        style={{
          left: pos.x,
          top: pos.y,
          width: FAB_SIZE,
          height: FAB_SIZE,
          touchAction: "none",
          transition: dragging ? "none" : "left 0.42s cubic-bezier(0.22, 1, 0.36, 1), top 0.42s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          className="absolute whitespace-nowrap rounded-md shadow-lg px-2.5 py-1.5 text-[12px] font-medium pointer-events-none"
          style={{
            background: "var(--mr-saffron-700, #b45309)",
            color: "white",
            [panelOnLeft ? "right" : "left"]: FAB_SIZE + 8,
            top: "50%",
            transform: `translateY(-50%) translateX(${showHint ? "0" : panelOnLeft ? "6px" : "-6px"})`,
            opacity: showHint ? 1 : 0,
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        >
          Use me for Reading Tools
        </div>

        {open && (
          <div
            className="absolute w-56 rounded-md border bg-background shadow-lg p-1.5"
            style={{
              borderColor: "var(--border)",
              [panelOnLeft ? "right" : "left"]: FAB_SIZE + 8,
              [panelAbove ? "bottom" : "top"]: 0,
            }}
          >
            <div
              className="mr-eyebrow px-2 pt-1.5 pb-2"
              style={{ color: "var(--mr-clay-700)" }}
            >
              Reading Tools
            </div>
            {tools.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={t.onClick}
                className="flex items-center gap-2 w-full text-left py-2 px-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-sm transition-colors"
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
        )}

        <button
          type="button"
          aria-label="Reading tools"
          aria-expanded={open}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="w-full h-full rounded-full shadow-lg flex items-center justify-center select-none"
          style={{
            background: "var(--mr-saffron-700, #b45309)",
            color: "white",
            cursor: dragging ? "grabbing" : "grab",
            transition: dragging ? "none" : "box-shadow 0.15s",
          }}
        >
          <Accessibility className="w-5 h-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
