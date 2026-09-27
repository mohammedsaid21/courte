import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const url = process.env.DATABASE_URL ?? "";
console.log("schema:", url.includes("schema=courte") ? "courte" : "other/default");

const prisma = new PrismaClient();
try {
  await prisma.venue.findMany({
    take: 1,
    include: {
      types: { include: { venueType: true } },
      photos: { orderBy: { sortOrder: "asc" }, take: 1 },
      resources: {
        where: { isActive: true },
        include: { operatingHours: true, exceptions: true, pricingRules: true },
      },
    },
  });
  const count = await prisma.venue.count();
  console.log("discover-shaped query: ok, venues:", count);
} catch (e) {
  console.error("FAILED:", e.message);
} finally {
  await prisma.$disconnect();
}
