import { createFileRoute } from "@tanstack/react-router";
import { Compass, LocateFixed, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell, ScreenHeader } from "@/components/app-shell";

export const Route = createFileRoute("/kible")({
  head: () => ({
    meta: [
      { title: "Kıble Pusulası — Kâbe Yönünü Bul" },
      {
        name: "description",
        content:
          "Konum ve cihaz sensörleriyle Kâbe yönünü gösteren zümrüt-altın pusula; kıbleye yöneldiğinizde anında bildirir.",
      },
      { property: "og:title", content: "Kıble Pusulası" },
      {
        property: "og:description",
        content: "Bulunduğunuz yerden Kâbe'ye olan yönü ve mesafeyi öğrenin.",
      },
    ],
  }),
  component: QiblaPage,
});

const KAABA = { lat: 21.4224779, lng: 39.8251832 };
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

function qiblaBearing(lat: number, lng: number) {
  const dLng = toRad(KAABA.lng - lng);
  const y = Math.sin(dLng) * Math.cos(toRad(KAABA.lat));
  const x =
    Math.cos(toRad(lat)) * Math.sin(toRad(KAABA.lat)) -
    Math.sin(toRad(lat)) * Math.cos(toRad(KAABA.lat)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function distanceKm(lat: number, lng: number) {
  const R = 6371;
  const dLat = toRad(KAABA.lat - lat);
  const dLng = toRad(KAABA.lng - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(KAABA.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function QiblaPage() {
  const [heading, setHeading] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sensorOn, setSensorOn] = useState(false);

  const bearing = coords ? qiblaBearing(coords.lat, coords.lng) : null;
  const relative = bearing !== null && heading !== null ? (bearing - heading + 360) % 360 : bearing;
  const aligned =
    relative !== null && (relative < 8 || relative > 352) && heading !== null;

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Cihazınız konum servisini desteklemiyor.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setError(null);
      },
      () => setError("Konum izni verilmedi. Kıble yönü için konuma ihtiyaç var."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const enableSensors = useCallback(async () => {
    const AnyEvent = window.DeviceOrientationEvent as any;
    try {
      if (AnyEvent && typeof AnyEvent.requestPermission === "function") {
        const res = await AnyEvent.requestPermission();
        if (res !== "granted") {
          setError("Pusula sensörü izni reddedildi.");
          return;
        }
      }
      setSensorOn(true);
    } catch {
      setError("Pusula sensörü başlatılamadı.");
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (!sensorOn) return;
    const handler = (e: DeviceOrientationEvent) => {
      const webkit = (e as any).webkitCompassHeading;
      if (typeof webkit === "number") {
        setHeading(webkit);
      } else if (typeof e.alpha === "number") {
        setHeading((360 - e.alpha) % 360);
      }
    };
    window.addEventListener("deviceorientationabsolute", handler as EventListener, true);
    window.addEventListener("deviceorientation", handler as EventListener, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handler as EventListener, true);
      window.removeEventListener("deviceorientation", handler as EventListener, true);
    };
  }, [sensorOn]);

  return (
    <AppShell>
      <ScreenHeader title="Kıble Pusulası" subtitle="Kâbe yönünü bulun" />

      <div className="relative mx-auto mb-6 aspect-square w-full max-w-[340px]">
        <div className="bg-gold-ring absolute inset-0 rounded-full p-[3px] opacity-90">
          <div className="bg-emerald-gradient h-full w-full rounded-full" />
        </div>
        <div
          className="absolute inset-[14px] rounded-full border border-gold/40 bg-[oklch(0.22_0.04_160)] transition-transform duration-200"
          style={{ transform: `rotate(${heading !== null ? -heading : 0}deg)` }}
        >
          <span className="absolute left-1/2 top-2 -translate-x-1/2 text-xs font-semibold text-gold">
            K
          </span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-paper/70">
            D
          </span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-semibold text-paper/70">
            G
          </span>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-paper/70">
            B
          </span>
          {Array.from({ length: 72 }, (_, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-0 h-full w-px"
              style={{ transform: `rotate(${i * 5}deg)` }}
            >
              <span
                className={
                  i % 6 === 0
                    ? "block h-3 w-px bg-gold/70"
                    : "block h-1.5 w-px bg-paper/25"
                }
              />
            </span>
          ))}
        </div>

        {/* Qibla needle */}
        <div
          className="absolute inset-[14px] transition-transform duration-300"
          style={{ transform: `rotate(${relative ?? 0}deg)` }}
        >
          <div className="absolute left-1/2 top-6 flex -translate-x-1/2 flex-col items-center">
            <span
              className={
                aligned
                  ? "flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-gold-foreground shadow-soft"
                  : "flex h-11 w-11 items-center justify-center rounded-xl bg-paper text-ink shadow-soft"
              }
            >
              <span className="relative block h-5 w-5 rounded-[3px] bg-ink">
                <span className="absolute inset-x-0 top-1.5 h-[3px] bg-gold" />
              </span>
            </span>
            <span className="mt-1 h-24 w-[3px] rounded-full bg-gradient-to-b from-gold to-transparent" />
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold bg-background" />
      </div>

      <div
        className={
          aligned
            ? "bg-emerald-gradient mb-4 rounded-3xl px-5 py-4 text-center text-primary-foreground shadow-soft"
            : "mb-4 rounded-3xl border border-border bg-card px-5 py-4 text-center shadow-soft"
        }
      >
        <p className="font-display text-lg">
          {aligned ? "Kıbleye Yöneldiniz" : "Cihazı yavaşça çevirin"}
        </p>
        <p className="mt-1 text-xs opacity-80">
          {bearing !== null
            ? `Kıble açısı ${Math.round(bearing)}° · Kâbe'ye ${distanceKm(coords!.lat, coords!.lng).toLocaleString("tr-TR")} km`
            : "Konum bekleniyor…"}
        </p>
      </div>

      <div className="space-y-2">
        {!sensorOn ? (
          <button
            onClick={enableSensors}
            className="bg-emerald-gradient flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-primary-foreground"
          >
            <Compass className="h-4 w-4" /> Pusulayı Başlat
          </button>
        ) : null}
        <button
          onClick={requestLocation}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold"
        >
          <LocateFixed className="h-4 w-4 text-primary" /> Konumu Yenile
        </button>
      </div>

      {error ? (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-xs text-secondary-foreground">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      ) : null}

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        En doğru sonuç için cihazı düz tutun ve manyetik alanlardan uzak durun.
      </p>
    </AppShell>
  );
}
