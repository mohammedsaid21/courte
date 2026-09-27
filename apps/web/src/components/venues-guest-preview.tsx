import Link from "next/link";
import { Lock } from "lucide-react";
import { VenueCard } from "@/components/venue-card";
import { ButtonLink } from "@/components/ui";
import { loginWithNext, signupWithNext, VENUE_DISCOVERY_PATH } from "@/lib/auth-routes";
import { SAMPLE_DISCOVER_VENUE } from "@/lib/sample-venue";

export function VenuesGuestPreview() {
  const loginHref = loginWithNext(VENUE_DISCOVERY_PATH);
  const signupHref = signupWithNext(VENUE_DISCOVERY_PATH);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-arena/30 bg-gradient-to-br from-arena-warm to-white p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-arena/15 text-arena-deep">
              <Lock size={22} />
            </div>
            <div>
              <h2 className="font-display text-xl font-extrabold text-copy-primary">سجّل الدخول لعرض الملاعب</h2>
              <p className="mt-2 max-w-lg text-sm leading-7 text-copy-secondary">
                يمكنك فتح هذه الصفحة دون حساب، لكن القائمة الفعلية والأوقات المتاحة تظهر بعد تسجيل الدخول أو إنشاء حساب
                لاعب.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={loginHref}>دخول</ButtonLink>
            <ButtonLink href={signupHref} variant="outline">إنشاء حساب</ButtonLink>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-4 text-sm font-bold text-copy-secondary">مثال على شكل بطاقة الملعب (بيانات توضيحية)</p>
        <div className="relative max-w-md">
          <VenueCard venue={SAMPLE_DISCOVER_VENUE} preview />
          <Link
            href={signupHref}
            className="absolute inset-0 z-10 flex items-end justify-center rounded-[12px bg-arena-stadium/0 p-4 transition hover:bg-arena-stadium/40"
          >
            <span className="rounded-xl bg-arena px-4 py-2 text-sm font-black text-arena-stadium opacity-0 transition hover:opacity-100">
              أنشئ حسابًا لاستكشاف الملاعب
            </span>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[12px] border border-line bg-white opacity-60">
            <div className="aspect-[16/10] bg-pitch-mist blur-[2px]" />
            <div className="space-y-2 p-4">
              <div className="h-5 w-2/3 rounded bg-pitch-mist" />
              <div className="h-4 w-1/2 rounded bg-pitch-mist/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
