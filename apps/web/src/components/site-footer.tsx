import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { OWNER_APP_URL } from "@/lib/utils";

export function SiteFooter() {
  return (
    <footer className="border-t border-pitch-mist bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-sm text-sm leading-7 text-text-muted">
            احجز ملعب كرة قدم في رام الله، القدس، بيت لحم، الخليل ونابلس.
          </p>
        </div>
        <div>
          <div className="font-display text-sm font-bold">الصفحة</div>
          <div className="mt-4 flex flex-col gap-2 text-sm text-text-muted">
            <Link href="/#venues" className="hover:text-pitch">الملاعب</Link>
            <Link href="/#how" className="hover:text-pitch">طريقة الحجز</Link>
            <a href={`${OWNER_APP_URL}/signup`} className="hover:text-pitch">لأصحاب الملاعب</a>
          </div>
        </div>
        <div>
          <div className="font-display text-sm font-bold">تواصل</div>
          <div className="mt-4 flex gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="إنستغرام"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-pitch-light text-pitch"
            >
              <Instagram size={18} />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="فيسبوك"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-pitch-light text-pitch"
            >
              <Facebook size={18} />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-pitch-mist">
        <div className="mx-auto flex max-w-6xl justify-between px-4 py-5 text-xs text-text-muted md:px-6">
          <span>© {new Date().getFullYear()} ميدان.</span>
          <span>فلسطين</span>
        </div>
      </div>
    </footer>
  );
}
