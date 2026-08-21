import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, ScreenHeader } from "@/components/app-shell";
import { ESMA_UL_HUSNA, type EsmaName } from "@/lib/esma";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/esma")({
  head: () => ({
    meta: [
      { title: "Esmâü'l-Hüsnâ — Allah'ın 99 İsmi" },
      {
        name: "description",
        content:
          "Allah'ın 99 güzel ismi: Arapça yazılışı, okunuşu ve Türkçe anlamı. Arama yapın, isim seçip zikir sayacıyla tekrar edin.",
      },
      { property: "og:title", content: "Esmâü'l-Hüsnâ — Allah'ın 99 İsmi" },
      {
        property: "og:description",
        content: "99 esmânın okunuşu, anlamı ve dokunmatik zikir sayacı.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EsmaPage,
});

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .replaceAll("â", "a")
    .replaceAll("î", "i")
    .replaceAll("û", "u")
    .replaceAll("'", "")
    .trim();
}

function EsmaPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EsmaName | null>(null);
  const [count, setCount] = useState(0);

  const list = useMemo(() => {
    const q = normalize(query);
    if (!q) return ESMA_UL_HUSNA;
    return ESMA_UL_HUSNA.filter(
      (n) => normalize(n.translit).includes(q) || normalize(n.meaning).includes(q),
    );
  }, [query]);

  const open = (name: EsmaName) => {
    setSelected(name);
    setCount(0);
  };

  return (
    <AppShell>
      <ScreenHeader
        title="Esmâü'l-Hüsnâ"
        subtitle="Allah'ın 99 güzel ismi — okunuşu ve anlamı"
        right={
          <span className="bg-emerald-gradient flex h-10 w-10 items-center justify-center rounded-2xl text-primary-foreground shadow-soft">
            <Sparkles className="h-5 w-5" />
          </span>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="İsim veya anlam ara…"
          className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-10 text-sm text-card-foreground outline-none transition focus:border-primary/60"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Aramayı temizle"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <ul className="space-y-2.5">
        {list.map((name) => (
          <li key={name.no}>
            <button
              type="button"
              onClick={() => open(name)}
              className="flex w-full items-center gap-3 rounded-3xl border border-border bg-card p-3.5 text-left shadow-soft transition-transform active:scale-[0.98]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-xs font-semibold text-accent-foreground">
                {name.no}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-card-foreground">
                  {name.translit}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{name.meaning}</span>
              </span>
              <span className="font-arabic shrink-0 text-lg text-primary" dir="rtl">
                {name.arabic}
              </span>
            </button>
          </li>
        ))}
        {list.length === 0 ? (
          <li className="rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aramanıza uygun isim bulunamadı.
          </li>
        ) : null}
      </ul>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl border border-border bg-card p-5 pb-8 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{selected.no}. isim</p>
                <h2 className="font-display text-xl text-gradient-emerald">{selected.translit}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Kapat"
                className="rounded-full bg-accent p-2 text-accent-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="font-arabic mb-3 text-center text-3xl leading-relaxed text-primary" dir="rtl">
              {selected.arabic}
            </p>
            <p className="mb-5 text-center text-sm text-muted-foreground">{selected.meaning}</p>

            <div className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-background p-3">
              <button
                type="button"
                onClick={() => setCount((c) => Math.max(0, c - 1))}
                aria-label="Azalt"
                className="rounded-2xl bg-accent p-3 text-accent-foreground"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="text-center">
                <p className={cn("font-display text-3xl", count > 0 && "text-primary")}>{count}</p>
                <p className="text-[11px] text-muted-foreground">zikir</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCount(0)}
                  aria-label="Sıfırla"
                  className="rounded-2xl bg-accent p-3 text-accent-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCount((c) => c + 1);
                    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
                  }}
                  aria-label="Artır"
                  className="bg-emerald-gradient rounded-2xl p-3 text-primary-foreground shadow-soft"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
