import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LocateFixed, Loader2, MapPin, Navigation, Star } from "lucide-react";

import { AppShell, ScreenHeader } from "@/components/app-shell";
import {
  DEFAULT_COORDS,
  loadCachedCoords,
  saveCoords,
  type Coords,
} from "@/lib/prayer-clock";
import { findNearbyMosques } from "@/lib/mosques.functions";

export const Route = createFileRoute("/camiler")({
  head: () => ({
    meta: [
      { title: "En Yakın Camiler — Konumunuza Göre Cami Bul" },
      {
        name: "description",
        content:
          "Bulunduğunuz konuma en yakın camileri mesafeleriyle birlikte listeleyin ve tek dokunuşla Google Haritalar üzerinden yol tarifi alın.",
      },
      { property: "og:title", content: "En Yakın Camiler" },
      {
        property: "og:description",
        content: "Yakınınızdaki camileri bulun ve yol tarifi alın.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MosquesPage,
});

const RADIUS_OPTIONS = [1000, 3000, 5000, 10000];

function MosquesPage() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [radius, setRadius] = useState(3000);
  const [locating, setLocating] = useState(false);

  const askLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Cihazınız konum servisini desteklemiyor.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        saveCoords(next);
        setCoords(next);
        setGeoError(null);
        setLocating(false);
      },
      () => {
        setGeoError(
          "Konum izni alınamadı. Tarayıcı ayarlarından konuma izin verin; şimdilik kayıtlı konum kullanılıyor.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  useEffect(() => {
    setCoords(loadCachedCoords() ?? DEFAULT_COORDS);
    askLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMosques = useServerFn(findNearbyMosques);
  const { data, isFetching, error } = useQuery({
    queryKey: ["mosques", coords?.lat.toFixed(3), coords?.lng.toFixed(3), radius],
    enabled: !!coords,
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchMosques({ data: { ...coords!, radius } }),
  });

  return (
    <AppShell>
      <ScreenHeader
        title="En Yakın Camiler"
        subtitle="Konumunuza göre camiler ve yol tarifi"
        right={
          <button
            onClick={askLocation}
            aria-label="Konumu yenile"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
          >
            {locating ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : (
              <LocateFixed className="h-[18px] w-[18px]" />
            )}
          </button>
        }
      />

      <div className="mb-4 flex gap-2">
        {RADIUS_OPTIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRadius(r)}
            className={`flex-1 rounded-2xl border px-2 py-2 text-xs font-medium transition-colors ${
              radius === r
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {r / 1000} km
          </button>
        ))}
      </div>

      {geoError ? (
        <p className="mb-3 rounded-2xl border border-border bg-card p-3 text-xs text-muted-foreground">
          {geoError}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-destructive/40 bg-card p-3 text-xs text-destructive">
          {(error as Error).message}
        </p>
      ) : null}

      {isFetching && !data ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Camiler aranıyor…
        </div>
      ) : null}

      {data && data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Bu yarıçapta cami bulunamadı. Mesafeyi artırmayı deneyin.
        </p>
      ) : null}

      <ul className="space-y-3">
        {(data ?? []).map((m) => (
          <li
            key={m.id}
            className="rounded-3xl border border-border bg-card p-3.5 shadow-soft"
          >
            <div className="flex items-start gap-3">
              <span className="bg-emerald-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-primary-foreground">
                <MapPin className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-card-foreground">
                  {m.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">{m.address}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium text-primary">
                    {m.distanceKm < 1
                      ? `${Math.round(m.distanceKm * 1000)} m`
                      : `${m.distanceKm.toFixed(1)} km`}
                  </span>
                  {typeof m.rating === "number" ? (
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-gold" /> {m.rating.toFixed(1)}
                    </span>
                  ) : null}
                  {typeof m.openNow === "boolean" ? (
                    <span>{m.openNow ? "Açık" : "Kapalı"}</span>
                  ) : null}
                </div>
              </div>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}&destination_place_id=${m.id}&travelmode=walking`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-gradient mt-3 flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <Navigation className="h-4 w-4" /> Yol tarifi al
            </a>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
