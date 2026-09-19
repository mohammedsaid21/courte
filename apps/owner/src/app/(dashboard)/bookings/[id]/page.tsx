"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    void load(id).catch((error) => toast.error(error.message));
  }, [id]);

  if (!booking) {
    return <div className="py-16 text-center text-text-muted">Loading booking…</div>;
  }

  const cancelled = booking.status === "CANCELLED";

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      if (id) await load(id);
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update booking");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={booking.customer.name}
        kicker="حجز"
        action={
          <Link href="/bookings" className="text-sm font-black text-slate-500 hover:text-brand">
            كل الحجوزات
          </Link>
        }
      />

      <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
        <div className="text-xs font-black uppercase tracking-widest text-brand-bright">{booking.resource.name}</div>
        <div className="mt-2 text-4xl font-black tabular-nums">
          {formatTime(booking.startsAt)}–{formatTime(booking.endsAt)}
        </div>
        <div className="mt-1 text-sm font-semibold text-slate-300">{formatDateLong(booking.startsAt)}</div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge>
          <Badge tone={paymentTone(booking.paymentStatus)}>{paymentLabel(booking.paymentStatus)}</Badge>
          <Badge tone={booking.source === "CUSTOMER" ? "green" : "blue"}>{sourceLabel(booking.source)}</Badge>
          {booking.recurringSeriesId && <Badge tone="violet">متكرر</Badge>}
        </div>
        <div className="mt-6 flex items-end justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400">السعر</div>
            <div className="text-2xl font-black text-brand-bright">{formatMoney(booking.priceAmount)}</div>
          </div>
          <div className="text-end">
            <div className="text-xs font-bold text-slate-400">مدفوع</div>
            <div className="text-lg font-black">{formatMoney(booking.paidAmount)}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <Detail label="الهاتف" value={booking.customer.phone} />
        <Detail label="واتساب" value={booking.customer.whatsapp || "—"} />
        <Detail label="المدة" value={formatDuration(booking.durationMinutes)} />
        <Detail label="التاريخ" value={formatDate(booking.startsAt)} />
        {booking.notes && <div className="sm:col-span-2"><Detail label="ملاحظات" value={booking.notes} /></div>}
      </div>

      {editing && (
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          <Field label="Starts">
            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </Field>
          <Field label="Ends">
            <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </Field>
          <Field label="Price">
            <Input type="number" value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </div>
          <div className="flex gap-2">
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
                  "Booking updated",
                ).then(() => setEditing(false))
              }
            >
              Save changes
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {!cancelled && (
        <div className="flex flex-wrap gap-2">
          {!editing && <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>}
          {booking.paymentStatus !== "PAID" && (
            <Button onClick={() => void run(() => ownerApi.markPaid(booking.id), "Marked as paid")}>
              Mark as paid
            </Button>
          )}
          {booking.status !== "COMPLETED" && (
            <Button
              variant="secondary"
              onClick={() => void run(() => ownerApi.updateBooking(booking.id, { status: "COMPLETED" }), "Marked as completed")}
            >
              Mark as completed
            </Button>
          )}
          <Button
            variant="danger"
            onClick={() =>
              void run(async () => {
                await ownerApi.updateBooking(booking.id, { status: "CANCELLED" });
                router.push("/calendar");
              }, "Booking cancelled. The slot is free again.")
            }
          >
            Cancel booking
          </Button>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-base font-bold text-slate-900">{value}</div>
    </div>
  );
}

function toLocalInput(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
