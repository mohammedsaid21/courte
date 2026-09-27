"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/components/session-provider";
import { BookingPreview } from "@/components/public-home/booking-preview";
import { FaqSection } from "@/components/public-home/faq-section";
import { HeroTeaser } from "@/components/public-home/hero-teaser";
import { exploreVenuesHref, signupWithNext, VENUE_DISCOVERY_PATH } from "@/lib/auth-routes";
import { OWNER_APP_URL } from "@/lib/utils";

/** Floodlit pitch at dusk — strong grass + lights without crushing blacks. */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=2400&q=88";
const HERO_IMAGE_FALLBACK = "/assets/hero-pitch.svg";
const PLAY_IMAGE =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=2000&q=80";

const SPORTS = [
  {
    slug: "football",
    title: "كرة القدم",
    tag: "Football",
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80",
    layout: "feature" as const,
  },
  {
    slug: "futsal",
    title: "كرة الصالات",
    tag: "Futsal",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=900&q=80",
    layout: "tall" as const,
  },
  {
    slug: "basketball",
    title: "كرة السلة",
    tag: "Basketball",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80",
    layout: "wide" as const,
  },
  {
    slug: "swimming-pool",
    title: "مسبح",
    tag: "Swimming",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=900&q=80",
    layout: "wide" as const,
  },
] as const;

const STEPS = [
  { n: "01", title: "سجّل حسابك", body: "أنشئ حسابًا مجانيًا للوصول إلى المنصة." },
  { n: "02", title: "اعثر على ملعب", body: "تصفّح المرافق الرياضية واختر ما يناسبك." },
  { n: "03", title: "احجز وقتك", body: "اختر ساعة متاحة وأكد الحجز من حسابك." },
] as const;

function FindGameButton({ href, className = "" }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center bg-arena px-7 text-sm font-black text-arena-stadium transition hover:bg-arena-deep hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-lime ${className}`}
    >
      اعثر على مباراتك
    </Link>
  );
}

export function HomeLanding() {
  const { session, loading } = useSession();
  const authed = Boolean(session);
  const gameHref = loading ? signupWithNext(VENUE_DISCOVERY_PATH) : exploreVenuesHref(authed);
  const signupHref = signupWithNext(VENUE_DISCOVERY_PATH);
  const [heroSrc, setHeroSrc] = useState(HERO_IMAGE);

  return (
    <div className="bg-arena-warm text-copy-primary">
      {/* —— Hero: The world is your pitch —— */}
      <section className="relative isolate min-h-[100svh] overflow-hidden bg-arena-stadium">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_40%] brightness-[1.12] contrast-[1.05] saturate-[1.1]"
          fetchPriority="high"
          onError={() => setHeroSrc(HERO_IMAGE_FALLBACK)}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-arena-stadium/88 via-arena-stadium/25 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-l from-arena-stadium/65 via-transparent to-transparent max-md:from-arena-stadium/75 max-md:via-arena-stadium/30"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid min-h-[100svh] max-w-7xl grid-rows-[1fr_auto] gap-8 px-4 pb-10 pt-28 md:grid-cols-12 md:grid-rows-1 md:items-end md:gap-6 md:px-8 md:pb-16 md:pt-32">
          <div className="flex flex-col justify-end md:col-span-7 md:pb-4">
            <div className="reveal max-w-xl rounded-2xl border border-white/10 bg-arena-stadium/25 p-5 backdrop-blur-sm md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
              <p className="mb-3 text-sm font-bold text-arena-lime">ميدان · الضفة الغربية</p>
              <h1 className="font-display text-[clamp(1.85rem,5.5vw,3.35rem)] font-extrabold leading-[1.15] text-white drop-shadow-sm">
                احجز ملعبك في الضفة —
                <span className="mt-1 block text-arena">وقت اللعب بين يديك.</span>
              </h1>
              <p className="reveal-2 mt-4 text-base font-medium leading-8 text-white/90 md:text-[17px]">
                منصة لاكتشاف ملاعب كرة القدم والمرافق الرياضية في رام الله، نابلس، الخليل، بيت لحم والقدس. أنشئ
                حسابًا مجانيًا لتصفح الأوقات المتاحة والحجز.
              </p>
            </div>
            <div className="reveal-3 mt-8 flex flex-wrap items-center gap-4">
              <FindGameButton href={gameHref} />
              <a
                href="#how"
                className="text-sm font-bold text-white/85 underline decoration-arena-lime/60 underline-offset-4 transition hover:text-white"
              >
                كيف يعمل
              </a>
            </div>
          </div>

          <div className="flex items-end justify-center md:col-span-5 md:justify-end md:pb-8">
            <div className="relative w-full md:-rotate-1 md:translate-y-2">
              <div className="absolute -inset-px bg-gradient-to-br from-arena/40 to-transparent opacity-60 blur-sm" aria-hidden="true" />
              <HeroTeaser compact={false} />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-arena/50 to-transparent" aria-hidden="true" />
      </section>

      {/* —— Sports editorial —— */}
      <section id="sports" className="scroll-mt-24 bg-white px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-tight">
              اختر <span className="text-arena-deep">رياضتك.</span>
            </h2>
            <p className="max-w-md text-sm leading-7 text-copy-secondary md:text-end">
              أنواع المرافق في المنصة — التوفر الفعلي يظهر بعد التسجيل حسب الملاعب في منطقتك.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-12 md:grid-rows-2 md:gap-5">
            {SPORTS.map((sport) => {
              const col =
                sport.layout === "feature"
                  ? "md:col-span-7 md:row-span-2 min-h-[320px] md:min-h-[480px]"
                  : sport.layout === "tall"
                    ? "md:col-span-5 md:row-span-2 min-h-[260px]"
                    : "md:col-span-6 min-h-[200px]";
              return (
                <Link
                  key={sport.slug}
                  href={signupHref}
                  className={`group relative overflow-hidden bg-arena-pitch ${col}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sport.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-arena-stadium via-arena-stadium/25 to-transparent opacity-90 transition group-hover:opacity-80" />
                  <div className="relative flex h-full flex-col justify-between p-6 md:p-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-arena-lime">{sport.tag}</span>
                    <div>
                      <h3 className="font-display text-2xl font-extrabold text-white md:text-3xl">{sport.title}</h3>
                      <span className="mt-3 inline-block text-xs font-bold text-arena opacity-0 transition group-hover:opacity-100">
                        سجّل للاستكشاف →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* —— How it works —— */}
      <section id="how" className="scroll-mt-24 bg-arena-stadium px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-arena-lime">الرحلة</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-white md:text-4xl">ثلاث خطوات للملعب</h2>
          <ol className="mt-14 space-y-0 md:grid md:grid-cols-3 md:gap-8 md:space-y-0">
            {STEPS.map((step, index) => (
              <li key={step.n} className="relative border-s border-arena-pitch/40 py-8 ps-6 md:border-s-0 md:border-t md:border-arena-pitch/50 md:py-0 md:pt-8 md:ps-0">
                {index < STEPS.length - 1 && (
                  <span className="absolute -end-4 top-12 hidden h-px w-8 bg-arena/40 md:block" aria-hidden="true" />
                )}
                <span className="font-display text-5xl font-extrabold tabular-nums text-arena/90 md:text-6xl">{step.n}</span>
                <h3 className="mt-4 font-display text-xl font-extrabold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-white/65">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* —— Product preview —— */}
      <section id="preview" className="scroll-mt-24 px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold md:text-4xl">من الاكتشاف إلى التأكيد</h2>
            <p className="mt-4 text-base leading-8 text-copy-secondary">
              معاينة لشكل التطبيق بعد تسجيل الدخول — بيانات توضيحية فقط، دون ملاعب حقيقية.
            </p>
          </div>
          <div className="mt-12">
            <BookingPreview />
          </div>
        </div>
      </section>

      {/* —— Emotional moment —— */}
      <section className="relative isolate min-h-[70vh] overflow-hidden bg-arena-pitch md:min-h-[80vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PLAY_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-50 mix-blend-luminosity"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-arena-stadium via-arena-stadium/70 to-arena-stadium/30" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-center px-4 py-20 md:min-h-[80vh] md:px-8">
          <h2 className="max-w-3xl font-display text-[clamp(2.25rem,6vw,4rem)] font-extrabold leading-[1.05] text-white">
            تخطيط أقل.
            <br />
            <span className="text-arena-lime">لعب أكثر.</span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-8 text-white/75">
            مكان للعب، وقت واضح، وفريق جاهز — بدون تنسيق لا ينتهي.
          </p>
        </div>
      </section>

      {/* —— FAQ —— */}
      <section id="faq" className="scroll-mt-24 bg-arena-warm px-4 py-20 md:px-8 md:pb-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-extrabold md:text-4xl">أسئلة شائعة</h2>
          <div className="mt-8">
            <FaqSection />
          </div>
        </div>
      </section>

      {/* —— Final CTA —— */}
      <section className="relative overflow-hidden bg-arena-deep px-4 py-24 md:px-8 md:py-32">
        <div className="pointer-events-none absolute -end-20 top-0 h-64 w-64 rounded-full bg-arena/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 start-0 h-48 w-48 rounded-full bg-arena-lime/10 blur-2xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-8 h-px w-24 bg-arena-lime" aria-hidden="true" />
          <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-tight text-white">
            مباراتك القادمة بانتظارك.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-8 text-white/70">
            ادخل، اعثر على ملعبك، واجعلها تحدث.
          </p>
          <div className="mt-10 flex justify-center">
            <FindGameButton href={gameHref} className="min-h-14 px-10 text-base" />
          </div>
        </div>
      </section>

      {/* —— Owners —— */}
      <section id="owners" className="border-t border-line bg-white px-4 py-12 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-xl font-extrabold">تملك ملعبًا؟</h2>
            <p className="mt-2 max-w-md text-sm leading-7 text-copy-secondary">
              بوابة منفصلة لأصحاب المرافق — إدارة الجدول والحجوزات.
            </p>
          </div>
          <a
            href={`${OWNER_APP_URL}/signup`}
            className="inline-flex min-h-12 items-center border-2 border-arena-stadium px-6 text-sm font-black text-arena-stadium transition hover:bg-arena-stadium hover:text-white"
          >
            بوابة أصحاب الملاعب
          </a>
        </div>
      </section>
    </div>
  );
}
