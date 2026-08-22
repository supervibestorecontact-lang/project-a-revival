import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { BookMode } from "@/lib/books";

export type Bookmark = {
  mode: BookMode;
  index: number;
  label: string;
  createdAt: number;
};

export type DhikrPreset = {
  id: string;
  title: string;
  arabic: string;
  translit: string;
  target: number;
  custom?: boolean;
};

export type DhikrLog = {
  id: string;
  presetId: string;
  title: string;
  count: number;
  date: string;
};

export type Prayer = {
  id: string;
  author: string;
  initials: string;
  text: string;
  category: "gunun" | "acil" | "sukur";
  amin: number;
  createdAt: number;
  mine?: boolean;
};

export const DEFAULT_PRESETS: DhikrPreset[] = [
  {
    id: "salavat-serife",
    title: "Salât-ı Şerîfe",
    arabic: "اَللّٰهُمَّ صَلِّ عَلٰى سَيِّدِنَا مُحَمَّدٍ",
    translit: "Allâhümme salli alâ seyyidinâ Muhammed",
    target: 100,
  },
  {
    id: "salavat-fatih",
    title: "Salât-ı Fâtih",
    arabic: "اَللّٰهُمَّ صَلِّ عَلٰى مُحَمَّدٍ الْفَاتِحِ",
    translit: "Allâhümme salli alâ Muhammedinil Fâtihi limâ uğlik",
    target: 33,
  },
  {
    id: "salavat-munciye",
    title: "Salât-ı Münciye",
    arabic: "اَللّٰهُمَّ صَلِّ صَلَاةً كَامِلَةً",
    translit: "Allâhümme salli salâten kâmileten",
    target: 41,
  },
  {
    id: "istigfar",
    title: "İstiğfâr",
    arabic: "أَسْتَغْفِرُ اللّٰهَ",
    translit: "Estağfirullâh",
    target: 100,
  },
  {
    id: "tevhid",
    title: "Tevhîd",
    arabic: "لَا إِلٰهَ إِلَّا اللّٰهُ",
    translit: "Lâ ilâhe illallâh",
    target: 100,
  },
];


type State = {
  mode: BookMode;
  pageIndex: Record<BookMode, number>;
  bookmarks: Bookmark[];
  zoom: number;

  counts: Record<string, number>;
  activePreset: string;
  presets: DhikrPreset[];
  logs: DhikrLog[];
  haptics: boolean;
  sound: boolean;

  prayers: Prayer[];
  amined: string[];

  halkaCounts: Record<string, number>;
  halkaTargets: Record<string, number>;
  halkaStep: number;
  halkaGoal: number;
  halkaHistory: Record<string, number>;

  esmaFavorites: number[];
  lastRead: { mode: BookMode; index: number; at: number } | null;

  readDays: string[];
  lastReadAt: number | null;

  alarms: Record<string, { enabled: boolean; leads: number[] }>;

  salahLog: Record<string, Record<string, "done" | "missed">>;
};


type Actions = {
  setMode: (mode: BookMode) => void;
  setPage: (mode: BookMode, index: number) => void;
  toggleBookmark: (b: Bookmark) => void;
  setZoom: (z: number) => void;

  increment: (presetId: string) => void;
  resetCount: (presetId: string) => void;
  setActivePreset: (id: string) => void;
  addPreset: (p: DhikrPreset) => void;
  removePreset: (id: string) => void;
  toggleHaptics: () => void;
  toggleSound: () => void;

  toggleAmin: (id: string) => void;
  addPrayer: (p: Omit<Prayer, "id" | "amin" | "createdAt">) => void;

  addHalka: (stepId: string, by: number) => void;
  resetHalka: (stepId: string) => void;
  setHalkaStep: (i: number) => void;
  setHalkaGoal: (n: number) => void;

  toggleEsmaFavorite: (no: number) => void;

  markRead: () => void;

  toggleAlarm: (key: string) => void;
  toggleAlarmLead: (key: string, lead: number) => void;
  setAllAlarms: (enabled: boolean) => void;

  setSalah: (prayer: string, status: "done" | "missed") => void;
};


const todayKey = () => new Date().toISOString().slice(0, 10);

export const useAppStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      mode: "latin",
      pageIndex: { arabic: 0, turkish: 0, latin: 0 },
      bookmarks: [],
      zoom: 1,

      counts: {},
      activePreset: DEFAULT_PRESETS[0]!.id,
      presets: DEFAULT_PRESETS,
      logs: [],
      haptics: true,
      sound: false,

      prayers: [],
      amined: [],

      halkaCounts: {},
      halkaTargets: {},
      halkaStep: 0,
      halkaGoal: 500,
      halkaHistory: {},

      esmaFavorites: [],
      lastRead: null,

      readDays: [],
      lastReadAt: null,

      alarms: {},

      salahLog: {},


      setMode: (mode) => set({ mode }),
      setPage: (mode, index) =>
        set((s) => ({
          pageIndex: { ...s.pageIndex, [mode]: Math.max(0, index) },
          lastRead: { mode, index: Math.max(0, index), at: Date.now() },
        })),
      toggleBookmark: (b) =>
        set((s) => {
          const exists = s.bookmarks.some((x) => x.mode === b.mode && x.index === b.index);
          return {
            bookmarks: exists
              ? s.bookmarks.filter((x) => !(x.mode === b.mode && x.index === b.index))
              : [b, ...s.bookmarks].slice(0, 100),
          };
        }),
      setZoom: (zoom) => set({ zoom: Math.min(2.5, Math.max(0.7, zoom)) }),

      increment: (presetId) =>
        set((s) => ({ counts: { ...s.counts, [presetId]: (s.counts[presetId] ?? 0) + 1 } })),
      resetCount: (presetId) => {
        const s = get();
        const count = s.counts[presetId] ?? 0;
        const preset = s.presets.find((p) => p.id === presetId);
        set({
          counts: { ...s.counts, [presetId]: 0 },
          logs:
            count > 0
              ? [
                  {
                    id: `${Date.now()}`,
                    presetId,
                    title: preset?.title ?? "Zikir",
                    count,
                    date: todayKey(),
                  },
                  ...s.logs,
                ].slice(0, 60)
              : s.logs,
        });
      },
      setActivePreset: (activePreset) => set({ activePreset }),
      addPreset: (p) => set((s) => ({ presets: [...s.presets, p], activePreset: p.id })),
      removePreset: (id) =>
        set((s) => ({
          presets: s.presets.filter((p) => p.id !== id),
          activePreset: s.activePreset === id ? (s.presets[0]?.id ?? "") : s.activePreset,
        })),
      toggleHaptics: () => set((s) => ({ haptics: !s.haptics })),
      toggleSound: () => set((s) => ({ sound: !s.sound })),

      toggleAmin: (id) =>
        set((s) => {
          const on = s.amined.includes(id);
          return {
            amined: on ? s.amined.filter((x) => x !== id) : [...s.amined, id],
            prayers: s.prayers.map((p) =>
              p.id === id ? { ...p, amin: p.amin + (on ? -1 : 1) } : p,
            ),
          };
        }),
      addPrayer: (p) =>
        set((s) => ({
          prayers: [
            { ...p, id: `local-${Date.now()}`, amin: 1, createdAt: Date.now(), mine: true },
            ...s.prayers,
          ],
        })),

      addHalka: (stepId, by) =>
        set((s) => {
          const prev = s.halkaCounts[stepId] ?? 0;
          const next = Math.max(0, prev + by);
          let target = s.halkaTargets[stepId] ?? 100;
          while (next >= target) target *= 2;
          const key = todayKey();
          const gained = Math.max(0, next - prev);
          const history = { ...s.halkaHistory, [key]: (s.halkaHistory[key] ?? 0) + gained };
          const trimmed = Object.fromEntries(
            Object.entries(history)
              .sort((a, b) => (a[0] < b[0] ? 1 : -1))
              .slice(0, 90),
          );
          return {
            halkaCounts: { ...s.halkaCounts, [stepId]: next },
            halkaTargets: { ...s.halkaTargets, [stepId]: target },
            halkaHistory: trimmed,
          };
        }),
      resetHalka: (stepId) =>
        set((s) => ({
          halkaCounts: { ...s.halkaCounts, [stepId]: 0 },
          halkaTargets: { ...s.halkaTargets, [stepId]: 100 },
        })),
      setHalkaStep: (halkaStep) => set({ halkaStep }),
      setHalkaGoal: (n) => set({ halkaGoal: Math.max(10, Math.round(n)) }),

      toggleEsmaFavorite: (no) =>
        set((s) => ({
          esmaFavorites: s.esmaFavorites.includes(no)
            ? s.esmaFavorites.filter((x) => x !== no)
            : [...s.esmaFavorites, no],
        })),



      markRead: () =>
        set((s) => {
          const key = todayKey();
          return {
            readDays: s.readDays.includes(key) ? s.readDays : [...s.readDays, key].slice(-400),
            lastReadAt: Date.now(),
          };
        }),

      toggleAlarm: (key) =>
        set((s) => {
          const cur = s.alarms[key] ?? { enabled: false, leads: [0] };
          return {
            alarms: {
              ...s.alarms,
              [key]: { leads: cur.leads.length ? cur.leads : [0], enabled: !cur.enabled },
            },
          };
        }),
      toggleAlarmLead: (key, lead) =>
        set((s) => {
          const cur = s.alarms[key] ?? { enabled: true, leads: [0] };
          const has = cur.leads.includes(lead);
          const leads = has ? cur.leads.filter((l) => l !== lead) : [...cur.leads, lead].sort((a, b) => a - b);
          return {
            alarms: { ...s.alarms, [key]: { enabled: leads.length > 0, leads } },
          };
        }),
      setAllAlarms: (enabled) =>
        set((s) => {
          const keys = new Set([...Object.keys(s.alarms), "imsak", "gunes", "ogle", "ikindi", "aksam", "yatsi"]);
          const alarms: Record<string, { enabled: boolean; leads: number[] }> = {};
          for (const k of keys) {
            const cur = s.alarms[k] ?? { enabled: false, leads: [0] };
            alarms[k] = { enabled, leads: cur.leads.length ? cur.leads : [0] };
          }
          return { alarms };
        }),
      setSalah: (prayer, status) =>
        set((s) => {
          const key = todayKey();
          const day = { ...(s.salahLog[key] ?? {}) };
          if (day[prayer] === status) delete day[prayer];
          else day[prayer] = status;
          const entries = Object.entries(s.salahLog)
            .filter(([d]) => d !== key)
            .sort((a, b) => (a[0] < b[0] ? 1 : -1))
            .slice(0, 60);
          return { salahLog: { ...Object.fromEntries(entries), [key]: day } };
        }),

    }),
    {
      name: "delail-store",
      version: 4,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Record<string, unknown>;
        const oldAlarms = (state["alarms"] ?? {}) as Record<string, any>;
        const alarms: Record<string, { enabled: boolean; leads: number[] }> = {};
        for (const [k, v] of Object.entries(oldAlarms)) {
          if (v && Array.isArray(v.leads)) alarms[k] = { enabled: !!v.enabled, leads: v.leads };
          else if (v) alarms[k] = { enabled: !!v.enabled, leads: [Number(v.lead ?? 15)] };
        }
        return {
          ...state,
          mode: "latin",
          prayers: [],
          amined: [],
          alarms,
          esmaFavorites: (state["esmaFavorites"] as number[]) ?? [],
          halkaGoal: (state["halkaGoal"] as number) ?? 500,
          halkaHistory: (state["halkaHistory"] as Record<string, number>) ?? {},
          lastRead: (state["lastRead"] as unknown) ?? null,
        };
      },
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function currentStreak(readDays: string[]) {
  if (readDays.length === 0) return 0;
  const set = new Set(readDays);
  let streak = 0;
  const cursor = new Date();
  if (!set.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
