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

export function cityAr(city: string) {
  return CITY_AR[city] ?? city;
}

export const WEEKDAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export const WEEKDAYS_SHORT_AR = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

export const STATUS_AR: Record<string, string> = {
  CONFIRMED: "مؤكد",
  PENDING: "قيد الانتظار",
  CANCELLED: "ملغى",
  COMPLETED: "مكتمل",
};

export const PAYMENT_AR: Record<string, string> = {
  UNPAID: "غير مدفوع",
  PAID: "مدفوع",
  PARTIAL: "جزئي",
};

export const SOURCE_AR: Record<string, string> = {
  CUSTOMER: "المنصة",
  ADMIN: "إدارة",
  WHATSAPP: "واتساب",
  PHONE: "هاتف",
  WALK_IN: "حضور مباشر",
  MANUAL: "يدوي",
};

export function statusLabel(status: string) {
  return STATUS_AR[status] ?? status;
}

export function paymentLabel(status: string) {
  return PAYMENT_AR[status] ?? status;
}

export function sourceLabelAr(source: string) {
  return SOURCE_AR[source] ?? "يدوي";
}

export function catalogName(item: { name: string; nameAr?: string | null }) {
  return item.nameAr?.trim() || item.name;
}

export function issueLabel(type: string) {
  if (type === "pending") return "حجز بانتظار التأكيد";
  if (type === "unpaid_started") return "بدأ الموعد ولم يُدفع بالكامل";
  if (type === "overlap") return "تعارض في المواعيد على نفس الملعب";
  if (type === "closed_with_bookings") return "الملعب مغلق وعليه حجوزات";
  return "يحتاج مراجعة";
}
