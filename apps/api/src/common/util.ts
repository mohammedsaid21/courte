import { Decimal } from "@prisma/client/runtime/library";

export function money(value: Decimal | number | string | { toString(): string }): number {
  return Math.round(Number(value.toString()) * 100) / 100;
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function uniqueSlug(value: string): string {
  const base = slugify(value) || "venue";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
