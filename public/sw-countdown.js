/* Kilit ekranı geri sayım bildirimi — servis çalışanı tarafı.
   Uygulama kapalıyken de tek bildirimi güncel tutar. Hesaplama yok, sadece
   uygulamanın gönderdiği vakit listesinden kalan süreyi biçimlendirir. */
(() => {
  const TAG = "namaz-kalan-sure";
  const STORE = "namaz-countdown-store";
  const KEY = "/__namaz_schedule__";

  async function saveSchedule(payload) {
    const cache = await caches.open(STORE);
    await cache.put(KEY, new Response(JSON.stringify(payload)));
  }

  async function loadSchedule() {
    try {
      const cache = await caches.open(STORE);
      const res = await cache.match(KEY);
      return res ? await res.json() : null;
    } catch {
      return null;
    }
  }

  async function clearSchedule() {
    try {
      const cache = await caches.open(STORE);
      await cache.delete(KEY);
      const list = await self.registration.getNotifications({ tag: TAG });
      list.forEach((n) => n.close());
    } catch {
      /* yoksay */
    }
  }

  function shortLeft(ms) {
    const total = Math.max(0, Math.round(ms / 60000));
    const h = Math.floor(total / 60);
    const m = total % 60;
    return h > 0 ? `${h} sa ${m} dk` : `${m} dk`;
  }

  function pickNext(payload, now) {
    const list = Array.isArray(payload.upcoming) ? payload.upcoming : [];
    const next = list.filter((x) => x.ts > now).sort((a, b) => a.ts - b.ts)[0];
    if (next) return next;
    if (payload.ts > now) return { label: payload.label, ts: payload.ts };
    return null;
  }

  async function refresh() {
    if (Notification.permission !== "granted") return;
    const payload = await loadSchedule();
    if (!payload) return;
    const now = Date.now();
    const next = pickNext(payload, now);
    if (!next) return;
    const at = new Date(next.ts).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const body = `${next.label} · ${at} — ${shortLeft(next.ts - now)} kaldı`;
    await self.registration.showNotification("Sonraki namaz", {
      body: payload.place ? `${body}\n${payload.place}` : body,
      tag: TAG,
      renotify: false,
      silent: true,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    });
  }

  self.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "namaz-schedule") event.waitUntil(saveSchedule(data.payload));
    if (data.type === "namaz-schedule-clear") event.waitUntil(clearSchedule());
  });

  self.addEventListener("periodicsync", (event) => {
    if (event.tag === "namaz-countdown") event.waitUntil(refresh());
  });

  self.addEventListener("notificationclick", (event) => {
    if (event.notification.tag !== TAG) return;
    event.notification.close();
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
        const c = cs[0];
        if (c) return c.focus();
        return self.clients.openWindow("/");
      }),
    );
  });
})();
