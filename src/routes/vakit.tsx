import { createFileRoute } from "@tanstack/react-router";
import { BellRing, CheckCheck, Clock, LocateFixed, MapPin, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell, ScreenHeader } from "@/components/app-shell";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import {
  computePrayerTimes,
  formatMinutes,
  PRAYER_LABELS,
  PRAYER_ORDER,
  type PrayerKey,
} from "@/lib/prayer-times";

export const Route = createFileRoute("/vakit")({
  head: () => ({
    meta: [
      { title: "Namaz Vakitleri — Günlük Ezan Saatleri" },
      {
        name: "description",
        content:
          "Konumunuza göre imsak, güneş, öğle, ikindi, akşam ve yatsı vakitleri; bir sonraki vakte kalan süreyi canlı takip edin.",
      },
      { property: "og:title", content: "Namaz Vakitleri" },
      {
        property: "og:description",
        content: "Bulunduğunuz yerin günlük namaz vakitleri ve kalan süre sayacı.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrayerTimesPage,
});

const ISTANBUL = { lat: 41.0082, lng: 28.9784 };

const SALAH_KEYS: PrayerKey[] = ["imsak", "ogle", "ikindi", "aksam", "yatsi"];
const SALAH_LABELS: Record<string, string> = {
  imsak: "Sabah",
  ogle: "Öğle",
  ikindi: "İkindi",
  aksam: "Akşam",
  yatsi: "Yatsı",
};

function PrayerTimesPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(ISTANBUL);
  const [located, setLocated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Cihazınız konum servisini desteklemiyor. İstanbul vakitleri gösteriliyor.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocated(true);
        setError(null);
      },
      () => setError("Konum izni verilmedi. İstanbul vakitleri gösteriliyor."),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    let cancelled = false;
    setPlaceLoading(true);
    fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lng}&localityLanguage=tr`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const province: string | undefined = data.principalSubdivision || data.locality;
        const district: string | undefined = data.city || data.locality;
        const parts = [province, district].filter(
          (v, i, arr): v is string => Boolean(v) && arr.indexOf(v) === i,
        );
        setPlaceName(parts.length ? parts.join(" · ") : null);
      })
      .catch(() => {
        if (!cancelled) setPlaceName(null);
      })
      .finally(() => {
        if (!cancelled) setPlaceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lng]);

  const times = useMemo(
    () => computePrayerTimes(now ?? new Date(), coords.lat, coords.lng),
    [now?.getDate(), coords.lat, coords.lng],
  );

  const nowMin = now ? now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60 : 0;

  const nextKey: PrayerKey | null = now
    ? (PRAYER_ORDER.find((k) => times[k] > nowMin) ?? null)
    : null;

  const activeKey: PrayerKey | null = now
    ? (() => {
        const past = PRAYER_ORDER.filter((k) => times[k] <= nowMin);
        return past.length ? past[past.length - 1]! : "yatsi";
      })()
    : null;

  const remaining = now
    ? (nextKey ? times[nextKey] - nowMin : times.imsak + 24 * 60 - nowMin)
    : 0;

  const remainingLabel = (() => {
    const total = Math.max(0, Math.floor(remaining * 60));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  })();

  const salahLog = useAppStore((s) => s.salahLog);
  const setSalah = useAppStore((s) => s.setSalah);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayLog = salahLog[todayKey] ?? {};
  const doneCount = SALAH_KEYS.filter((k) => todayLog[k] === "done").length;

  const alarms = useAppStore((s) => s.alarms);
  const toggleAlarm = useAppStore((s) => s.toggleAlarm);
  const setAlarmLead = useAppStore((s) => s.setAlarmLead);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const enableNotifications = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const res = await Notification.requestPermission();
    setPermission(res);
  }, []);

  // Alarm kontrolü: her saniye tetiklenen `now` üzerinden kalan süreyi ölçer.
  useEffect(() => {
    if (!now || permission !== "granted") return;
    const dayKey = now.toISOString().slice(0, 10);
    for (const key of PRAYER_ORDER) {
      const cfg = alarms[key];
      if (!cfg?.enabled) continue;
      const t = times[key];
      if (Number.isNaN(t)) continue;
      const diff = t - nowMin;
      if (diff <= cfg.lead && diff > cfg.lead - 1 / 30) {
        const id = `${dayKey}-${key}-${cfg.lead}`;
        if (firedRef.current.has(id)) continue;
        firedRef.current.add(id);
        new Notification(`${PRAYER_LABELS[key]} vakti yaklaşıyor`, {
          body: `${cfg.lead} dakika sonra ${PRAYER_LABELS[key]} (${formatMinutes(t)}).`,
        });
        if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
      }
    }
  }, [now, permission, alarms, times, nowMin]);


  return (
    <AppShell>
      <ScreenHeader title="Namaz Vakitleri" subtitle="Konumunuza göre günlük vakitler" />

      <section className="animate-rise mb-5 overflow-hidden rounded-[28px] border border-border bg-card shadow-soft">
        <div className="bg-emerald-gradient relative px-5 py-5 text-primary-foreground">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(120%_100%_at_100%_0%,var(--gold),transparent_55%)]" />
          <div className="relative text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">Sıradaki vakit</p>
            <p className="font-display mt-1 text-2xl">
              {nextKey ? PRAYER_LABELS[nextKey] : now ? "İmsak" : "—"}
            </p>
            <p className="mt-2 font-display text-4xl tabular-nums text-gold">
              {now ? remainingLabel : "--:--:--"}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-1 text-xs font-medium">
              <MapPin className="h-3.5 w-3.5" />
              {placeLoading && !placeName
                ? "Konum belirleniyor…"
                : (placeName ?? (located ? "Konumunuz" : "İstanbul (varsayılan)"))}
            </p>
            <p className="mt-1 text-xs opacity-80">
              {now
                ? now.toLocaleDateString("tr-TR", { dateStyle: "long" })
                : "Yükleniyor…"}
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
                  <p className="text-sm font-semibold text-card-foreground">
                    {PRAYER_LABELS[key]}
                  </p>
                  {isNext ? (
                    <p className="text-[11px] text-gold">Sıradaki</p>
                  ) : isActive ? (
                    <p className="text-[11px] text-muted-foreground">Şu anki vakit</p>
                  ) : null}
                </div>
              </div>
              <p className="font-display text-xl tabular-nums text-card-foreground">
                {now ? formatMinutes(times[key]) : "--:--"}
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
                  <p className="text-sm font-semibold text-card-foreground">
                    {SALAH_LABELS[key]}
                  </p>
                  <p className="text-[11px] tabular-nums text-muted-foreground">
                    {now ? formatMinutes(times[key]) : "--:--"}
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

      <section className="mt-5 rounded-[28px] border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <span className="bg-emerald-gradient flex h-9 w-9 items-center justify-center rounded-2xl text-primary-foreground">
            <BellRing className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-card-foreground">Namaz Alarmı</p>
            <p className="text-[11px] text-muted-foreground">
              Her vakit için hatırlatmayı aç ve süreyi seç
            </p>
          </div>
        </div>

        {permission === "unsupported" ? (
          <p className="mb-3 rounded-2xl bg-secondary px-4 py-3 text-xs text-secondary-foreground">
            Bu cihaz bildirimleri desteklemiyor.
          </p>
        ) : permission !== "granted" ? (
          <button
            onClick={enableNotifications}
            className="bg-emerald-gradient mb-3 w-full rounded-2xl py-3 text-sm font-semibold text-primary-foreground"
          >
            Bildirimlere İzin Ver
          </button>
        ) : null}

        <div className="space-y-2">
          {PRAYER_ORDER.map((key) => {
            const cfg = alarms[key] ?? { enabled: false, lead: 15 };
            return (
              <div key={key} className="rounded-2xl border border-border/70 bg-background/60 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-card-foreground">
                    {PRAYER_LABELS[key]}
                  </p>
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
                    {[15, 30, 60].map((lead) => (
                      <button
                        key={lead}
                        onClick={() => setAlarmLead(key, lead)}
                        className={cn(
                          "rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition-colors",
                          cfg.lead === lead
                            ? "border-gold/70 bg-secondary text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {lead === 60 ? "1 saat önce" : `${lead} dk önce`}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Hatırlatmalar uygulama açıkken çalışır.
        </p>
      </section>

      <button
        onClick={requestLocation}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold"
      >
        <LocateFixed className="h-4 w-4 text-primary" />
        {located ? "Konumu Yenile" : "Konumumu Kullan"}
      </button>

      {error ? (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-xs text-secondary-foreground">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      ) : null}

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Vakitler cihazınızda hesaplanır (İmsak 18°, Yatsı 17°). Yerel takvimle küçük farklar
        olabilir.
      </p>
    </AppShell>
  );
}
