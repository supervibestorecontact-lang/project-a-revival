// Local prayer-time calculation (no network). Standard astronomical algorithm.
// Defaults follow Diyanet angles: Fajr 18°, Isha 17°.

export type PrayerKey = "imsak" | "gunes" | "ogle" | "ikindi" | "aksam" | "yatsi";

export const PRAYER_LABELS: Record<PrayerKey, string> = {
  imsak: "İmsak",
  gunes: "Güneş",
  ogle: "Öğle",
  ikindi: "İkindi",
  aksam: "Akşam",
  yatsi: "Yatsı",
};

const DEG = Math.PI / 180;
const sin = (d: number) => Math.sin(d * DEG);
const cos = (d: number) => Math.cos(d * DEG);
const tan = (d: number) => Math.tan(d * DEG);
const asin = (x: number) => Math.asin(x) / DEG;
const acos = (x: number) => Math.acos(x) / DEG;
const atan2 = (y: number, x: number) => Math.atan2(y, x) / DEG;
const acot = (x: number) => Math.atan(1 / x) / DEG;
const fix = (a: number, b: number) => {
  const v = a - b * Math.floor(a / b);
  return v < 0 ? v + b : v;
};

function julianDate(date: Date) {
  let y = date.getFullYear();
  let m = date.getMonth() + 1;
  const d = date.getDate();
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5
  );
}

function sunPosition(jd: number) {
  const d = jd - 2451545.0;
  const g = fix(357.529 + 0.98560028 * d, 360);
  const q = fix(280.459 + 0.98564736 * d, 360);
  const L = fix(q + 1.915 * sin(g) + 0.02 * sin(2 * g), 360);
  const e = 23.439 - 0.00000036 * d;
  const decl = asin(sin(e) * sin(L));
  const ra = fix(atan2(cos(e) * sin(L), cos(L)) / 15, 24);
  const eqt = q / 15 - ra;
  return { decl, eqt };
}

/** Returns times as minutes from local midnight. */
export function computePrayerTimes(
  date: Date,
  lat: number,
  lng: number,
  opts: { fajrAngle?: number; ishaAngle?: number; asrFactor?: number } = {},
): Record<PrayerKey, number> {
  const fajrAngle = opts.fajrAngle ?? 18;
  const ishaAngle = opts.ishaAngle ?? 17;
  const asrFactor = opts.asrFactor ?? 1;

  const tzOffset = -date.getTimezoneOffset() / 60;
  const jd = julianDate(date) - lng / (15 * 24);
  const { decl, eqt } = sunPosition(jd);

  const dhuhr = 12 + tzOffset - lng / 15 - eqt;

  const hourAngle = (angle: number) => {
    const x =
      (-sin(angle) - sin(lat) * sin(decl)) / (cos(lat) * cos(decl));
    if (x > 1 || x < -1) return NaN;
    return acos(x) / 15;
  };

  const sunriseAngle = 0.833;
  const hSunrise = hourAngle(sunriseAngle);
  const hFajr = hourAngle(fajrAngle);
  const hIsha = hourAngle(ishaAngle);

  const asrAngle = -acot(asrFactor + tan(Math.abs(lat - decl)));
  const hAsr = hourAngle(asrAngle);

  const toMin = (h: number) => (Number.isNaN(h) ? NaN : fix(h, 24) * 60);

  return {
    imsak: toMin(dhuhr - hFajr),
    gunes: toMin(dhuhr - hSunrise),
    ogle: toMin(dhuhr),
    ikindi: toMin(dhuhr + hAsr),
    aksam: toMin(dhuhr + hSunrise),
    yatsi: toMin(dhuhr + hIsha),
  };
}

export function formatMinutes(m: number) {
  if (Number.isNaN(m)) return "--:--";
  const total = Math.round(m);
  const h = Math.floor(total / 60) % 24;
  const min = total % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export const PRAYER_ORDER: PrayerKey[] = [
  "imsak",
  "gunes",
  "ogle",
  "ikindi",
  "aksam",
  "yatsi",
];
