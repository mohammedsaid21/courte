"use client";

import Link from "next/link";
import { OWNER_APP_URL } from "@/lib/utils";
import { ButtonLink } from "@/components/ui";

export default function PlayerOnlyPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-[12px] border border-border bg-white p-8 text-center shadow-sm md:p-10">
        <p className="text-[11px] font-bold text-gold">ميدان</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight">هذا حساب ملعب، مش حساب شخصي</h1>
        <p className="mt-4 text-sm leading-relaxed text-text-muted">
          دخلت بحساب مخصّص لإدارة الملاعب والحجوزات من جهة الصاحب. موقع ميدان للاعبين الذين يبحثون عن ملعب ويحجزون لأنفسهم.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          لا تقلق — الحساب سليم. فقط استخدم البوابة المناسبة لكل غرض.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href={`${OWNER_APP_URL}/login`}>الذهاب لبوابة أصحاب الملاعب</ButtonLink>
          <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-brand px-4 text-sm font-bold text-text-muted hover:text-pitch">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
