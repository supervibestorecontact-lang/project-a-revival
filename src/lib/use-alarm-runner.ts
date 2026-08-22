import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { DEFAULT_COORDS, loadCachedCoords } from "@/lib/prayer-clock";
import { loadFired, markFired, notifyState, showNotification } from "@/lib/notifications";
import { computePrayerTimes, formatMinutes, PRAYER_LABELS, PRAYER_ORDER } from "@/lib/prayer-times";

/**
 * Uygulama her açıldığında ve açıkken periyodik olarak hatırlatmaları yeniden hesaplar.
 * Tetiklenen hatırlatmalar cihazda saklandığı için telefon yeniden başlasa bile tekrar etmez
 * ve kaçırılmayan hatırlatmalar uygulama açılır açılmaz yeniden planlanır.
 */
export function useAlarmRunner() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tick = () => {
      if (notifyState() !== "granted") return;
      const alarms = useAppStore.getState().alarms;
      if (!alarms || Object.keys(alarms).length === 0) return;

      const coords = loadCachedCoords() ?? DEFAULT_COORDS;
      const now = new Date();
      const times = computePrayerTimes(now, coords.lat, coords.lng);
      const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
      const dayKey = now.toISOString().slice(0, 10);
      const fired = new Set(loadFired());

      for (const key of PRAYER_ORDER) {
        const cfg = alarms[key];
        if (!cfg?.enabled) continue;
        const t = times[key];
        if (Number.isNaN(t)) continue;
        for (const lead of cfg.leads) {
          const at = t - lead;
          const diff = at - nowMin;
          // 0 ile 2 dakika gecikme aralığında yakalananlar tetiklenir (uygulama kapalıyken kaçanlar dahil).
          if (diff > 0 || diff < -2) continue;
          const id = `${dayKey}-${key}-${lead}`;
          if (fired.has(id)) continue;
          markFired(id);
          fired.add(id);
          void showNotification(
            lead === 0
              ? `${PRAYER_LABELS[key]} vakti girdi`
              : `${PRAYER_LABELS[key]} vaktine ${lead} dakika`,
            lead === 0
              ? `${PRAYER_LABELS[key]} vakti: ${formatMinutes(t)}`
              : `${formatMinutes(t)} — ${PRAYER_LABELS[key]} vakti yaklaşıyor.`,
          );
          if (navigator.vibrate) navigator.vibrate([160, 80, 160]);
        }
      }
    };

    tick();
    const id = setInterval(tick, 20000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
