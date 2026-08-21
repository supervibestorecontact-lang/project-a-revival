export type HalkaStep = {
  id: string;
  title: string;
  arabic: string;
  translit: string;
  meaning: string;
};

export const HALKA_STEPS: HalkaStep[] = [
  {
    id: "istigfar",
    title: "Estağfirullah",
    arabic: "أَسْتَغْفِرُ اللّٰهَ",
    translit: "Estağfirullâh",
    meaning: "Allah'tan bağışlanma dilerim.",
  },
  {
    id: "salavat-serife",
    title: "Salât-ı Şerîfe",
    arabic: "اَللّٰهُمَّ صَلِّ عَلٰى سَيِّدِنَا مُحَمَّدٍ",
    translit: "Allâhümme salli alâ seyyidinâ Muhammed",
    meaning: "Efendimiz Muhammed'e salât ve selâm eyle.",
  },
  {
    id: "hamd",
    title: "Elhamdülillah",
    arabic: "اَلْحَمْدُ لِلّٰهِ",
    translit: "Elhamdülillâh",
    meaning: "Hamd, âlemlerin Rabbi Allah'a mahsustur.",
  },
  {
    id: "tekbir",
    title: "Allahu Ekber",
    arabic: "اَللّٰهُ أَكْبَرُ",
    translit: "Allâhu ekber",
    meaning: "Allah en büyüktür.",
  },
  {
    id: "tesbih",
    title: "Sübhanallah",
    arabic: "سُبْحَانَ اللّٰهِ",
    translit: "Sübhânallâh",
    meaning: "Allah'ı her türlü noksanlıktan tenzih ederim.",
  },
  {
    id: "tevhid",
    title: "Lâ ilâhe illallâh",
    arabic: "لَا إِلٰهَ إِلَّا اللّٰهُ",
    translit: "Lâ ilâhe illallâh",
    meaning: "Allah'tan başka ilah yoktur.",
  },
  {
    id: "salavat-fatih",
    title: "Salât-ı Fâtih",
    arabic: "اَللّٰهُمَّ صَلِّ عَلٰى مُحَمَّدٍ الْفَاتِحِ لِمَا أُغْلِقَ",
    translit: "Allâhümme salli alâ Muhammedinil Fâtihi limâ uğlik",
    meaning: "Kapalı olanı açan Efendimiz Muhammed'e salât eyle.",
  },
  {
    id: "havle",
    title: "Lâ havle velâ kuvvete",
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ",
    translit: "Lâ havle velâ kuvvete illâ billâh",
    meaning: "Güç ve kuvvet ancak Allah'tandır.",
  },
  {
    id: "hasbi",
    title: "Hasbiyallâh",
    arabic: "حَسْبِيَ اللّٰهُ وَنِعْمَ الْوَكِيلُ",
    translit: "Hasbiyallâhu ve ni'mel vekîl",
    meaning: "Allah bana yeter, O ne güzel vekildir.",
  },
  {
    id: "hayyul",
    title: "Yâ Hayyü Yâ Kayyûm",
    arabic: "يَا حَيُّ يَا قَيُّومُ",
    translit: "Yâ Hayyü yâ Kayyûm",
    meaning: "Ey diri ve her şeyi ayakta tutan Allah.",
  },
  {
    id: "subhan-bihamdihi",
    title: "Sübhânallâhi ve bihamdihî",
    arabic: "سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ",
    translit: "Sübhânallâhi ve bihamdihî",
    meaning: "Allah'ı tesbih eder, O'na hamd ederim.",
  },
  {
    id: "hasbi-final",
    title: "Hasbünallâh ve ni'mel vekîl",
    arabic: "حَسْبِيَ اللّٰهُ وَنِعْمَ الْوَكِيلُ",
    translit: "Hasbünallâhu ve ni'mel vekîl",
    meaning: "Allah bana yeter, O ne güzel vekildir.",
  },
];

export const HALKA_INTRO = {
  source: "Ra'd Suresi 28. Ayet",
  meaning:
    "Bunlar, iman edenler ve Allah'ı zikrederek gönülleri huzura kavuşanlardır. Bilesiniz ki gönüller ancak Allah'ı zikrederek huzura kavuşur.",
};


export const MOTIVATIONS = [
  "Bir zikir, bir nefes. Her nefeste kalbin nurlanır.",
  "Halkayı tamamlayan kalp, huzura en yakın kalptir.",
  "Bugün 100 ile başla; Rabbin bereketiyle katlanarak devam et.",
  "Zikre devam eden dil, gafletten korunan bir kalbe yol açar.",
  "Az ama devamlı olan amel, çok ama kesik olandan hayırlıdır.",
  "Her hedefi geçtiğinde yeni bir kapı açılır — durma, devam et.",
  "Kalbin ancak Allah'ı anmakla huzur bulur. (Ra'd 28)",
];
