"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Timer, Trophy } from "lucide-react";
import { COURT_SIZES, HOME_CITIES } from "@/lib/ar";
import { venueService, type DiscoverVenue } from "@/lib/api";
import { addDaysYmd, OWNER_APP_URL, todayYmd } from "@/lib/utils";
import { VenueCard } from "@/components/venue-card";

export function HomeLanding() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [size, setSize] = useState("");
  const [availability, setAvailability] = useState<"any" | "today" | "week">("any");
  const [filter, setFilter] = useState("");
  const [venues, setVenues] = useState<DiscoverVenue[]>([]);

  useEffect(() => {
    void venueService
      .search({ pageSize: 6, size: (filter || size || undefined) as DiscoverVenue["sizes"][number] | undefined })
      .then((result) => setVenues(result.items))
      .catch(() => setVenues([]));
  }, [filter, size]);

  function search(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    const cityEn = HOME_CITIES.find((item) => item.ar === city)?.en;
    if (cityEn) params.set("city", cityEn);
    if (area.trim()) params.set("area", area.trim());
    if (size) params.set("size", size);
    if (availability === "today") params.set("date", todayYmd());
    if (availability === "week") {
      params.set("date", todayYmd());
      params.set("dateTo", addDaysYmd(todayYmd(), 6));
    }
    router.push(`/venues${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div>
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <picture className="absolute inset-0 block h-full w-full">
          <source media="(max-width: 767px)" srcSet="/assets/hero-pitch-mobile.jpg" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/hero-pitch.jpg"
            alt="ملعب خماسي مضاء وقت الغروب، جاهز للمباراة"
            className="h-full w-full object-cover object-[center_38%] md:object-center"
            fetchPriority="high"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-pitch-deep via-pitch-deep/45 to-pitch-deep/25" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-pitch-deep/35" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-8 pt-28 sm:pb-14 md:px-6 md:pb-16 md:pt-32">
          <div className="max-w-2xl text-white">
            <p className="reveal mb-3 text-[11px] font-extrabold uppercase tracking-[0.28em] text-gold">كرة القدم · احجز الآن</p>
            <h1 className="reveal font-display text-[clamp(2rem,8vw,4.5rem)] font-extrabold leading-[1.12]">
              ملعبك جاهز.
              <br />
              اجمع فريقك والعب.
            </h1>
            <p className="reveal-2 mt-4 max-w-lg text-[15px] font-medium leading-7 text-white/88 sm:mt-5 sm:text-lg sm:leading-8">
              أقرب ملعب في مدينتك، الساعة المناسبة، والحجز خلال دقائق. من الخماسي إلى الملعب الكامل.
            </p>
          </div>
          <form
            onSubmit={search}
            className="glass reveal-3 mt-6 grid gap-2 rounded-[16px] p-2.5 sm:mt-8 sm:gap-3 sm:p-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]"
          >
            <label className="block rounded-[12px] px-3 py-2">
              <span className="mb-1 block text-xs font-bold text-pitch">المدينة</span>
              <select
                className="h-11 w-full bg-transparent text-sm font-bold text-text outline-none"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                aria-label="المدينة"
              >
                <option value="">كل المدن</option>
                {HOME_CITIES.map((item) => (
                  <option key={item.ar} value={item.ar}>
                    {item.ar}
                  </option>
                ))}
              </select>
            </label>
            <label className="block rounded-[12px] px-3 py-2">
              <span className="mb-1 block text-xs font-bold text-pitch">القرية / المنطقة</span>
              <input
                className="h-11 w-full bg-transparent text-sm font-bold outline-none"
                value={area}
                onChange={(event) => setArea(event.target.value)}
                placeholder="اختياري"
                aria-label="القرية أو المنطقة"
              />
            </label>
            <label className="block rounded-[12px] px-3 py-2">
              <span className="mb-1 block text-xs font-bold text-pitch">حجم الملعب</span>
              <select
                className="h-11 w-full bg-transparent text-sm font-bold outline-none"
                value={size}
                onChange={(event) => setSize(event.target.value)}
                aria-label="حجم الملعب"
              >
                <option value="">كل الأحجام</option>
                {COURT_SIZES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block rounded-[12px] px-3 py-2">
              <span className="mb-1 block text-xs font-bold text-pitch">توفر الحجز</span>
              <select
                className="h-11 w-full bg-transparent text-sm font-bold outline-none"
                value={availability}
                onChange={(event) => setAvailability(event.target.value as "any" | "today" | "week")}
                aria-label="توفر الحجز"
              >
                <option value="any">كل الملاعب</option>
                <option value="today">متاح اليوم</option>
                <option value="week">متاح هذا الأسبوع</option>
              </select>
            </label>
            <button
              type="submit"
              className="min-h-14 rounded-[12px] bg-pitch px-6 text-sm font-bold text-white hover:bg-pitch-dark"
            >
              ابحث عن ملعب
            </button>
          </form>
        </div>
      </section>

      <section id="venues" className="-mt-8 scroll-mt-24 px-4 pb-16 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="glass rounded-[12px] p-5 md:p-8">
            <h2 className="font-display text-2xl font-extrabold md:text-3xl">ملاعب مختارة لمباراتك القادمة</h2>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="فلاتر حجم الملعب">
              {[{ id: "", label: "الكل" }, ...COURT_SIZES].map((item) => {
                const active = filter === item.id;
                return (
                  <button
                    key={item.id || "all"}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(item.id)}
                    className={`min-h-11 shrink-0 rounded-[12px] px-4 text-sm font-bold ${
                      active ? "bg-pitch text-white" : "bg-pitch-light text-pitch"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {venues.length === 0 ? (
                <p className="text-sm font-medium text-text-muted sm:col-span-2 lg:col-span-3">لا يوجد ملعب بهذه الفلاتر. جرّب حجمًا آخر أو تصفح كل الملاعب.</p>
              ) : (
                venues.map((venue) => <VenueCard key={venue.id} venue={venue} />)
              )}
            </div>
            <Link href="/venues" className="mt-6 inline-flex min-h-12 items-center font-bold text-pitch">
              عرض كل الملاعب
            </Link>
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-24 px-4 py-16 md:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl font-extrabold md:text-3xl">من البحث إلى صافرة البداية</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            <li className="space-y-3">
              <div className="font-display text-6xl font-extrabold text-pitch">01</div>
              <Trophy className="text-gold" size={28} />
              <h3 className="font-display text-xl font-bold">اختر ملعبك</h3>
              <p className="text-sm leading-7 text-text-muted">حدد المدينة والحجم واختر الملعب الأقرب لفريقك.</p>
            </li>
            <li className="space-y-3">
              <div className="font-display text-6xl font-extrabold text-pitch">02</div>
              <Timer className="text-gold" size={28} />
              <h3 className="font-display text-xl font-bold">حدد الوقت</h3>
              <p className="text-sm leading-7 text-text-muted">شوف الساعات المتاحة مساءً واختر الساعة المناسبة.</p>
            </li>
            <li className="space-y-3">
              <div className="font-display text-6xl font-extrabold text-pitch">03</div>
              <CalendarCheck className="text-gold" size={28} />
              <h3 className="font-display text-xl font-bold">أكد الحجز</h3>
              <p className="text-sm leading-7 text-text-muted">أكد الموعد وادخل الملعب جاهزًا من صافرة البداية.</p>
            </li>
          </ol>
        </div>
      </section>

      <section id="owners" className="relative scroll-mt-24 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/stad-almadina.svg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-pitch-deep/80" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-white md:px-6">
          <h2 className="max-w-xl font-display text-3xl font-extrabold md:text-5xl">عندك ملعب؟ عبّيه حجوزات كل مساء.</h2>
          <p className="mt-4 max-w-lg text-base leading-8 text-white/80">
            أضف ملعبك على ميدان، حدّد الساعات والأسعار، واستقبل الحجوزات من الفرق في مدينتك.
          </p>
          <a
            href={`${OWNER_APP_URL}/signup`}
            className="mt-8 inline-flex min-h-14 items-center rounded-[12px] bg-gold px-6 text-base font-bold text-pitch-deep"
          >
            أضف ملعبك
          </a>
        </div>
      </section>
    </div>
  );
}
