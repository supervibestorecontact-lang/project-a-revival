/**
 * Çevrimdışı destek: servis çalışanı yalnızca yayınlanmış üretim sitesinde kaydedilir.
 * Lovable önizlemesi, iframe ve geliştirme ortamında kayıt yapılmaz; varsa temizlenir.
 */
const BLOCKED_HOSTS = [
  "lovableproject.com",
  "lovableproject-dev.com",
  "beta.lovable.dev",
];

function refuses() {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  if (window.top !== window.self) return true;
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (BLOCKED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return true;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;
  return false;
}

async function unregisterAppSw() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").includes("/sw.js"))
      .map((r) => r.unregister()),
  );
}

export function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (refuses()) {
    void unregisterAppSw();
    return;
  }
  void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
}
