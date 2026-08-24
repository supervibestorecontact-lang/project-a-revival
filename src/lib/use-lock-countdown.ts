import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { DEFAULT_COORDS, loadCachedCoords, loadCachedPlace } from "@/lib/prayer-clock";
import { computePrayerTimes, PRAYER_LABELS, PRAYER_ORDER } from "@/lib/prayer-times";
import { clearOngoingCountdown, updateOngoingCountdown } from "@/lib/ongoing-countdown";
import { notifyState } from "@/lib/notifications";

function buildUpcoming(now: Date, lat: number, lng: number) {
  const list: { label: string; ts: number }[] = [];
  for (const dayOffset of [0, 1]) {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    const times = computePrayerTimes(d, lat, lng);
    for (const key of PRAYER_ORDER) {
      const min = times[key];
      if (Number.isNaN(min)) continue;
      const ts = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() + min * 60000;
      if (ts > now.getTime()) list.push({ label: PRAYER_LABELS[key], ts });
    }
  }
  return list.sort((a, b) => a.ts - b.ts).slice(0, 8);
}

/**
 * Uygulama kapalıyken bile kilit ekranında görünen tek, sessiz bir bildirimle
 * sonraki namaza kalan süreyi gösterir. Dakikada bir kez, metin değiştiyse güncellenir;
 * ek hesaplama yapılmadığı için telefonu yavaşlatmaz.
 */
export function useLockCountdown() {
  const enabled = useAppStore((s) => s.lockCountdown);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) {
      void clearOngoingCountdown();
      return;
    }

    let stopped = false;
    const tick = () => {
      if (stopped || notifyState() !== "granted") return;
      const coords = loadCachedCoords() ?? DEFAULT_COORDS;
      const now = new Date();
      const upcoming = buildUpcoming(now, coords.lat, coords.lng);
      const next = upcoming[0];
      if (!next) return;
      void updateOngoingCountdown({
        label: next.label,
        at: new Date(next.ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        ts: next.ts,
        place: loadCachedPlace() ?? undefined,
        upcoming,
      });
    };

    tick();
    const id = setInterval(tick, 60000);
    const onVisible = () => tick();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pagehide", onVisible);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", onVisible);
    };
  }, [enabled]);
}
