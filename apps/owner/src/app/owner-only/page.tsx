"use client";

import { ButtonLink } from "@/components/ui";

export default function OwnerOnlyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="text-4xl font-black italic tracking-tight">COURTE<span className="text-brand">.</span></div>
        <h1 className="mt-6 text-3xl font-black text-slate-900">هذه البوابة لأصحاب الملاعب</h1>
        <p className="mt-3 text-sm font-medium text-slate-500">
          حسابك مخصص لحجز الملاعب. سجّل الدخول من تطبيق اللاعبين لإدارة حجوزاتك.
        </p>
        <ButtonLink href="/login" className="mt-6">
          العودة لتسجيل الدخول
        </ButtonLink>
      </div>
    </div>
  );
}
