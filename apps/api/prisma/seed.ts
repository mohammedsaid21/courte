import { PrismaClient } from "@prisma/client";
import { DEFAULT_AMENITIES, DEFAULT_VENUE_TYPES } from "../src/catalog/defaults";

const prisma = new PrismaClient();

async function main() {
  for (const type of DEFAULT_VENUE_TYPES) {
    await prisma.venueType.upsert({
      where: { slug: type.slug },
      update: type,
      create: type,
    });
  }
  for (const amenity of DEFAULT_AMENITIES) {
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
