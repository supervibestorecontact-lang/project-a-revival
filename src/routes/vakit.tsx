import { createFileRoute } from "@tanstack/react-router";
import {
  BellRing,
  CheckCheck,
  Clock,
  LocateFixed,
  MapPin,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell, ScreenHeader } from "@/components/app-shell";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import {
  formatMinutes,
  PRAYER_LABELS,
  PRAYER_ORDER,
  shortRemaining,
  usePrayerClock,
} from "@/lib/prayer-clock";
import {
  notifyState,
  requestNotifyPermission,
  sendTestNotification,
  type NotifyState,
} from "@/lib/notifications";

export const Route = createFileRoute("/vakit")({
  head: () => ({
    meta: [
      { title: "Namaz Vakitleri — Ezan Saatleri ve Hatırlatmalar" },
      {
        name: "description",
        content:
          "Konumunuza göre imsak, güneş, öğle, ikindi, akşam ve yatsı vakitleri; ezan vaktinde veya 5/10/15/30/60 dakika önce hatırlatma ve bildirim testi.",
      },
      { property: "og:title", content: "Namaz Vakitleri ve Ezan Hatırlatmaları" },
      {
        property: "og:description",
        content: "Günlük vakitler, kalan süre sayacı ve güçlü bildirim ayarları.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrayerTimesPage,
});

const SALAH_KEYS = ["imsak", "ogle", "ikindi", "aksam", "yatsi"] as const;
const SALAH_LABELS: Record<string, string> = {
  imsak: "Sabah",
  ogle: "Öğle",
  ikindi: "İkindi",
  aksam: "Akşam",
  yatsi: "Yatsı",
};

const LEAD_OPTIONS = [0, 5, 10, 15, 30, 60];
const leadLabel = (lead: number) =>
  lead === 0 ? "Ezan vakti" : lead === 60 ? "1 saat önce" : `${lead} dk önce`;

function PrayerTimesPage() {
  const clock = usePrayerClock();
  const { times, nextKey, activeKey, remaining, remainingLabel, ready } = clock;

  const salahLog = useAppStore((s) => s.salahLog);
  const setSalah = useAppStore((s) => s.setSalah);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayLog = salahLog[todayKey] ?? {};
  const doneCount = SALAH_KEYS.filter((k) => todayLog[k] === "done").length;

  const alarms = useAppStore((s) => s.alarms);
  const toggleAlarm = useAppStore((s) => s.toggleAlarm);
  const toggleAlarmLead = useAppStore((s) => s.toggleAlarmLead);
  const setAllAlarms = useAppStore((s) => s.setAllAlarms);
  const lockCountdownRaw = useAppStore((s) => s.lockCountdown);
  const setLockCountdown = useAppStore((s) => s.setLockCountdown);


  const [permission, setPermission] = useState<NotifyState>("default");
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPermission(notifyState());
    const onVisible = () => setPermission(notifyState());
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const enableNotifications = useCallback(async () => {
    setPermission(await requestNotifyPermission());
  }, []);

  const runTest = useCallback(async () => {
    const res = await sendTestNotification();
    setPermission(notifyState());
    setTestMsg(res.message);
  }, []);

  const activeAlarmCount = mounted
    ? PRAYER_ORDER.filter((k) => alarms[k]?.enabled).length
    : 0;
  const notificationsWorking = permission === "granted" && activeAlarmCount > 0;

  return (
    <AppShell>
      <ScreenHeader title="Namaz Vakitleri" subtitle="Konumunuza göre günlük vakitler" />

      <section className="animate-rise mb-5 overflow-hidden rounded-[28px] border border-border bg-card shadow-soft">
        <div className="bg-emerald-gradient relative px-5 py-5 text-primary-foreground">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(120%_100%_at_100%_0%,var(--gold),transparent_55%)]" />
          <div className="relative text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">
              Şu an {activeKey ? PRAYER_LABELS[activeKey] : "—"} vakti · sıradaki
            </p>
            <p className="font-display mt-1 text-2xl">
              {nextKey ? PRAYER_LABELS[nextKey] : ready ? "İmsak" : "—"}
            </p>
            <p className="mt-2 font-display text-4xl tabular-nums text-gold">
              {ready ? remainingLabel : "--:--:--"}
            </p>
            <p className="mt-1 text-xs opacity-85">{ready ? `${shortRemaining(remaining)} kaldı` : ""}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-1 text-xs font-medium">
              <MapPin className="h-3.5 w-3.5" />
              {clock.place ?? (clock.located ? "Konumunuz" : "İstanbul (varsayılan)")}
            </p>
            <p className="mt-1 text-xs opacity-80">
              {clock.now ? clock.now.toLocaleDateString("tr-TR", { dateStyle: "long" }) : "Yükleniyor…"}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        {PRAYER_ORDER.map((key) => {
          const isActive = key === activeKey;
          const isNext = key === nextKey;
          return (
            <div
              key={key}
              className={
                isNext
                  ? "flex items-center justify-between rounded-3xl border border-gold/60 bg-card px-5 py-4 shadow-soft"
                  : "flex items-center justify-between rounded-3xl border border-border bg-card px-5 py-4"
              }
            >
              <div className="flex items-center gap-3">
                <span
                  className={
                    isActive
                      ? "bg-emerald-gradient flex h-9 w-9 items-center justify-center rounded-2xl text-primary-foreground"
                      : "flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground"
                  }
                >
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{PRAYER_LABELS[key]}</p>
                  {isNext ? (
                    <p className="text-[11px] text-gold">Sıradaki</p>
                  ) : isActive ? (
                    <p className="text-[11px] text-muted-foreground">Şu anki vakit</p>
                  ) : null}
                </div>
              </div>
              <p className="font-display text-xl tabular-nums text-card-foreground">
                {ready ? formatMinutes(times[key]) : "--:--"}
              </p>
            </div>
          );
        })}
      </section>

      <section className="mt-5 rounded-[28px] border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <span className="bg-emerald-gradient flex h-9 w-9 items-center justify-center rounded-2xl text-primary-foreground">
            <CheckCheck className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-card-foreground">Namazımı Kıldım</p>
            <p className="text-[11px] text-muted-foreground">
              Bugün {doneCount}/5 vakit işaretlendi — her gün sıfırlanır
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {SALAH_KEYS.map((key) => {
            const status = todayLog[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{SALAH_LABELS[key]}</p>
                  <p className="text-[11px] tabular-nums text-muted-foreground">
                    {ready ? formatMinutes(times[key]) : "--:--"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSalah(key, "done")}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                      status === "done"
                        ? "bg-emerald-gradient border-transparent text-primary-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    Kıldım
                  </button>
                  <button
                    onClick={() => setSalah(key, "missed")}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                      status === "missed"
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    Kılmadım
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- Bildirim & alarm merkezi ---- */}
      <section className="mt-5 rounded-[28px] border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <span className="bg-emerald-gradient flex h-9 w-9 items-center justify-center rounded-2xl text-primary-foreground">
            <BellRing className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-card-foreground">Ezan & Hatırlatma</p>
            <p className="text-[11px] text-muted-foreground">
              Her vakit için ezan anı ve 5/10/15/30/60 dk önce hatırlatma
            </p>
          </div>
        </div>

        {/* Durum rozeti */}
        <div
          className={cn(
            "mb-3 flex items-start gap-2 rounded-2xl px-3 py-2.5 text-xs",
            notificationsWorking
              ? "bg-secondary text-secondary-foreground"
              : "bg-destructive/10 text-destructive",
          )}
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {permission === "unsupported"
              ? "Bu cihaz/tarayıcı bildirimleri desteklemiyor. Uygulamayı ana ekrana ekleyip tekrar deneyin."
              : permission === "denied"
                ? "Bildirimler engellenmiş. Telefon ayarları → Uygulamalar → bu uygulama → Bildirimler bölümünden izin verin, sonra sayfayı yenileyin."
                : permission !== "granted"
                  ? "Bildirim izni henüz verilmedi. Hatırlatmaların çalışması için izin verin."
                  : activeAlarmCount === 0
                    ? "İzin verildi ancak hiçbir vakit için hatırlatma açık değil."
                    : `Bildirimler aktif · ${activeAlarmCount} vakit için hatırlatma kurulu.`}
          </span>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          {permission !== "granted" && permission !== "unsupported" ? (
            <button
              onClick={enableNotifications}
              className="bg-emerald-gradient col-span-2 rounded-2xl py-3 text-sm font-semibold text-primary-foreground"
            >
              Bildirimlere İzin Ver
            </button>
          ) : null}
          <button
            onClick={runTest}
            className="rounded-2xl border border-border py-3 text-sm font-semibold text-primary"
          >
            Bildirim Testi
          </button>
          <button
            onClick={() => setAllAlarms(activeAlarmCount === 0)}
            className="rounded-2xl border border-border py-3 text-sm font-semibold text-primary"
          >
            {activeAlarmCount === 0 ? "Tümünü Aç" : "Tümünü Kapat"}
          </button>
        </div>

        {/* Kilit ekranı geri sayımı */}
        <button
          onClick={() => {
            if (!lockCountdown && permission !== "granted") {
              void enableNotifications();
            }
            setLockCountdown(!lockCountdown);
          }}
          className="mb-3 flex w-full items-start gap-3 rounded-2xl border border-border px-3 py-3 text-left"
          aria-pressed={lockCountdown}
        >
          <span className="flex-1">
            <span className="block text-sm font-semibold text-card-foreground">
              Kilit ekranında kalan süre
            </span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              Uygulama kapalıyken bile tek, sessiz bir bildirimde sonraki namaza kalan süre görünür.
              Titreşim ve ses yoktur, pili yormaz.
            </span>
          </span>
          <span
            className={cn(
              "mt-0.5 h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors",
              lockCountdown ? "bg-emerald-gradient" : "bg-secondary",
            )}
          >
            <span
              className={cn(
                "block h-5 w-5 rounded-full bg-background transition-transform",
                lockCountdown && "translate-x-5",
              )}
            />
          </span>
        </button>


        {testMsg ? (
          <p className="mb-3 rounded-2xl bg-secondary px-3 py-2.5 text-[11px] text-secondary-foreground">
            {testMsg}
          </p>
        ) : null}

        <div className="space-y-2">
          {PRAYER_ORDER.map((key) => {
            const cfg = (mounted && alarms[key]) || { enabled: false, leads: [0] };
            return (
              <div key={key} className="rounded-2xl border border-border/70 bg-background/60 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-card-foreground">{PRAYER_LABELS[key]}</p>
                  <button
                    onClick={() => toggleAlarm(key)}
                    role="switch"
                    aria-checked={cfg.enabled}
                    aria-label={`${PRAYER_LABELS[key]} alarmı`}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      cfg.enabled ? "bg-emerald-gradient" : "bg-secondary",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                        cfg.enabled ? "left-[22px]" : "left-0.5",
                      )}
                    />
                  </button>
                </div>
                {cfg.enabled ? (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {LEAD_OPTIONS.map((lead) => {
                      const on = cfg.leads.includes(lead);
                      return (
                        <button
                          key={lead}
                          onClick={() => toggleAlarmLead(key, lead)}
                          className={cn(
                            "rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition-colors",
                            on
                              ? "border-gold/70 bg-secondary text-primary"
                              : "border-border text-muted-foreground",
                          )}
                        >
                          {leadLabel(lead)}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Hatırlatmalar cihazınızda saklanır; telefon yeniden başlasa bile ayarlar korunur ve
          uygulama her açıldığında bildirimler otomatik kontrol edilip yeniden planlanır. En güvenilir
          sonuç için uygulamayı ana ekrana ekleyin ve pil optimizasyonundan muaf tutun.
        </p>
      </section>

      <button
        onClick={clock.requestLocation}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold"
      >
        <LocateFixed className="h-4 w-4 text-primary" />
        {clock.located ? "Konumu Yenile" : "Konumumu Kullan"}
      </button>

      {clock.error ? (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-xs text-secondary-foreground">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {clock.error}
        </p>
      ) : null}

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Vakitler cihazınızda hesaplanır (İmsak 18°, Yatsı 17°) — internet olmadan da çalışır. Yerel
        takvimle küçük farklar olabilir.
      </p>
    </AppShell>
  );
}
