import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FlipBook } from "@/components/flip-book";
import { StoreHydration } from "@/components/app-shell";
import {
  EDITIONS,
  EDITION_LIST,
  hizbStartIndex,
  mapProgress,
  type BookMode,
} from "@/lib/books";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/oku")({
  validateSearch: (search: Record<string, unknown>): { hizb?: number } =>
    search["hizb"] ? { hizb: Number(search["hizb"]) } : {},
  head: () => ({
    meta: [
      { title: "Delâil Kitabı — Arapça, Türkçe Meal ve Okunuşu" },
      {
        name: "description",
        content:
          "Delâilü'l-Hayrât'ı gerçekçi sayfa çevirme animasyonuyla oku; Arapça aslı, Türkçe meali ve Latin okunuşu arasında anında geçiş yap.",
      },
      { property: "og:title", content: "Delâil Kitabı — Sayfa Çevirmeli Okuyucu" },
      {
        property: "og:description",
        content: "Sepya kâğıt dokusu, 3B sayfa çevirme ve üç dilde okuma modu.",
      },
    ],
  }),
  component: ReaderPage,
});

function ReaderPage() {
  const { hizb } = Route.useSearch();
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const pageIndex = useAppStore((s) => s.pageIndex);
  const setPage = useAppStore((s) => s.setPage);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);
  const zoom = useAppStore((s) => s.zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const markRead = useAppStore((s) => s.markRead);

  const [immersive, setImmersive] = useState(false);
  const [ready, setReady] = useState(false);

  const edition = EDITIONS[mode];
  const index = pageIndex[mode] ?? 0;

  useEffect(() => {
    setReady(true);
    markRead();
  }, [markRead]);

  useEffect(() => {
    if (hizb && ready) {
      setPage(mode, hizbStartIndex(edition, hizb));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hizb, ready]);

  const switchMode = useCallback(
    (next: BookMode) => {
      const mapped = mapProgress(edition, EDITIONS[next], index);
      setPage(next, mapped);
      setMode(next);
    },
    [edition, index, setMode, setPage],
  );

  const isBookmarked = bookmarks.some((b) => b.mode === mode && b.index === index);

  return (
    <div className="relative min-h-screen bg-reader-background">
      <StoreHydration />

      {/* Top toolbar */}
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-30 transition-all duration-300",
          immersive ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100",
        )}
      >
        <div className="mx-auto max-w-lg px-3 pt-3">
          <div className="flex items-center gap-2 rounded-3xl border border-white/10 bg-reader-surface/90 p-2 backdrop-blur-xl">
            <Link
              to="/"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-paper"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex flex-1 gap-1 rounded-full bg-black/20 p-1">
              {EDITION_LIST.map((ed) => (
                <button
                  key={ed.id}
                  onClick={() => switchMode(ed.id)}
                  className={cn(
                    "flex-1 rounded-full px-2 py-1.5 text-[11px] font-semibold transition-all",
                    ed.id === mode
                      ? "bg-emerald-gradient text-primary-foreground shadow-soft"
                      : "text-paper/70",
                  )}
                >
                  {ed.label}
                </button>
              ))}
            </div>
            <button
              onClick={() =>
                toggleBookmark({
                  mode,
                  index,
                  label: `${edition.short} · ${index + 1}. sayfa`,
                  createdAt: Date.now(),
                })
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold"
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Book */}
      <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-3 py-16">
        <div
          className="relative w-full overflow-hidden rounded-[16px]"
          style={{ aspectRatio: mode === "arabic" ? "785 / 1180" : "3 / 4" }}
        >
          {ready ? (
            <FlipBook
              edition={edition}
              index={index}
              zoom={zoom}
              onIndexChange={(i) => setPage(mode, i)}
              onTap={() => setImmersive((v) => !v)}
            />
          ) : (
            <div className="paper-surface flex h-full w-full items-center justify-center rounded-[16px]">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-ink-soft/30 border-t-ink-soft" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 transition-all duration-300",
          immersive ? "translate-y-full opacity-0" : "translate-y-0 opacity-100",
        )}
      >
        <div className="mx-auto max-w-lg px-3 pb-3 safe-bottom">
          <div className="rounded-3xl border border-white/10 bg-reader-surface/90 p-3 backdrop-blur-xl">
            <div className="mb-2 flex items-center gap-3">
              <button
                onClick={() => setPage(mode, Math.max(0, index - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-paper"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="range"
                min={0}
                max={edition.totalPages - 1}
                value={index}
                onChange={(e) => setPage(mode, Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-[var(--gold)]"
              />
              <button
                onClick={() => setPage(mode, Math.min(edition.totalPages - 1, index + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-paper"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-paper/70">
                {index + 1} / {edition.totalPages} · {edition.hint}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom(zoom - 0.15)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-paper"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center text-[11px] text-paper/70">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(zoom + 0.15)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-paper"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
