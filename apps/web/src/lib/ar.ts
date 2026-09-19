export const CITY_AR: Record<string, string> = {
  Ramallah: "رام الله",
  "Al-Bireh": "البيرة",
  Nablus: "نابلس",
  Hebron: "الخليل",
  Bethlehem: "بيت لحم",
  Jenin: "جنين",
  Tulkarm: "طولكرم",
  Qalqilya: "قلقيلية",
  Jericho: "أريحا",
  Salfit: "سلفيت",
  Tubas: "طوباس",
  "Beit Jala": "بيت جالا",
  "Beit Sahour": "بيت ساحور",
  Birzeit: "بيرزيت",
  Yatta: "يطا",
  Dura: "دورا",
  Halhul: "حلحول",
  Qabatiya: "قباطية",
  "Abu Dis": "أبو ديس",
  "Al-Eizariya": "العيزرية",
};

export const HOME_CITIES = [
  { ar: "رام الله", en: "Ramallah" },
  { ar: "القدس", en: "Jerusalem" },
  { ar: "بيت لحم", en: "Bethlehem" },
  { ar: "الخليل", en: "Hebron" },
  { ar: "نابلس", en: "Nablus" },
] as const;

export const COURT_SIZES = [
  { id: "5v5", label: "5 ضد 5" },
  { id: "7v7", label: "7 ضد 7" },
  { id: "11v11", label: "11 ضد 11" },
] as const;

export function cityAr(city: string) {
  return CITY_AR[city] ?? city;
}

export const WEEKDAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export const WEEKDAYS_SHORT_AR = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
