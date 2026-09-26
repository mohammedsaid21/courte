"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarPlus, Clock, Unlock, Wallet } from "lucide-react";
import { toast } from "sonner";
import { BookingForm, type Draft } from "@/components/booking-calendar";
import { DateChips } from "@/components/date-chips";
import { EmptyState } from "@/components/empty-state";
import { HourSlot } from "@/components/hour-slot";
import { useVenue } from "@/components/venue-provider";
import { ButtonLink } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { BookingBrief, CalendarResponse, DashboardData, Venue, ownerApi } from "@/lib/api";
import { issueLabel, paymentLabel } from "@/lib/ar";
import { formatMoney, formatTime, sourceLabel, todayYmd } from "@/lib/utils";

export default function HomePage() {
  const { venue } = useVenue();
  const router = useRouter();
  const [date, setDate] = useState(todayYmd());
  const [data, setData] = useState<DashboardData | null>(null);
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  async function load(nextDate = date) {
    if (!venue) return;
    const [dash, grid] = await Promise.all([
      ownerApi.dashboard(venue.id, nextDate),
      ownerApi.calendar(venue.id, nextDate, nextDate),
    ]);
    setData(dash);
    setCalendar(grid);
  }

  useEffect(() => {
    if (!venue) return;
    void load(date).catch((error) => toast.error(error.message));
  }, [venue?.id, date]);

  if (!venue) return null;

  if (venue.resources.length === 0) {
    return (
      <EmptyState
        title="أضف أول ملعب"
        body="أنشئ مساحة قابلة للحجز، ثم افتح الجدول لبدء استقبال الحجوزات."
        href="/venue/resources"
        action="إضافة ملعب"
      />
    );
  }

  if (!data) return <div className="py-16 text-center text-text-muted">جاري تحميل اليوم…</div>;

  const availableHours = Math.max(0, data.today.availableHours - data.today.occupiedHours);
  const isToday = date === todayYmd();

  return (
    <div className="space-y-8">
      <PageHeader
        title={isToday ? "اليوم" : date}
        action={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/venue">إعداد الملعب</ButtonLink>
            <ButtonLink href="/calendar">
              <CalendarPlus size={16} />
              حجز جديد
            </ButtonLink>
          </div>
        }
      />

      <SetupChecklist venue={venue} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="حجوزات اليوم"
          value={String(data.today.bookings)}
          icon={<CalendarPlus size={16} />}
        />
        <Kpi
          label="إيراد اليوم"
          value={data.today.revenue.toFixed(0)}
          suffix="د.أ"
          hint={`${formatMoney(data.today.unpaidAmount)} غير مدفوع`}
          icon={<Wallet size={16} />}
        />
        <Kpi
          label="ساعات مشغولة"
          value={`${data.today.occupiedHours}س`}
          hint={`${data.today.occupancyRate}% من وقت الفتح`}
          icon={<Clock size={16} />}
          tone="amber"
        />
        <Kpi
          label="ساعات متاحة"
          value={`${availableHours}س`}
          hint={`${data.today.availableHours}س مفتوحة`}
          valueClass="text-brand-700"
          icon={<Unlock size={16} />}
          tone="green"
        />
      </div>

      {data.issues.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
          <div className="flex items-center gap-2 border-b border-amber-200 px-6 py-3">
            <AlertTriangle size={16} className="text-amber-700" />
            <h2 className="text-sm font-black uppercase tracking-wider text-amber-900">
              يحتاج مراجعة · {data.issues.length}
            </h2>
          </div>
          <div className="divide-y divide-amber-200/80">
            {data.issues.map((issue, index) => (
              <div key={`${issue.type}-${issue.bookingId ?? index}`} className="flex items-center justify-between gap-3 px-6 py-3">
                <p className="text-sm font-semibold text-amber-950">{issueLabel(issue.type)}</p>
                {issue.bookingId && (
                  <Link href={`/bookings/${issue.bookingId}`} className="text-xs font-black text-amber-800">
                    فتح
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <DateChips value={date} onChange={setDate} />

      {calendar?.resources.map((resource) => {
        const day = resource.days[0];
        if (!day) return null;
        return (
          <section key={resource.id} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <div className="h-8 w-3 rounded-full bg-brand" />
                <div>
                  <h2 className="text-lg font-black text-slate-900">{resource.name}</h2>
                  <p className="mt-0.5 text-xs font-semibold text-slate-400">
                    {day.closed ? "مغلق" : `${day.opensAt} – ${day.closesAt}`} · اضغط ساعة فارغة للحجز
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {day.closed || day.slots.length === 0 ? (
                <p className="text-sm text-slate-400">{day.closed ? "مغلق هذا اليوم." : "لا توجد ساعات معروضة."}</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
                  {day.slots.map((slot) => {
                    const booking = day.bookings.find((item) => item.start < slot.end && item.end > slot.start);
                    const blocked = Boolean(day.blocks.find((item) => item.start < slot.end && item.end > slot.start) || slot.status === "blocked");
                    if (booking) {
                      return (
                        <HourSlot
                          key={slot.start}
                          time={formatTime(slot.start)}
                          label={booking.customerName}
                          detail={`${formatTime(booking.end)} · ${paymentLabel(booking.paymentStatus)}`}
                          state={booking.status === "PENDING" ? "pending" : booking.source === "CUSTOMER" ? "customer" : "booked"}
                          onClick={() => router.push(`/bookings/${booking.id}`)}
                        />
                      );
                    }
                    if (blocked) {
                      return <HourSlot key={slot.start} time={formatTime(slot.start)} label="مغلق" state="blocked" />;
                    }
                    return (
                      <HourSlot
                        key={slot.start}
                        time={formatTime(slot.start)}
                        label="متاح"
                        detail={slot.priceAmount != null ? formatMoney(slot.priceAmount) : undefined}
                        state="available"
                        onClick={() =>
                          setDraft({
                            resourceId: resource.id,
                            resourceName: resource.name,
                            start: slot.start,
                            end: slot.end,
                            price: slot.priceAmount ?? 0,
                          })
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })}

      <div className="grid gap-6 lg:grid-cols-2">
        <BookingList
          title={isToday ? "حجوزات اليوم" : "حجوزات هذا اليوم"}
          empty="لا حجوزات هذا اليوم."
          items={data.todayBookings}
        />
        <BookingList
          title="غير مدفوع"
          empty="لا حجوزات غير مدفوعة خلال الأسبوع القادم."
          items={data.unpaid}
        />
        <BookingList title="القادم" empty="لا يوجد شيء قادم." items={data.upcoming} />
        <BookingList title="اكتمل مؤخراً" empty="لا حجوزات مكتملة بعد." items={data.completed} />
      </div>

      {draft && (
        <BookingForm
          venueId={venue.id}
          draft={draft}
          onClose={() => setDraft(null)}
          onSaved={async () => {
            setDraft(null);
            await load(date);
          }}
        />
      )}
    </div>
  );
}

function BookingList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: BookingBrief[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-black">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400">{empty}</p>
        ) : (
          items.map((item) => (
            <Link key={item.id} href={`/bookings/${item.id}`} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50">
              <div>
                <div className="font-extrabold text-slate-900">{item.customerName}</div>
                <div className="text-xs font-semibold text-slate-400">
                  {formatTime(item.startsAt)}–{formatTime(item.endsAt)} · {item.resourceName} · {sourceLabel(item.source)}
                </div>
              </div>
              <div className="text-end">
                <div className="text-sm font-black">{formatMoney(item.priceAmount)}</div>
                <div className="text-[11px] font-bold text-brand-700">{paymentLabel(item.paymentStatus)}</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

function SetupChecklist({ venue }: { venue: Venue }) {
  const items = [
    { done: venue.latitude != null && venue.longitude != null, label: "تحديد موقع الملعب على الخريطة" },
    { done: venue.photos.length > 0 || Boolean(venue.coverImageUrl), label: "رفع صور الملعب" },
    { done: Boolean(venue.nameEn?.trim() && venue.addressEn?.trim()), label: "النصوص بالعربية والإنجليزية" },
    {
      done: venue.resources.some((resource) => resource.size && resource.surface && resource.setting),
      label: "حجم الملعب (5 ضد 5 / 7 ضد 7 / 11 ضد 11) والمواصفات",
    },
  ];
  const remaining = items.filter((item) => !item.done);
  if (remaining.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-brand/40 bg-brand/10 shadow-sm">
      <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">أكمل إعداد الملعب</h2>
          <p className="mt-1 text-sm font-medium text-slate-600">
            هذه البيانات تظهر للزبائن: الموقع، الصور، الحجم، العشب، الإنارة، وأسعار الأوقات العادية والذروة والعطلة.
          </p>
          <ul className="mt-3 space-y-1 text-sm font-semibold text-slate-700">
            {items.map((item) => (
              <li key={item.label} className={item.done ? "text-slate-400 line-through" : ""}>
                {item.done ? "تم · " : "مطلوب · "}
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <ButtonLink href="/venue">فتح إعداد الملعب</ButtonLink>
      </div>
    </section>
  );
}

function Kpi({
  label,
  value,
  suffix,
  hint,
  icon,
  tone = "brand",
  valueClass,
}: {
  label: string;
  value: string;
  suffix?: string;
  hint?: string;
  icon: React.ReactNode;
  tone?: "brand" | "amber" | "green";
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</span>
        <div
          className={
            tone === "amber"
              ? "flex h-10 w-10 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600"
              : "flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-brand-light text-brand-700"
          }
        >
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-black text-slate-900 ${valueClass ?? ""}`}>{value}</span>
        {suffix && <span className="text-sm font-black text-brand-700">{suffix}</span>}
      </div>
      {hint && <p className="mt-1 text-xs font-semibold text-slate-400">{hint}</p>}
    </div>
  );
}
