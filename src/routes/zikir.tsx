import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellOff, History, Plus, RotateCcw, Trash2, Vibrate, VibrateOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell, ScreenHeader } from "@/components/app-shell";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/zikir")({
  head: () => ({
    meta: [
      { title: "Zikirmatik — Salavât Sayacı" },
      {
        name: "description",
        content:
          "Salât-ı Fâtih, Salât-ı Münciye ve kendi zikirleriniz için titreşimli dijital tesbih; hedef takibi ve günlük kayıtlar.",
      },
      { property: "og:title", content: "Zikirmatik — Salavât Sayacı" },
      {
        property: "og:description",
        content: "Dokunmatik büyük sayaç, hedef halkası ve zikir geçmişi.",
      },
    ],
  }),
  component: ZikirPage,
});

function ZikirPage() {
  const presets = useAppStore((s) => s.presets);
  const activePreset = useAppStore((s) => s.activePreset);
  const setActivePreset = useAppStore((s) => s.setActivePreset);
  const counts = useAppStore((s) => s.counts);
  const increment = useAppStore((s) => s.increment);
  const resetCount = useAppStore((s) => s.resetCount);
  const addPreset = useAppStore((s) => s.addPreset);
  const removePreset = useAppStore((s) => s.removePreset);
  const logs = useAppStore((s) => s.logs);
  const haptics = useAppStore((s) => s.haptics);
  const sound = useAppStore((s) => s.sound);
  const toggleHaptics = useAppStore((s) => s.toggleHaptics);
  const toggleSound = useAppStore((s) => s.toggleSound);

  const [mounted, setMounted] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", translit: "", target: "33" });
  const audioRef = useRef<AudioContext | null>(null);
  useEffect(() => setMounted(true), []);

  const preset = presets.find((p) => p.id === activePreset) ?? presets[0];
  const count = mounted && preset ? (counts[preset.id] ?? 0) : 0;
  const target = preset?.target ?? 33;
  const ratio = Math.min(1, count / target);

  const tap = () => {
    if (!preset) return;
    increment(preset.id);
    setPulse((p) => p + 1);
    if (haptics && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate((count + 1) % target === 0 ? [30, 40, 60] : 14);
    }
    if (sound) {
      try {
        const ctx =
          audioRef.current ??
          new (window.AudioContext || (window as any).webkitAudioContext)();
        audioRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = (count + 1) % target === 0 ? 880 : 620;
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.13);
      } catch {
        /* audio unavailable */
      }
    }
  };

  return (
    <AppShell>
      <ScreenHeader
        title="Zikirmatik"
        subtitle="Salavât ve zikirlerinizi sayın"
        right={
          <div className="flex gap-2">
            <button
              onClick={toggleHaptics}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border border-border",
                haptics ? "bg-secondary text-primary" : "bg-card text-muted-foreground",
              )}
            >
              {haptics ? <Vibrate className="h-4 w-4" /> : <VibrateOff className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleSound}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border border-border",
                sound ? "bg-secondary text-primary" : "bg-card text-muted-foreground",
              )}
            >
              {sound ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </button>
          </div>
        }
      />

      <div className="-mx-4 mb-5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePreset(p.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all",
                p.id === preset?.id
                  ? "bg-emerald-gradient border-transparent text-primary-foreground shadow-soft"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {p.title}
            </button>
          ))}
          <button
            onClick={() => setShowAdd(true)}
            className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border px-3.5 py-2 text-xs font-semibold text-primary"
          >
            <Plus className="h-3.5 w-3.5" /> Yeni
          </button>
        </div>
      </div>

      <section className="paper-surface animate-rise mb-5 rounded-[28px] border border-border p-5 text-center shadow-soft">
        <p dir="rtl" className="font-arabic text-[26px] leading-[2] text-ink">
          {preset?.arabic}
        </p>
        <p className="mt-2 text-xs text-ink-soft">{preset?.translit}</p>
      </section>

      <div className="mb-5 flex flex-col items-center">
        <button
          onClick={tap}
          key={pulse}
          className="animate-pop relative flex h-56 w-56 items-center justify-center rounded-full"
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="46" fill="none" stroke="var(--border)" strokeWidth="4" />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="var(--gold)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${ratio * 289} 289`}
              className="transition-all duration-300"
            />
          </svg>
          <span className="bg-emerald-gradient flex h-44 w-44 flex-col items-center justify-center rounded-full text-primary-foreground shadow-soft">
            <span className="font-display text-6xl leading-none">{count}</span>
            <span className="mt-1 text-[11px] opacity-80">hedef {target}</span>
          </span>
        </button>
        <p className="mt-3 text-xs text-muted-foreground">
          Saymak için dokunun · {Math.floor(count / target)} tur tamamlandı
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => preset && resetCount(preset.id)}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground"
        >
          <RotateCcw className="h-4 w-4" /> Sıfırla ve kaydet
        </button>
        {preset?.custom ? (
          <button
            onClick={() => removePreset(preset.id)}
            className="flex items-center justify-center rounded-2xl border border-border bg-card px-4 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <section>
        <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold">
          <History className="h-4 w-4 text-primary" /> Zikir geçmişi
        </h2>
        {mounted && logs.length > 0 ? (
          <ul className="space-y-2">
            {logs.slice(0, 12).map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm"
              >
                <span className="font-medium">{log.title}</span>
                <span className="text-muted-foreground">
                  {log.count} · {log.date}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
            Henüz kayıt yok. Sayacı sıfırladığınızda buraya eklenir.
          </p>
        )}
      </section>

      {showAdd ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowAdd(false)}>
          <div
            className="animate-rise w-full rounded-t-[28px] bg-card p-5 safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
            <h3 className="mb-3 font-display text-lg">Yeni zikir ekle</h3>
            <div className="space-y-3">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Zikir adı"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <input
                value={form.translit}
                onChange={(e) => setForm({ ...form, translit: e.target.value })}
                placeholder="Okunuşu"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <input
                value={form.target}
                inputMode="numeric"
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                placeholder="Hedef"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={() => {
                  if (!form.title.trim()) return;
                  addPreset({
                    id: `custom-${Date.now()}`,
                    title: form.title.trim(),
                    arabic: "",
                    translit: form.translit.trim(),
                    target: Math.max(1, Number(form.target) || 33),
                    custom: true,
                  });
                  setForm({ title: "", translit: "", target: "33" });
                  setShowAdd(false);
                }}
                className="bg-emerald-gradient w-full rounded-2xl py-3 text-sm font-semibold text-primary-foreground"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
