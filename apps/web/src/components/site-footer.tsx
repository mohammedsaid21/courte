import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { signupWithNext, VENUE_DISCOVERY_PATH } from "@/lib/auth-routes";
import { OWNER_APP_URL } from "@/lib/utils";

const signupHref = signupWithNext(VENUE_DISCOVERY_PATH);
const loginHref = `/login?next=${encodeURIComponent(VENUE_DISCOVERY_PATH)}`;

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-arena-stadium text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <Wordmark variant="brand" />
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/65">
            منصة لاكتشاف ملاعب الرياضة وحجز الأوقات — للاعبين والفرق.
          </p>
        </div>
        <div>
          <div className="font-display text-sm font-extrabold text-arena-lime">المنتج</div>
          <div className="mt-4 flex flex-col gap-2 text-sm font-semibold text-white/70">
            <Link href="/#how" className="hover:text-arena">كيف يعمل</Link>
            <Link href="/#sports" className="hover:text-arena">الرياضات</Link>
            <Link href="/#faq" className="hover:text-arena">الأسئلة الشائعة</Link>
            <Link href={signupHref} className="hover:text-arena">إنشاء حساب</Link>
            <Link href={loginHref} className="hover:text-arena">دخول</Link>
          </div>
        </div>
        <div>
          <div className="font-display text-sm font-extrabold text-arena-lime">أصحاب الملاعب</div>
          <div className="mt-4 flex flex-col gap-2 text-sm font-semibold text-white/70">
            <a href={`${OWNER_APP_URL}/signup`} className="hover:text-arena">تسجيل ملعب</a>
            <a href={OWNER_APP_URL} className="hover:text-arena">بوابة المالك</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/45 sm:flex-row sm:justify-between md:px-8">
          <span>© {new Date().getFullYear()} ميدان</span>
          <span>فلسطين</span>
        </div>
      </div>
    </footer>
  );
}
