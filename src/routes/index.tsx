import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Bell,
  ChevronRight,
  Clock,
  Compass,
  Flame,
  Infinity as Loop,
  Mail,
  Send,
  Settings,
  Sparkles,
} from "lucide-react";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ThemeToggle } from "@/components/theme-toggle";
import { EDITIONS } from "@/lib/books";
import { currentStreak, useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Delâilü'l-Hayrât — Günlük Vird ve Salavât" },
      {
        name: "description",
        content:
          "Günlük hizb takibi, salavât zikirmatiği, Esmâü'l-Hüsnâ ve kıble pusulası ile Delâilü'l-Hayrât okuma rehberiniz.",
      },
      { property: "og:title", content: "Delâilü'l-Hayrât — Günlük Vird ve Salavât" },
      {
        property: "og:description",
        content: "Günün hizbini oku, salavât çek, Esmâ zikret ve kıbleyi bul.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const DUA_OF_DAY = {
  arabic: "اَللّٰهُمَّ صَلِّ عَلٰى سَيِّدِنَا مُحَمَّدٍ وَعَلٰى اٰلِهِ وَصَحْبِهِ وَسَلِّمْ",
  translit: "Allâhümme salli alâ seyyidinâ Muhammedin ve alâ âlihî ve sahbihî ve sellim",
  meaning:
    "Allah'ım! Efendimiz Muhammed'e, âline ve ashâbına salât ve selâm eyle.",
};



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

function HomePage() {
  const readDays = useAppStore((s) => s.readDays);
  const counts = useAppStore((s) => s.counts);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const [mounted, setMounted] = useState(false);
  const [todayLabel, setTodayLabel] = useState("");
  useEffect(() => {
    setMounted(true);
    setTodayLabel(new Date().toLocaleDateString("tr-TR", { dateStyle: "long" }));
  }, []);

  const streak = mounted ? currentStreak(readDays) : 0;
  const totalDhikr = mounted ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[26px] leading-tight text-gradient-emerald">
            Namaz Vakti Delâilü'l-Hayrât
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            aria-label="Bildirimler"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
          >
            <Bell className="h-[18px] w-[18px]" />
          </button>
          <button
            aria-label="Ayarlar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
          >
            <Settings className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <section className="animate-rise mb-4 overflow-hidden rounded-[28px] border border-border bg-card shadow-soft">
        <div className="bg-emerald-gradient relative px-5 py-4 text-primary-foreground">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(120%_100%_at_100%_0%,var(--gold),transparent_55%)]" />
          <div className="relative flex items-center justify-between gap-3">
            <p className="font-display text-base leading-6">
              Gerçekten Allah ve melekleri Peygambere salât ederler. Ey iman edenler! Siz de ona teslimiyetle salât ve selâm edin. (Ahzâb Sûresi 56. Ayet)
            </p>
            <Sparkles className="h-5 w-5 shrink-0 text-gold" />
          </div>
        </div>
        <div className="paper-surface px-5 py-5">
          <p dir="rtl" className="font-arabic text-center text-[22px] leading-[2] text-ink">
            {DUA_OF_DAY.arabic}
          </p>
          <p className="mt-3 text-center text-sm font-medium text-ink-soft">
            {DUA_OF_DAY.translit}
          </p>
          <p className="mt-2 text-center text-xs text-ink-soft/80">{DUA_OF_DAY.meaning}</p>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <Link
            to="/oku"
            className="bg-emerald-gradient flex-1 rounded-2xl px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
          >
            Delâilü'l-Hayrât Oku
          </Link>
          <Link
            to="/zikir"
            className="rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-primary"
          >
            Salavât
          </Link>
        </div>
      </section>


      <section className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-3xl border border-border bg-card p-3 text-center shadow-soft">
          <Flame className="mx-auto h-4 w-4 text-gold" />
          <p className="mt-1 font-display text-xl text-card-foreground">{streak}</p>
          <p className="text-[10px] text-muted-foreground">Günlük seri</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-3 text-center shadow-soft">
          <Loop className="mx-auto h-4 w-4 text-primary" />
          <p className="mt-1 font-display text-xl text-card-foreground">{totalDhikr}</p>
          <p className="text-[10px] text-muted-foreground">Toplam zikir</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-3 text-center shadow-soft">
          <BookOpen className="mx-auto h-4 w-4 text-primary" />
          <p className="mt-1 font-display text-xl text-card-foreground">
            {mounted ? bookmarks.length : 0}
          </p>
          <p className="text-[10px] text-muted-foreground">Yer imi</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="px-1 text-sm font-semibold text-foreground">Hızlı erişim</h2>
        <QuickCard
          to="/vakit"
          icon={Clock}
          title="Namaz Vakitleri"
          desc="Konumuna göre günlük vakitler"
        />
        <QuickCard
          to="/oku"
          icon={BookOpen}
          title="Delâilü'l-Hayrât Oku"
          desc={`Latince · Arapça · Türkçe — ${EDITIONS.arabic.totalPages} sayfa`}
        />
        <QuickCard
          to="/esma"
          icon={Sparkles}
          title="Esmâü'l-Hüsnâ"
          desc="Allah'ın 99 ismi, anlamı ve zikri"
        />
        <QuickCard to="/kible" icon={Compass} title="Kıble Pusulası" desc="Kâbe yönünü bul" />
      </section>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        {todayLabel}
      </p>
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
