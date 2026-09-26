export const DEFAULT_VENUE_TYPES = [
  { slug: "football", name: "Football", nameAr: "كرة القدم", sortOrder: 1 },
  { slug: "futsal", name: "Futsal", nameAr: "كرة الصالات", sortOrder: 2 },
  { slug: "padel", name: "Padel", nameAr: "بادل", sortOrder: 3 },
  { slug: "basketball", name: "Basketball", nameAr: "كرة السلة", sortOrder: 4 },
  { slug: "volleyball", name: "Volleyball", nameAr: "كرة الطائرة", sortOrder: 5 },
  { slug: "handball", name: "Handball", nameAr: "كرة اليد", sortOrder: 6 },
  { slug: "tennis", name: "Tennis", nameAr: "تنس", sortOrder: 7 },
  { slug: "table-tennis", name: "Table tennis", nameAr: "تنس الطاولة", sortOrder: 8 },
  { slug: "squash", name: "Squash", nameAr: "سكواش", sortOrder: 9 },
  { slug: "swimming-pool", name: "Swimming Pool", nameAr: "مسبح", sortOrder: 10 },
  { slug: "gym", name: "Gym", nameAr: "صالة رياضية", sortOrder: 11 },
] as const;

export const DEFAULT_AMENITIES = [
  { slug: "parking", name: "Parking", nameAr: "موقف سيارات", sortOrder: 1 },
  { slug: "lights", name: "Floodlights", nameAr: "إضاءة", sortOrder: 2 },
  { slug: "changing-rooms", name: "Changing rooms", nameAr: "غرف تبديل", sortOrder: 3 },
  { slug: "showers", name: "Showers", nameAr: "دشات", sortOrder: 4 },
  { slug: "cafeteria", name: "Cafeteria", nameAr: "كافتيريا", sortOrder: 5 },
  { slug: "wifi", name: "Wi-Fi", nameAr: "واي فاي", sortOrder: 6 },
  { slug: "seating", name: "Spectator seating", nameAr: "مقاعد جمهور", sortOrder: 7 },
  { slug: "indoor", name: "Indoor", nameAr: "داخلي", sortOrder: 8 },
  { slug: "outdoor", name: "Outdoor", nameAr: "خارجي", sortOrder: 9 },
  { slug: "equipment-rental", name: "Equipment rental", nameAr: "تأجير معدات", sortOrder: 10 },
  { slug: "air-conditioning", name: "Air conditioning", nameAr: "تكييف", sortOrder: 11 },
  { slug: "prayer-room", name: "Prayer room", nameAr: "مصلى", sortOrder: 12 },
] as const;
