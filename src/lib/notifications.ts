const FIRED_KEY = "delail-fired-alarms";

export type NotifyState = "unsupported" | "default" | "granted" | "denied";

export function notifyState(): NotifyState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as NotifyState;
}

export async function requestNotifyPermission(): Promise<NotifyState> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  try {
    return (await Notification.requestPermission()) as NotifyState;
  } catch {
    return Notification.permission as NotifyState;
  }
}

/** Servis çalışanı varsa onun üzerinden gönderir; uygulama arka plandayken de görünür. */
export async function showNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;
  const options: NotificationOptions = {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: title,
  };
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, options);
        return true;
      }
    }
    new Notification(title, options);
    return true;
  } catch {
    try {
      new Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }
}

export async function sendTestNotification() {
  const state = notifyState();
  if (state === "unsupported") return { ok: false, message: "Bu cihaz bildirimleri desteklemiyor." };
  if (state !== "granted") {
    const res = await requestNotifyPermission();
    if (res !== "granted") {
      return {
        ok: false,
        message:
          "Bildirim izni kapalı. Telefon ayarları → Uygulamalar → Tarayıcı/Uygulama → Bildirimler bölümünden izin verin.",
      };
    }
  }
  const ok = await showNotification(
    "Bildirim testi başarılı ✅",
    "Namaz hatırlatmaları bu şekilde görünecek.",
  );
  if (ok && typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([80, 50, 80]);
  return ok
    ? { ok: true, message: "Test bildirimi gönderildi. Bildirimi görmediyseniz sistem ayarlarını kontrol edin." }
    : { ok: false, message: "Bildirim gönderilemedi. Sistem ayarlarından bildirimlere izin verin." };
}

/** Aynı hatırlatmanın tekrar tetiklenmemesi için gün bazlı kayıt (cihaz yeniden başlasa da korunur). */
export function loadFired(): string[] {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markFired(id: string) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const next = [...loadFired().filter((x) => x.startsWith(today)), id];
    localStorage.setItem(FIRED_KEY, JSON.stringify(Array.from(new Set(next))));
  } catch {
    /* yoksay */
  }
}
