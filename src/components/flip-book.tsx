import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { locatePage, type BookEdition } from "@/lib/books";

type Renderer = {
  render: (url: string, pageNumber: number, width: number) => Promise<string>;
};

let rendererPromise: Promise<Renderer> | null = null;

function createRenderer(): Promise<Renderer> {
  if (rendererPromise) return rendererPromise;
  rendererPromise = (async () => {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

    const docs = new Map<string, Promise<any>>();
    const pages = new Map<string, Promise<string>>();

    const getDoc = (url: string) => {
      let doc = docs.get(url);
      if (!doc) {
        doc = pdfjs.getDocument({ url }).promise;
        docs.set(url, doc);
      }
      return doc;
    };

    const render = (url: string, pageNumber: number, width: number) => {
      const key = `${url}#${pageNumber}@${width}`;
      let job = pages.get(key);
      if (job) return job;
      job = (async () => {
        const doc = await getDoc(url);
        const page = await doc.getPage(pageNumber);
        const base = page.getViewport({ scale: 1 });
        const scale = width / base.width;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const context = canvas.getContext("2d")!;
        await page.render({ canvasContext: context, viewport }).promise;
        return canvas.toDataURL("image/jpeg", 0.86);
      })();
      pages.set(key, job);
      return job;
    };

    return { render };
  })();
  return rendererPromise;
}

function usePageImage(edition: BookEdition, index: number, width: number) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (index < 0 || index >= edition.totalPages || width <= 0) {
      setSrc(null);
      return;
    }
    const target = locatePage(edition, index);
    createRenderer()
      .then((r) => r.render(target.url, target.pageNumber, width))
      .then((dataUrl) => {
        if (alive) setSrc(dataUrl);
      })
      .catch(() => {
        if (alive) setSrc(null);
      });
    return () => {
      alive = false;
    };
  }, [edition, index, width]);

  return src;
}

function PageFace({ src, muted }: { src: string | null; muted?: boolean }) {
  return (
    <div className="paper-surface absolute inset-0 overflow-hidden rounded-[14px]">
      {src ? (
        <img
          src={src}
          alt=""
          draggable={false}
          className="h-full w-full select-none object-contain mix-blend-multiply"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-ink-soft/30 border-t-ink-soft" />
        </div>
      )}
      <div className="page-fold pointer-events-none absolute inset-0" />
      {muted ? <div className="pointer-events-none absolute inset-0 bg-ink/10" /> : null}
    </div>
  );
}

export type FlipBookProps = {
  edition: BookEdition;
  index: number;
  onIndexChange: (index: number) => void;
  zoom: number;
  onTap?: () => void;
};

export function FlipBook({ edition, index, onIndexChange, zoom, onTap }: FlipBookProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [progress, setProgress] = useState(0); // -1 (prev) .. 1 (next)
  const [animating, setAnimating] = useState(false);
  const drag = useRef<{ x: number; active: boolean; moved: boolean } | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setBox({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const renderWidth = useMemo(() => {
    if (box.w <= 0) return 0;
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    return Math.min(1400, Math.round(box.w * dpr * Math.max(1, zoom)));
  }, [box.w, zoom]);

  const current = usePageImage(edition, index, renderWidth);
  const next = usePageImage(edition, index + 1, renderWidth);
  const prev = usePageImage(edition, index - 1, renderWidth);

  const goTo = useCallback(
    (dir: 1 | -1) => {
      const target = index + dir;
      if (target < 0 || target >= edition.totalPages) {
        setProgress(0);
        return;
      }
      setAnimating(true);
      setProgress(dir);
      window.setTimeout(() => {
        onIndexChange(target);
        setAnimating(false);
        setProgress(0);
      }, 480);
    },
    [edition.totalPages, index, onIndexChange],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (animating) return;
    drag.current = { x: e.clientX, active: true, moved: false };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d?.active || animating || box.w === 0) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 6) d.moved = true;
    const raw = -dx / box.w;
    const clamped = Math.max(-1, Math.min(1, raw));
    if (clamped > 0 && index >= edition.totalPages - 1) return;
    if (clamped < 0 && index <= 0) return;
    setProgress(clamped);
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.active || animating) return;
    if (!d.moved) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      if (ratio > 0.72) goTo(1);
      else if (ratio < 0.28) goTo(-1);
      else onTap?.();
      setProgress(0);
      return;
    }
    if (progress > 0.24) goTo(1);
    else if (progress < -0.24) goTo(-1);
    else {
      setAnimating(true);
      setProgress(0);
      window.setTimeout(() => setAnimating(false), 280);
    }
  };

  // Leaf geometry: the flipping sheet rotates around the left spine.
  const forward = progress >= 0;
  const amount = Math.abs(progress);
  const angle = forward ? -180 * amount : -180 * (1 - amount);
  const leafFront = forward ? current : prev;
  const under = forward ? next : current;
  const showLeaf = amount > 0.001 || (!forward && amount > 0);

  const transition = animating ? "transform 480ms cubic-bezier(0.25, 0.8, 0.3, 1)" : "none";

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full touch-pan-y select-none"
      style={{ perspective: "2200px" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* spine shadow */}
      <div className="pointer-events-none absolute inset-y-2 left-0 w-6 rounded-l-[14px] bg-gradient-to-r from-ink/25 to-transparent" />

      {/* underlying page */}
      <div className="absolute inset-0 shadow-[var(--shadow-page)]">
        <PageFace src={forward ? under : under} />
      </div>

      {/* flipping leaf */}
      {showLeaf ? (
        <div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "left center",
            transform: `rotateY(${angle}deg)`,
            transition,
            willChange: "transform",
          }}
        >
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
            <PageFace src={leafFront} />
            <div
              className="pointer-events-none absolute inset-0 rounded-[14px]"
              style={{
                background: `linear-gradient(90deg, rgba(62,39,35,${0.35 * amount}) 0%, rgba(62,39,35,0) 45%)`,
              }}
            />
          </div>
          <div
            className="paper-surface absolute inset-0 rounded-[14px]"
            style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
          >
            <div
              className="absolute inset-0 rounded-[14px]"
              style={{
                background: `linear-gradient(270deg, rgba(62,39,35,${0.18 + 0.2 * amount}) 0%, rgba(62,39,35,0.02) 55%)`,
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
