"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MessageCircle,
  Pencil,
  Phone,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Field, Input, Textarea } from "@/components/ui";
import { Booking, ownerApi } from "@/lib/api";
import { paymentLabel, statusLabel } from "@/lib/ar";
import {
  formatDate,
  formatDateLong,
  formatDuration,
  formatMoney,
  formatTime,
  paymentTone,
  sourceLabel,
  statusTone,
} from "@/lib/utils";

export default function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [priceAmount, setPriceAmount] = useState("");

  useEffect(() => {
    void params.then((value) => setId(value.id));
  }, [params]);

  async function load(bookingId: string) {
    const result = await ownerApi.booking(bookingId);
    setBooking(result);
    setNotes(result.notes ?? "");
    setStartsAt(toLocalInput(result.startsAt));
    setEndsAt(toLocalInput(result.endsAt));
    setPriceAmount(String(result.priceAmount));
  }

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void load(id)
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !booking) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  const cancelled = booking.status === "CANCELLED";
  const phoneDigits = booking.customer.phone.replace(/\D/g, "");
  const whatsappDigits = (booking.customer.whatsapp || booking.customer.phone).replace(/\D/g, "");

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      if (id) await load(id);
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث الحجز");
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={booking.customer.name}
        kicker="تفاصيل الحجز"
        action={
          <Link
            href="/bookings"
            className="inline-flex items-center gap-1.5 text-sm font-black text-slate-500 transition hover:text-brand-700"
          >
            <ArrowRight size={16} className="rotate-180" />
            كل الحجوزات
          </Link>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="bg-night p-6 text-white md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-xl font-black text-slate-900">
                {booking.customer.name.trim().charAt(0) || "؟"}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-brand-bright">{booking.resource.name}</p>
                <div className="mt-2 text-4xl font-black tabular-nums leading-none">
                  {formatTime(booking.startsAt)}–{formatTime(booking.endsAt)}
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-300">{formatDateLong(booking.startsAt)}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{formatDuration(booking.durationMinutes)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge>
              <Badge tone={paymentTone(booking.paymentStatus)}>{paymentLabel(booking.paymentStatus)}</Badge>
              <Badge tone={booking.source === "CUSTOMER" ? "green" : "blue"}>{sourceLabel(booking.source)}</Badge>
              {booking.recurringSeriesId && <Badge tone="violet">متكرر</Badge>}
            </div>
          </div>

          <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold text-slate-400">السعر</p>
              <p className="mt-1 text-3xl font-black text-brand-bright">{formatMoney(booking.priceAmount)}</p>
            </div>
            <div className="sm:text-end">
              <p className="text-xs font-bold text-slate-400">المبلغ المستلم</p>
              <p className="mt-1 text-2xl font-black">{formatMoney(booking.paidAmount)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <ContactCard
            icon={<Phone size={18} />}
            label="الهاتف"
            value={booking.customer.phone}
            href={`tel:${phoneDigits}`}
            actionLabel="اتصال"
          />
          <ContactCard
            icon={<MessageCircle size={18} />}
            label="واتساب"
            value={booking.customer.whatsapp || "—"}
            href={booking.customer.whatsapp || booking.customer.phone ? `https://wa.me/${whatsappDigits}` : undefined}
            actionLabel="رسالة"
          />
          <DetailCard icon={<Calendar size={18} />} label="التاريخ" value={formatDate(booking.startsAt)} />
          <DetailCard icon={<Clock size={18} />} label="المدة" value={formatDuration(booking.durationMinutes)} />
          {booking.notes && (
            <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">ملاحظات</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-800">{booking.notes}</p>
            </div>
          )}
        </div>
      </section>

      {editing && (
        <section className="rounded-2xl border border-brand/30 bg-brand-light/30 p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900">
            <Pencil size={18} />
            تعديل الحجز
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="البداية">
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </Field>
            <Field label="النهاية">
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </Field>
            <Field label="السعر (د.أ)">
              <Input type="number" value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="ملاحظات">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button
                onClick={() =>
                  void run(
                    () =>
                      ownerApi.updateBooking(booking.id, {
                        startsAt: new Date(startsAt).toISOString(),
                        endsAt: new Date(endsAt).toISOString(),
                        priceAmount: Number(priceAmount),
                        notes: notes || null,
                        allowOutsideHours: true,
                      }),
                    "تم تحديث الحجز",
                  ).then(() => setEditing(false))
                }
              >
                حفظ التغييرات
              </Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>إلغاء</Button>
            </div>
          </div>
        </section>
      )}

      {!cancelled && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-400">إجراءات</h2>
          <div className="flex flex-wrap gap-2">
            {!editing && (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                <Pencil size={16} />
                تعديل
              </Button>
            )}
            {booking.paymentStatus !== "PAID" && (
              <Button onClick={() => void run(() => ownerApi.markPaid(booking.id), "تم تسجيل الدفع")}>
                <Wallet size={16} />
                تسجيل مدفوع
              </Button>
            )}
            {booking.status !== "COMPLETED" && (
              <Button
                variant="secondary"
                onClick={() =>
                  void run(() => ownerApi.updateBooking(booking.id, { status: "COMPLETED" }), "تم وضع الحجز مكتملًا")
                }
              >
                <CheckCircle2 size={16} />
                مكتمل
              </Button>
            )}
            <Button
              variant="danger"
              onClick={() =>
                void run(async () => {
                  await ownerApi.updateBooking(booking.id, { status: "CANCELLED" });
                  router.push("/calendar");
                }, "تم إلغاء الحجز — الساعة متاحة مجددًا")
              }
            >
              <XCircle size={16} />
              إلغاء الحجز
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function ContactCard({
  icon,
  label,
  value,
  href,
  actionLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-0.5 truncate font-bold text-slate-900">{value}</p>
        </div>
      </div>
      {href && value !== "—" && (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noreferrer" : undefined}
          className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-black text-slate-900 hover:opacity-90"
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}

function DetailCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">{icon}</div>
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function toLocalInput(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
