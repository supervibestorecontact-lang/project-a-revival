import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computePrayerTimes,
  formatMinutes,
  PRAYER_LABELS,
  PRAYER_ORDER,
  type PrayerKey,
} from "@/lib/prayer-times";

export type Coords = { lat: number; lng: number };

export const DEFAULT_COORDS: Coords = { lat: 41.0082, lng: 28.9784 };
const COORDS_KEY = "delail-coords";
const PLACE_KEY = "delail-place";

/** Son bilinen konum — uygulama açılır açılmaz (offline dahi) vakit gösterebilmek için. */
export function loadCachedCoords(): Coords | null {
  try {
    const raw = localStorage.getItem(COORDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Coords>;
    if (typeof parsed.lat !== "number" || typeof parsed.lng !== "number") return null;
    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
}

export function saveCoords(c: Coords) {
  try {
    localStorage.setItem(COORDS_KEY, JSON.stringify(c));
  } catch {
    /* storage kapalı olabilir */
  }
}

export function loadCachedPlace(): string | null {
  try {
    return localStorage.getItem(PLACE_KEY);
  } catch {
    return null;
  }
}

function savePlace(name: string) {
  try {
    localStorage.setItem(PLACE_KEY, name);
  } catch {
    /* yoksay */
  }
}

export function remainingLabelFromMinutes(remaining: number) {
  const total = Math.max(0, Math.floor(remaining * 60));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function shortRemaining(remaining: number) {
  const mins = Math.max(0, Math.round(remaining));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h} sa ${m} dk`;
  return `${m} dk`;
}

export type PrayerClock = {
  ready: boolean;
  now: Date | null;
  coords: Coords;
  located: boolean;
  place: string | null;
  error: string | null;
  times: Record<PrayerKey, number>;
  nextKey: PrayerKey | null;
  activeKey: PrayerKey | null;
  remaining: number;
  remainingLabel: string;
  progress: number;
  requestLocation: () => void;
};

/**
 * Namaz vakti çekirdeği: konumu önbellekten anında okur, sonra GPS ile günceller.
 * Hem ana ekran hem de vakit ekranı bunu kullanır.
 */
export function usePrayerClock(): PrayerClock {
  const [coords, setCoords] = useState<Coords>(DEFAULT_COORDS);
  const [located, setLocated] = useState(false);
  const [place, setPlace] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const geocoded = useRef<string>("");

  useEffect(() => {
    const cached = loadCachedCoords();
    if (cached) {
      setCoords(cached);
      setLocated(true);
    }
    const cachedPlace = loadCachedPlace();
    if (cachedPlace) setPlace(cachedPlace);
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Cihazınız konum servisini desteklemiyor. Son bilinen konum kullanılıyor.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(next);
        saveCoords(next);
        setLocated(true);
        setError(null);
      },
      () =>
        setError(
          loadCachedCoords()
            ? "Konum güncellenemedi, son bilinen konum kullanılıyor."
            : "Konum izni verilmedi. İstanbul vakitleri gösteriliyor.",
        ),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Yer adı: sadece konum değiştiğinde ve ağ varsa sorgulanır, sonucu önbelleğe alınır.
  useEffect(() => {
    const key = `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`;
    if (geocoded.current === key) return;
    geocoded.current = key;
    let cancelled = false;
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
        if (parts.length) {
          setPlace(parts.join(" · "));
          savePlace(parts.join(" · "));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lng]);

  const dayStamp = now ? now.toDateString() : "";
  const times = useMemo(
    () => computePrayerTimes(now ?? new Date(), coords.lat, coords.lng),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayStamp, coords.lat, coords.lng],
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

  const remaining = now ? (nextKey ? times[nextKey] - nowMin : times.imsak + 24 * 60 - nowMin) : 0;

  const progress = (() => {
    if (!now || !activeKey) return 0;
    const start = times[activeKey] <= nowMin ? times[activeKey] : times[activeKey] - 24 * 60;
    const end = nextKey ? times[nextKey] : times.imsak + 24 * 60;
    const span = end - start;
    return span > 0 ? Math.min(1, Math.max(0, (nowMin - start) / span)) : 0;
  })();

  return {
    ready: now !== null,
    now,
    coords,
    located,
    place,
    error,
    times,
    nextKey,
    activeKey,
    remaining,
    remainingLabel: remainingLabelFromMinutes(remaining),
    progress,
    requestLocation,
  };
}

export { formatMinutes, PRAYER_LABELS, PRAYER_ORDER };
export type { PrayerKey };
