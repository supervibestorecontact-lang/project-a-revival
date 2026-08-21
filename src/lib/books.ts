
export type BookMode = "arabic" | "turkish" | "latin";

export type BookVolume = {
  url: string;
  pages: number;
};

export type BookEdition = {
  id: BookMode;
  label: string;
  short: string;
  hint: string;
  rtl: boolean;
  volumes: BookVolume[];
  totalPages: number;
};

function edition(
  id: BookMode,
  label: string,
  short: string,
  hint: string,
  rtl: boolean,
  volumes: BookVolume[],
): BookEdition {
  return {
    id,
    label,
    short,
    hint,
    rtl,
    volumes,
    totalPages: volumes.reduce((sum, v) => sum + v.pages, 0),
  };
}

export const EDITIONS: Record<BookMode, BookEdition> = {
  arabic: edition("arabic", "Arapça Aslı", "عربي", "Orijinal metin", true, [
    { url: "/books/delail_arabic_1.pdf", pages: 48 },
    { url: "/books/delail_arabic_2.pdf", pages: 46 },
    { url: "/books/delail_arabic_3.pdf", pages: 46 },
    { url: "/books/delail_arabic_4.pdf", pages: 40 },
    { url: "/books/delail_arabic_5.pdf", pages: 40 },
  ]),
  turkish: edition("turkish", "Türkçe Meali", "TR", "Anlamıyla oku", false, [
    { url: "/books/delail_turkish.pdf", pages: 129 },
  ]),
  latin: edition("latin", "Latince", "Latince", "Latin harfleriyle", false, [
    { url: "/books/delail_latin.pdf", pages: 119 },
  ]),
};

export const EDITION_LIST = [EDITIONS.latin, EDITIONS.arabic, EDITIONS.turkish];

/** Maps a global page index (0-based) to the source PDF + its local page number. */
export function locatePage(edition: BookEdition, index: number) {
  let remaining = Math.max(0, Math.min(index, edition.totalPages - 1));
  const volumes = edition.volumes;
  for (let v = 0; v < volumes.length; v++) {
    const volume = volumes[v]!;
    if (remaining < volume.pages) {
      return { volumeIndex: v, url: volume.url, pageNumber: remaining + 1 };
    }
    remaining -= volume.pages;
  }
  const last = volumes[volumes.length - 1]!;
  return { volumeIndex: volumes.length - 1, url: last.url, pageNumber: last.pages };
}

/** Keeps the reading position proportional when switching editions. */
export function mapProgress(from: BookEdition, to: BookEdition, index: number) {
  if (from.id === to.id) return index;
  const ratio = from.totalPages > 1 ? index / (from.totalPages - 1) : 0;
  return Math.round(ratio * (to.totalPages - 1));
}

export const HIZB_COUNT = 8;

/** The classic 8 ahzâb of Delâilü'l-Hayrât, distributed over the Arabic edition. */
export const WEEK_PLAN = [
  { day: "Pzt", name: "1. Hizb", note: "Pazartesi virdi" },
  { day: "Sal", name: "2. Hizb", note: "Salı virdi" },
  { day: "Çar", name: "3. Hizb", note: "Çarşamba virdi" },
  { day: "Per", name: "4. Hizb", note: "Perşembe virdi" },
  { day: "Cum", name: "5. Hizb", note: "Cuma virdi" },
  { day: "Cmt", name: "6. Hizb", note: "Cumartesi virdi" },
  { day: "Paz", name: "7. Hizb", note: "Pazar virdi" },
  { day: "Hatim", name: "8. Hizb", note: "Hatim duası" },
];

export function hizbStartIndex(edition: BookEdition, hizb: number) {
  const usable = edition.totalPages;
  return Math.round(((hizb - 1) / HIZB_COUNT) * usable);
}

export function todayHizb(date = new Date()) {
  // JS: 0 = Sunday. Monday -> hizb 1 ... Sunday -> hizb 7
  const d = date.getDay();
  return d === 0 ? 7 : d;
}
