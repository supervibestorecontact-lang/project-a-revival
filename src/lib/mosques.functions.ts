import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius: z.number().min(200).max(20000).default(3000),
});

export type Mosque = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number | undefined;
  openNow?: boolean | undefined;
  distanceKm: number;
};

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const findNearbyMosques = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<Mosque[]> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableKey || !mapsKey) {
      throw new Error("Harita servisi yapılandırılmamış.");
    }

    const response = await fetch(
      "https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": mapsKey,
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.currentOpeningHours.openNow",
        },
        body: JSON.stringify({
          includedTypes: ["mosque"],
          maxResultCount: 20,
          languageCode: "tr",
          locationRestriction: {
            circle: {
              center: { latitude: data.lat, longitude: data.lng },
              radius: data.radius,
            },
          },
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`Places nearby failed [${response.status}]: ${body}`);
      throw new Error(`Camiler alınamadı (${response.status}).`);
    }

    const json = (await response.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude: number; longitude: number };
        rating?: number;
        currentOpeningHours?: { openNow?: boolean };
      }>;
    };

    return (json.places ?? [])
      .filter((p) => p.location)
      .map((p) => ({
        id: p.id,
        name: p.displayName?.text ?? "Cami",
        address: p.formattedAddress ?? "",
        lat: p.location!.latitude,
        lng: p.location!.longitude,
        rating: p.rating,
        openNow: p.currentOpeningHours?.openNow,
        distanceKm: haversineKm(
          data.lat,
          data.lng,
          p.location!.latitude,
          p.location!.longitude,
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  });
