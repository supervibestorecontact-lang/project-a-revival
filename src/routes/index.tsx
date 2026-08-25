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
