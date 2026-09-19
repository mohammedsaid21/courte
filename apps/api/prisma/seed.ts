import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const venueTypes = [
  { slug: "football", name: "Football", nameAr: "كرة القدم", sortOrder: 1 },
  { slug: "padel", name: "Padel", nameAr: "بادل", sortOrder: 2 },
  { slug: "basketball", name: "Basketball", nameAr: "كرة السلة", sortOrder: 3 },
  { slug: "volleyball", name: "Volleyball", nameAr: "كرة الطائرة", sortOrder: 4 },
  { slug: "swimming-pool", name: "Swimming Pool", nameAr: "مسبح", sortOrder: 5 },
  { slug: "gym", name: "Gym", nameAr: "صالة رياضية", sortOrder: 6 },
  { slug: "tennis", name: "Tennis", nameAr: "تنس", sortOrder: 7 },
];

const amenities = [
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
];

async function main() {
  for (const type of venueTypes) {
    await prisma.venueType.upsert({
      where: { slug: type.slug },
      update: type,
      create: type,
    });
  }
  for (const amenity of amenities) {
    await prisma.amenity.upsert({
      where: { slug: amenity.slug },
      update: amenity,
      create: amenity,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
