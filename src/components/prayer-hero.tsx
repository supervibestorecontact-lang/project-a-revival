import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  CloudSun,
  MapPin,
  MoonStar,
  Sun,
  SunMedium,
  Sunrise,
  Sunset,
  type LucideIcon,
} from "lucide-react";
import heroSunriseSea from "@/assets/hero-sunrise-sea.jpg";
import heroSunsetIstanbul from "@/assets/hero-sunset-istanbul.jpg";
import heroNightIstanbul from "@/assets/hero-night-istanbul.jpg";
import {
  formatMinutes,
  PRAYER_LABELS,
  PRAYER_ORDER,
  shortRemaining,
  usePrayerClock,
} from "@/lib/prayer-clock";
import type { PrayerKey } from "@/lib/prayer-times";
import { cn } from "@/lib/utils";

const PRAYER_ICONS: Record<PrayerKey, LucideIcon> = {
  imsak: Sunrise,
  gunes: Sun,
  ogle: SunMedium,
  ikindi: CloudSun,
  aksam: Sunset,
  yatsi: MoonStar,
};

/** Arka planı bulunduğu vakte göre seçer:
 *  imsak/güneş → denizde güneş doğuşu
 *  öğle/ikindi → İstanbul'da gün batımı
 *  akşam/yatsı → İstanbul'da gece
 */
function heroBgFor(activeKey: PrayerKey | null): string {
  switch (activeKey) {
    case "imsak":
    case "gunes":
      return heroSunriseSea;
    case "ogle":
    case "ikindi":
      return heroSunsetIstanbul;
    case "aksam":
    case "yatsi":
    default:
      return heroNightIstanbul;
  }
}

export function PrayerHero({ showAllLink = true }: { showAllLink?: boolean }) {
  const clock = usePrayerClock();
  const { times, nextKey, activeKey, remaining, remainingLabel, progress, ready, now } = clock;

  const hijriDate = now
    ? new Intl.DateTimeFormat("tr-TR-u-ca-islamic", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now)
    : "";
  const gregDate = now
    ? now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const localTime = now
    ? now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <section className="animate-rise relative mb-4 overflow-hidden rounded-[28px] border border-border/50 shadow-soft">
      {/* Full-bleed photographic background with dark overlay for text readability */}
      <div className="absolute inset-0">
        <img
          src={heroBgFor(activeKey)}
          alt=""
          className="h-full w-full object-cover transition-opacity duration-700"
          width={1024}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
      </div>

      <div className="relative px-5 pb-4 pt-4 text-white">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-medium backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5" />
            {clock.place ?? (clock.located ? "Konumunuz" : "İstanbul")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/25 px-3 py-1 opacity-90 backdrop-blur-sm">
            Şu an: <b className="font-semibold text-gold">{activeKey ? PRAYER_LABELS[activeKey] : "—"}</b> vakti
          </span>
        </div>

        <p className="mt-5 text-center text-[11px] uppercase tracking-[0.28em] text-white/75">
          {nextKey ? PRAYER_LABELS[nextKey] : "İmsak"} vaktine kalan
        </p>
        <p className="mt-2 text-center font-sans text-[54px] font-light leading-none tabular-nums tracking-[0.04em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
          {ready ? remainingLabel : "--:--:--"}
        </p>
        <p className="mt-2.5 text-center text-sm font-medium text-white/90">
          {ready
            ? `${nextKey ? PRAYER_LABELS[nextKey] : "İmsak"} ${formatMinutes(times[nextKey ?? "imsak"])} · ${shortRemaining(remaining)} kaldı`
            : "Vakitler hesaplanıyor…"}
        </p>

        <div className="mt-3.5 h-1 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-gold transition-all duration-1000"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x divide-white/15 text-center">
          <div className="px-2">
            <p className="text-[10px] text-white/55">Hicri</p>
            <p className="mt-0.5 text-[11px] font-medium leading-tight">{hijriDate}</p>
          </div>
          <div className="px-2">
            <p className="text-[10px] text-white/55">Tarih</p>
            <p className="mt-0.5 text-[11px] font-medium leading-tight">{gregDate}</p>
          </div>
          <div className="px-2">
            <p className="text-[10px] text-white/55">Yerel saat</p>
            <p className="mt-0.5 text-[11px] font-medium tabular-nums leading-tight">{localTime}</p>
          </div>
        </div>
      </div>

      {/* Prayer ribbon with icons */}
      <div className="relative grid grid-cols-6 divide-x divide-white/10 bg-black/35 backdrop-blur-sm">
        {PRAYER_ORDER.map((key) => {
          const isNext = key === nextKey;
          const isActive = key === activeKey;
          const Icon = PRAYER_ICONS[key];
          return (
            <div
              key={key}
              className={cn(
                "flex flex-col items-center gap-1 px-0.5 py-2.5 text-center transition-colors",
                isNext && "bg-gold/15",
              )}
            >
              <Icon
                className={cn("h-[18px] w-[18px]", isNext ? "text-gold" : isActive ? "text-white" : "text-white/45")}
                strokeWidth={isNext ? 2.3 : 1.7}
              />
              <p
                className={cn(
                  "text-[10px] font-medium leading-none",
                  isNext ? "text-gold" : "text-white/55",
                )}
              >
                {PRAYER_LABELS[key]}
              </p>
              <p
                className={cn(
                  "text-[12px] font-semibold tabular-nums leading-none",
                  isNext ? "text-white" : "text-white/80",
                )}
              >
                {ready ? formatMinutes(times[key]) : "--:--"}
              </p>
            </div>
          );
        })}
      </div>

      {showAllLink ? (
        <Link
          to="/vakit"
          className="relative flex items-center justify-center gap-1.5 border-t border-white/10 bg-black/35 py-2.5 text-xs font-semibold text-gold backdrop-blur-sm"
        >
          Tüm vakitler ve ezan hatırlatmaları <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </section>
  );
}
