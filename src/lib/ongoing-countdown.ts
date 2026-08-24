/**
 * Kilit ekranında "sonraki namaza kalan süre" bildirimi.
 * Tek bir bildirim etiketi (tag) kullanılır; her güncellemede yenisi açılmaz,
 * mevcut bildirim sessizce (silent, titreşimsiz) değiştirilir — pil ve performans dostu.
 */
const TAG = "namaz-kalan-sure";
const SYNC_TAG = "namaz-countdown";

export type OngoingPayload = {
  /** Sonraki vaktin adı, örn. "Öğle" */
  label: string;
  /** Sonraki vaktin saati, örn. "13:12" */
  at: string;
  /** Sonraki vaktin epoch ms değeri — servis çalışanı bunu kullanarak kendi hesaplar */
  ts: number;
  place?: string | undefined;
  /** Sonraki 24 saatin vakitleri: [{label, ts}] */
  upcoming?: { label: string; ts: number }[];
};

export function shortLeft(ms: number) {
  const total = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return `${h} sa ${m} dk`;
  return `${m} dk`;
}

async function registration() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return (await navigator.serviceWorker.getRegistration()) ?? null;
  } catch {
    return null;
  }
}

/** Bildirimi oluşturur/günceller. Aynı metin ise hiçbir şey yapmaz. */
let lastBody = "";

export async function updateOngoingCountdown(p: OngoingPayload) {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  const body = `${p.label} · ${p.at} — ${shortLeft(p.ts - Date.now())} kaldı`;
  if (body === lastBody) return true;
  lastBody = body;

  const options: NotificationOptions & { renotify?: boolean } = {
    body: p.place ? `${body}\n${p.place}` : body,
    tag: TAG,
    renotify: false,
    silent: true,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  };

  const reg = await registration();
  if (!reg) return false;
  try {
    await reg.showNotification("Sonraki namaz", options);
    // Servis çalışanı uygulama kapalıyken de güncelleyebilsin diye planı iletelim.
    reg.active?.postMessage({ type: "namaz-schedule", payload: p });
    void enablePeriodicSync(reg);
    return true;
  } catch {
    return false;
  }
}

export async function clearOngoingCountdown() {
  lastBody = "";
  const reg = await registration();
  if (!reg) return;
  try {
    const list = await reg.getNotifications({ tag: TAG });
    list.forEach((n) => n.close());
    reg.active?.postMessage({ type: "namaz-schedule-clear" });
    const anyReg = reg as unknown as { periodicSync?: { unregister: (t: string) => Promise<void> } };
    await anyReg.periodicSync?.unregister(SYNC_TAG).catch(() => undefined);
  } catch {
    /* yoksay */
  }
}

async function enablePeriodicSync(reg: ServiceWorkerRegistration) {
  const anyReg = reg as unknown as {
    periodicSync?: { register: (t: string, o: { minInterval: number }) => Promise<void> };
  };
  if (!anyReg.periodicSync) return;
  try {
    await anyReg.periodicSync.register(SYNC_TAG, { minInterval: 15 * 60 * 1000 });
  } catch {
    /* izin verilmemiş olabilir */
  }
}
