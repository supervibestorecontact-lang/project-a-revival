import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Check, Minus, Plus, RotateCcw, Sparkles, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell, ScreenHeader } from "@/components/app-shell";
import { HALKA_INTRO, HALKA_STEPS } from "@/lib/halka";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/halka")({
  head: () => ({
    meta: [
      { title: "Zikir Halkası — Günlük Zikir Turu" },
      {
        name: "description",
        content:
          "Estağfirullah, Salavât-ı Fâtih, Elhamdülillah, Allahu Ekber ve Sübhanallah zikirlerini 100 hedefiyle çekin; her hedefte hedef ikiye katlanır.",
      },
      { property: "og:title", content: "Zikir Halkası — Günlük Zikir Turu" },
      {
        property: "og:description",
        content: "Sıralı zikir halkası, katlanan hedefler ve elle sayı girişi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HalkaPage,
});

function HalkaPage() {
  const [mounted, setMounted] = useState(false);
  const [manual, setManual] = useState("");
  const [pulse, setPulse] = useState(0);
  useEffect(() => setMounted(true), []);

  const steps = useMemo(() => HALKA_STEPS, []);
  const stepIndex = useAppStore((s) => s.halkaStep);
  const setHalkaStep = useAppStore((s) => s.setHalkaStep);
  const counts = useAppStore((s) => s.halkaCounts);
  const targets = useAppStore((s) => s.halkaTargets);
  const addHalka = useAppStore((s) => s.addHalka);
  const resetHalka = useAppStore((s) => s.resetHalka);
  const haptics = useAppStore((s) => s.haptics);
  const goal = useAppStore((s) => s.halkaGoal);
  const setGoal = useAppStore((s) => s.setHalkaGoal);
  const history = useAppStore((s) => s.halkaHistory);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayTotal = mounted ? (history[todayKey] ?? 0) : 0;
  const goalRatio = Math.min(1, goal > 0 ? todayTotal / goal : 0);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return {
      key,
      label: d.toLocaleDateString("tr-TR", { weekday: "short" }),
      value: mounted ? (history[key] ?? 0) : 0,
    };
  });
  const weekMax = Math.max(goal, ...last7.map((d) => d.value), 1);
  const weekTotal = last7.reduce((a, d) => a + d.value, 0);

  const idx = Math.min(stepIndex, steps.length - 1);
  const step = steps[idx]!;
  const count = mounted ? (counts[step.id] ?? 0) : 0;
  const target = mounted ? (targets[step.id] ?? 100) : 100;
  const ratio = Math.min(1, count / target);
  const totalToday = mounted
    ? steps.reduce((a, s) => a + (counts[s.id] ?? 0), 0)
    : 0;
  const intro = HALKA_INTRO;

  const bump = (by: number) => {
    addHalka(step.id, by);
    setPulse((p) => p + 1);
    if (haptics && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(count + by >= target ? [30, 40, 60] : 14);
    }
  };

  return (
    <AppShell>
      <ScreenHeader
        title="Zikir Halkası"
        subtitle="Sıralı zikir turu · hedef her tamamlandığında ikiye katlanır"
      />

      <section className="bg-emerald-gradient animate-rise mb-4 overflow-hidden rounded-[28px] px-5 py-4 text-primary-foreground shadow-soft">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <div className="flex-1">
            <p className="font-display text-base leading-6">
              {intro.source}: “{intro.meaning}”
            </p>
          </div>
        </div>
      </section>


      <section className="mb-4 rounded-[28px] border border-border bg-card p-4 shadow-soft">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-gradient flex h-9 w-9 items-center justify-center rounded-2xl text-primary-foreground">
              <Target className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-card-foreground">Günlük hedef</p>
              <p className="text-[11px] text-muted-foreground">
                Bugün {todayTotal} / {goal} zikir
              </p>
            </div>
          </div>
          <p className="font-display text-2xl tabular-nums text-primary">
            %{Math.round(goalRatio * 100)}
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="bg-emerald-gradient h-full rounded-full transition-all duration-500"
            style={{ width: `${goalRatio * 100}%` }}
          />
        </div>
        <div className="mt-3 flex gap-2">
          {[100, 300, 500, 1000].map((g) => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              className={cn(
                "flex-1 rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition-colors",
                goal === g ? "border-gold/70 bg-secondary text-primary" : "border-border text-muted-foreground",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-5 rounded-[28px] border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-card-foreground">Son 7 gün</p>
          <span className="ml-auto text-[11px] text-muted-foreground">toplam {weekTotal}</span>
        </div>
        <div className="flex h-24 items-end justify-between gap-1.5">
          {last7.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {d.value > 0 ? d.value : ""}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-lg transition-all",
                  d.value >= goal ? "bg-gold" : "bg-emerald-gradient",
                )}
                style={{ height: `${Math.max(4, (d.value / weekMax) * 64)}px` }}
              />
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mb-5">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((s, i) => {
            const done = (counts[s.id] ?? 0) >= (targets[s.id] ?? 100);
            return (
              <button
                key={s.id}
                title={`${i + 1}. ${s.title}`}
                onClick={() => setHalkaStep(i)}
                className={cn(
                  "flex items-center justify-center gap-1 rounded-2xl border px-1.5 py-2 text-[10px] font-semibold leading-tight transition-all",
                  i === idx
                    ? "bg-emerald-gradient border-transparent text-primary-foreground shadow-soft"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {mounted && done ? <Check className="h-3 w-3 shrink-0" /> : null}
                <span className="truncate">
                  {i + 1}. {s.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="paper-surface animate-rise mb-5 rounded-[28px] border border-border p-5 text-center shadow-soft">
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink-soft/80">{step.title}</p>
        <p dir="rtl" className="mt-2 font-arabic text-[26px] leading-[2] text-ink">
          {step.arabic}
        </p>
        <p className="mt-2 text-xs font-medium text-ink-soft">{step.translit}</p>
        <p className="mt-1 text-[11px] text-ink-soft/80">{step.meaning}</p>
      </section>

      <div className="mb-5 flex flex-col items-center">
        <button
          onClick={() => bump(1)}
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
            <span className="mt-1 flex items-center gap-1 text-[11px] opacity-85">
              <Target className="h-3 w-3" /> hedef {target}
            </span>
          </span>
        </button>
        <p className="mt-3 text-xs text-muted-foreground">
          Saymak için dokunun · hedefe {Math.max(0, target - count)} kaldı
        </p>
      </div>

      <section className="mb-4 rounded-3xl border border-border bg-card p-4 shadow-soft">
        <p className="mb-2 text-sm font-semibold">Sayı ile ekle</p>
        <div className="flex gap-2">
          <input
            value={manual}
            inputMode="numeric"
            onChange={(e) => setManual(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Örn. 33"
            className="min-w-0 flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => {
              const n = Number(manual);
              if (!n) return;
              bump(n);
              setManual("");
            }}
            className="bg-emerald-gradient flex items-center gap-1 rounded-2xl px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Ekle
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          {[10, 33, 100].map((n) => (
            <button
              key={n}
              onClick={() => bump(n)}
              className="flex-1 rounded-2xl border border-border px-3 py-2 text-xs font-semibold text-primary"
            >
              +{n}
            </button>
          ))}
          <button
            onClick={() => bump(-1)}
            aria-label="Bir azalt"
            className="rounded-2xl border border-border px-3 py-2 text-muted-foreground"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </section>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setHalkaStep((idx + 1) % steps.length)}
          className="bg-emerald-gradient flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
        >
          Sıradaki zikir
        </button>
        <button
          onClick={() => resetHalka(step.id)}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold"
        >
          <RotateCcw className="h-4 w-4" /> Sıfırla
        </button>
      </div>
    </AppShell>
  );
}
