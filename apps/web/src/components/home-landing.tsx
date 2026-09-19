"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarCheck, CircleDot, MapPin, Star, Timer, Trophy, X } from "lucide-react";
import { COURT_SIZES, HOME_CITIES } from "@/lib/ar";
import { BOOKING_TIMES, FEATURED_COURTS, type FeaturedCourt } from "@/lib/featured-courts";
import { OWNER_APP_URL, todayYmd } from "@/lib/utils";

export function HomeLanding() {
  const [city, setCity] = useState("");
  const [size, setSize] = useState("");
  const [date, setDate] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<FeaturedCourt | null>(null);

  const courts = useMemo(() => {
    return FEATURED_COURTS.filter((court) => {
      const sizeOk = filter === "all" || court.size === filter;
      const cityOk = !city || court.city === city;
      const searchSizeOk = !size || court.size === size;
      return sizeOk && cityOk && searchSizeOk;
    });
  }, [filter, city, size]);

  function search(event: FormEvent) {
    event.preventDefault();
    setFilter(size || "all");
    document.getElementById("venues")?.scrollIntoView({ behavior: "smooth" });
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
            className="glass reveal-3 mt-6 grid gap-2 rounded-[16px] p-2.5 sm:mt-8 sm:gap-3 sm:p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
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
              <span className="mb-1 block text-xs font-bold text-pitch">التاريخ</span>
              <input
                type="date"
                min={todayYmd()}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-11 w-full bg-transparent text-sm font-bold outline-none"
                aria-label="التاريخ"
              />
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
              {[{ id: "all", label: "الكل" }, ...COURT_SIZES].map((item) => {
                const active = filter === item.id;
                return (
                  <button
                    key={item.id}
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
              {courts.length === 0 ? (
                <p className="text-sm font-medium text-text-muted sm:col-span-2 lg:col-span-3">لا يوجد ملعب بهذه الفلاتر. جرّب مدينة أو حجمًا آخر.</p>
              ) : (
                courts.map((court) => (
                  <article key={court.id} className="overflow-hidden rounded-[12px] border border-white/80 bg-white shadow-glass">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={court.image} alt={court.name} className="aspect-[16/10] w-full object-cover" />
                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-xl font-extrabold">{court.name}</h3>
                          <p className="mt-1 flex items-center gap-1 text-sm font-medium text-text-muted">
                            <MapPin size={14} /> {court.city}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-gold">
                          <Star size={16} fill="currentColor" />
                          {court.rating}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-bold text-pitch">
                        <span className="rounded-full bg-pitch-light px-3 py-1">{court.surface}</span>
                        <span className="rounded-full bg-pitch-light px-3 py-1">{court.sizeLabel}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-display text-lg font-extrabold">{court.price} ₪<span className="text-sm font-bold text-text-muted">/ساعة</span></div>
                        <button
                          type="button"
                          onClick={() => setSelected(court)}
                          className="min-h-11 rounded-[12px] bg-pitch px-4 text-sm font-bold text-white hover:bg-pitch-dark"
                        >
                          عرض الأوقات
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
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

      <BookingModal court={selected} defaultDate={date} onClose={() => setSelected(null)} />
    </div>
  );
}

function BookingModal({
  court,
  defaultDate,
  onClose,
}: {
  court: FeaturedCourt | null;
  defaultDate: string;
  onClose: () => void;
}) {
  const [time, setTime] = useState("");
  const [bookDate, setBookDate] = useState(defaultDate || todayYmd());
  const [done, setDone] = useState(false);

  useEffect(() => {
    setTime("");
    setDone(false);
    setBookDate(defaultDate || todayYmd());
  }, [court, defaultDate]);

  useEffect(() => {
    if (!court) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [court, onClose]);

  if (!court) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-pitch-deep/55 p-3 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        className="glass w-full max-w-lg overflow-hidden rounded-[12px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={court.image} alt={court.name} className="h-44 w-full object-cover" />
          <button
            type="button"
            onClick={onClose}
            className="absolute start-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          {done ? (
            <div className="py-8 text-center">
              <CircleDot className="mx-auto text-pitch" size={36} />
              <h2 id="booking-title" className="mt-4 font-display text-3xl font-extrabold">
                تم تأكيد حجزك!
              </h2>
              <p className="mt-2 text-sm text-text-muted">
                {court.name} · {bookDate} · {time}
              </p>
              <button type="button" onClick={onClose} className="mt-6 min-h-12 rounded-[12px] bg-pitch px-6 font-bold text-white">
                إغلاق
              </button>
            </div>
          ) : (
            <>
              <h2 id="booking-title" className="font-display text-2xl font-extrabold">
                {court.name}
              </h2>
              <p className="mt-1 text-sm font-medium text-text-muted">
                {court.city} · {court.sizeLabel} · {court.price} ₪/ساعة
              </p>
              <label className="mt-5 block">
                <span className="mb-1 block text-xs font-bold text-pitch">التاريخ</span>
                <input
                  type="date"
                  min={todayYmd()}
                  value={bookDate}
                  onChange={(event) => setBookDate(event.target.value)}
                  className="h-12 w-full rounded-[12px] border border-border bg-white px-3 text-sm font-bold"
                />
              </label>
              <p className="mt-4 text-xs font-bold text-pitch">الوقت</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {BOOKING_TIMES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTime(item)}
                    className={`min-h-12 rounded-[12px] text-sm font-bold ${
                      time === item ? "bg-pitch text-white" : "bg-pitch-light text-pitch"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!time || !bookDate}
                onClick={() => setDone(true)}
                className="mt-5 min-h-14 w-full rounded-[12px] bg-pitch font-bold text-white disabled:opacity-50"
              >
                تأكيد الحجز
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
