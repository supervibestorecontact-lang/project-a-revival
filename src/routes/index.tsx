import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  BellRing,
  ChevronRight,
  Clock,
  Compass,
  Flame,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PrayerHero } from "@/components/prayer-hero";
import { ThemeToggle } from "@/components/theme-toggle";
import { EDITIONS } from "@/lib/books";
import { currentStreak, useAppStore } from "@/store/app-store";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Namaz Vakti & Delâilü'l-Hayrât — Vakit, Ezan ve Vird" },
      {
        name: "description",
        content:
          "Açılır açılmaz bulunduğunuz vakti, sonraki namazı ve kalan süreyi görün; ezan hatırlatmaları, Delâil okuma, zikir halkası ve kıble tek uygulamada.",
      },
      { property: "og:title", content: "Namaz Vakti & Delâilü'l-Hayrât" },
      {
        property: "og:description",
        content: "Sonraki namaza kalan süre, ezan hatırlatmaları, Delâil, zikir ve kıble.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});


function QuickCard({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: typeof BookOpen;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-3xl border border-border bg-card p-3.5 shadow-soft transition-transform active:scale-[0.98]"
    >
      <span className="bg-emerald-gradient flex h-11 w-11 items-center justify-center rounded-2xl text-primary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-card-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{desc}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function PrayerHero() {
  const clock = usePrayerClock();
  const { times, nextKey, activeKey, remaining, remainingLabel, progress, ready, now } = clock;

  const hijriDate = now
    ? new Intl.DateTimeFormat("tr-TR-u-ca-islamic", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now)
    : "";
  const gregDate = now
    ? now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const localTime = now
    ? now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <section className="animate-rise relative mb-4 overflow-hidden rounded-[28px] border border-border/50 shadow-soft">
      {/* Full-bleed photographic background with dark overlay for text readability */}
      <div className="absolute inset-0">
        <img
          src={heroBgFor(activeKey)}
          alt=""
          className="h-full w-full object-cover transition-opacity duration-700"
          width={1024}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
      </div>

      <div className="relative px-5 pb-4 pt-4 text-white">
        {/* Top row: location + current prayer */}
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-medium backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5" />
            {clock.place ?? (clock.located ? "Konumunuz" : "İstanbul")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/25 px-3 py-1 opacity-90 backdrop-blur-sm">
            Şu an: <b className="font-semibold text-gold">{activeKey ? PRAYER_LABELS[activeKey] : "—"}</b> vakti
          </span>
        </div>

        {/* Countdown — large, clean, letter-spaced */}
        <p className="mt-5 text-center text-[11px] uppercase tracking-[0.28em] text-white/75">
          {nextKey ? PRAYER_LABELS[nextKey] : "İmsak"} vaktine kalan
        </p>
        <p className="mt-2 text-center font-sans text-[54px] font-light leading-none tabular-nums tracking-[0.04em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
          {ready ? remainingLabel : "--:--:--"}
        </p>
        <p className="mt-2.5 text-center text-sm font-medium text-white/90">
          {ready
            ? `${nextKey ? PRAYER_LABELS[nextKey] : "İmsak"} ${formatMinutes(times[nextKey ?? "imsak"])} · ${shortRemaining(remaining)} kaldı`
            : "Vakitler hesaplanıyor…"}
        </p>

        {/* Progress bar */}
        <div className="mt-3.5 h-1 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-gold transition-all duration-1000"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        {/* Date row: Hijri | Gregorian | Local time */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-white/15 text-center">
          <div className="px-2">
            <p className="text-[10px] text-white/55">Hicri</p>
            <p className="mt-0.5 text-[11px] font-medium leading-tight">{hijriDate}</p>
          </div>
          <div className="px-2">
            <p className="text-[10px] text-white/55">Tarih</p>
            <p className="mt-0.5 text-[11px] font-medium leading-tight">{gregDate}</p>
          </div>
          <div className="px-2">
            <p className="text-[10px] text-white/55">Yerel saat</p>
            <p className="mt-0.5 text-[11px] font-medium tabular-nums leading-tight">{localTime}</p>
          </div>
        </div>
      </div>

      {/* Prayer ribbon with icons */}
      <div className="relative grid grid-cols-6 divide-x divide-white/10 bg-black/35 backdrop-blur-sm">
        {PRAYER_ORDER.map((key) => {
          const isNext = key === nextKey;
          const isActive = key === activeKey;
          const Icon = PRAYER_ICONS[key];
          return (
            <div
              key={key}
              className={cn(
                "flex flex-col items-center gap-1 px-0.5 py-2.5 text-center transition-colors",
                isNext && "bg-gold/15",
              )}
            >
              <Icon
                className={cn("h-[18px] w-[18px]", isNext ? "text-gold" : isActive ? "text-white" : "text-white/45")}
                strokeWidth={isNext ? 2.3 : 1.7}
              />
              <p
                className={cn(
                  "text-[10px] font-medium leading-none",
                  isNext ? "text-gold" : "text-white/55",
                )}
              >
                {PRAYER_LABELS[key]}
              </p>
              <p
                className={cn(
                  "text-[12px] font-semibold tabular-nums leading-none",
                  isNext ? "text-white" : "text-white/80",
                )}
              >
                {ready ? formatMinutes(times[key]) : "--:--"}
              </p>
            </div>
          );
        })}
      </div>

      <Link
        to="/vakit"
        className="relative flex items-center justify-center gap-1.5 border-t border-white/10 bg-black/35 py-2.5 text-xs font-semibold text-gold backdrop-blur-sm"
      >
        Tüm vakitler ve ezan hatırlatmaları <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

function ContinueReading() {
  const lastRead = useAppStore((s) => s.lastRead);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !lastRead) return null;

  const edition = EDITIONS[lastRead.mode];
  return (
    <Link
      to="/oku"
      className="mb-4 flex items-center gap-3 rounded-3xl border border-gold/50 bg-card p-3.5 shadow-soft transition-transform active:scale-[0.98]"
    >
      <span className="bg-emerald-gradient flex h-11 w-11 items-center justify-center rounded-2xl text-primary-foreground">
        <BookOpen className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-card-foreground">Okumaya devam et</span>
        <span className="block truncate text-xs text-muted-foreground">
          {edition.short} · {lastRead.index + 1}. sayfa / {edition.totalPages}
        </span>
        <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-secondary">
          <span
            className="bg-emerald-gradient block h-full rounded-full"
            style={{ width: `${Math.round(((lastRead.index + 1) / edition.totalPages) * 100)}%` }}
          />
        </span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function HomePage() {
  const readDays = useAppStore((s) => s.readDays);
  const halkaHistory = useAppStore((s) => s.halkaHistory);
  const [mounted, setMounted] = useState(false);
  const [todayLabel, setTodayLabel] = useState("");
  useEffect(() => {
    setMounted(true);
    setTodayLabel(new Date().toLocaleDateString("tr-TR", { dateStyle: "long" }));
  }, []);

  const streak = mounted ? currentStreak(readDays) : 0;
  const todayDhikr = mounted ? (halkaHistory[new Date().toISOString().slice(0, 10)] ?? 0) : 0;

  return (
    <AppShell>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="font-display text-[22px] leading-tight text-gradient-emerald">
          Namaz Vakti · Delâil
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/vakit"
            aria-label="Bildirim ayarları"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
          >
            <BellRing className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </div>

      <PrayerHero />
      <ContinueReading />

      <section className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-border bg-card p-3 text-center shadow-soft">
          <Flame className="mx-auto h-4 w-4 text-gold" />
          <p className="mt-1 font-display text-xl text-card-foreground">{streak}</p>
          <p className="text-[10px] text-muted-foreground">Günlük okuma serisi</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-3 text-center shadow-soft">
          <Sparkles className="mx-auto h-4 w-4 text-primary" />
          <p className="mt-1 font-display text-xl text-card-foreground">{todayDhikr}</p>
          <p className="text-[10px] text-muted-foreground">Bugünkü zikir</p>
        </div>
      </section>

      <section className="space-y-3">
        <QuickCard
          to="/oku"
          icon={BookOpen}
          title="Delâilü'l-Hayrât Oku"
          desc={`Latince · Arapça · Türkçe — ${EDITIONS.arabic.totalPages} sayfa`}
        />
        <QuickCard to="/halka" icon={Sparkles} title="Zikir Halkası" desc="Günlük hedef ve ilerleme" />
        <QuickCard
          to="/esma"
          icon={Sparkles}
          title="Esmâü'l-Hüsnâ"
          desc="99 isim · arama ve favoriler"
        />
        <QuickCard to="/kible" icon={Compass} title="Kıble Pusulası" desc="Kâbe yönünü bul" />
        <QuickCard to="/vakit" icon={Clock} title="Namaz Vakitleri" desc="Ezan alarmları ve takip" />
      </section>


      <p className="mt-6 text-center text-[11px] text-muted-foreground">{todayLabel}</p>
      <SupportForm />
    </AppShell>
  );
}

const SUPPORT_EMAIL = "namazvaktiuygulamasi@gmail.com";

function SupportForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const valid = name.trim() && email.trim() && message.trim();

  const send = () => {
    if (!valid) return;
    const subject = encodeURIComponent(`Destek — ${name.trim()}`);
    const body = encodeURIComponent(
      `İsim: ${name.trim()}\nE-posta: ${email.trim()}\n\n${message.trim()}`,
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <section className="mt-6 rounded-[28px] border border-border bg-card p-4 shadow-soft">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="bg-emerald-gradient flex h-9 w-9 items-center justify-center rounded-2xl text-primary-foreground">
            <Mail className="h-4 w-4" />
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold text-card-foreground">Destek & İletişim</p>
            {open && (
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-primary underline underline-offset-2"
              >
                {SUPPORT_EMAIL}
              </a>
            )}
          </div>
        </div>
        <ChevronRight
          className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-2 animate-rise">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adınız (zorunlu)"
            className="w-full rounded-2xl border border-border bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="E-posta adresiniz (zorunlu)"
            className="w-full rounded-2xl border border-border bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Mesajınız (zorunlu)"
            className="w-full resize-none rounded-2xl border border-border bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={send}
            disabled={!valid}
            className="bg-emerald-gradient flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Gönder
          </button>
          <p className="text-center text-[11px] text-muted-foreground">
            Gönder'e bastığınızda mesaj {SUPPORT_EMAIL} adresine e-posta uygulamanız üzerinden
            iletilir.
          </p>
        </div>
      )}
    </section>
  );
}
