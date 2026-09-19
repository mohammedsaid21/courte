"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { useVenue } from "@/components/venue-provider";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { ownerApi } from "@/lib/api";

export default function BusinessRulesPage() {
  const { venue, refresh } = useVenue();
  const [form, setForm] = useState({
    defaultDurationMinutes: 60,
    minAdvanceHours: 0,
    maxAdvanceDays: 90,
    cancellationHours: 0,
    cancellationPolicy: "",
  });

  useEffect(() => {
    if (!venue) return;
    setForm({
      defaultDurationMinutes: venue.defaultDurationMinutes,
      minAdvanceHours: venue.minAdvanceHours,
      maxAdvanceDays: venue.maxAdvanceDays,
      cancellationHours: venue.cancellationHours,
      cancellationPolicy: venue.cancellationPolicy ?? "",
    });
  }, [venue]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!venue) return;
    await ownerApi.updateVenue(venue.id, {
      ...form,
      cancellationPolicy: form.cancellationPolicy || null,
    });
    await refresh();
    toast.success("تم حفظ قواعد الحجز");
  }

  if (!venue) return null;

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <Card>
        <h2 className="text-lg font-black text-slate-900">كيف يحجز الزبائن</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          هذه القواعد تنطبق على حجوزات الزبائن القادمة. يمكنك ما زلت تسجيل الحجوزات اليدوية من الجدول.
        </p>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="text-xs font-black text-slate-400">المدة الافتراضية</div>
          <div className="mt-2 text-4xl font-black text-slate-900">{form.defaultDurationMinutes}<span className="ms-1 text-base text-slate-400">د</span></div>
          <div className="mt-4">
            <Field label="دقائق">
              <Input type="number" value={form.defaultDurationMinutes} onChange={(e) => setForm({ ...form, defaultDurationMinutes: Number(e.target.value) })} />
            </Field>
          </div>
        </Card>
        <Card>
          <div className="text-xs font-black text-slate-400">أقل مهلة</div>
          <div className="mt-2 text-4xl font-black text-slate-900">{form.minAdvanceHours}<span className="ms-1 text-base text-slate-400">ساعة</span></div>
          <div className="mt-4">
            <Field label="ساعات قبل البداية">
              <Input type="number" value={form.minAdvanceHours} onChange={(e) => setForm({ ...form, minAdvanceHours: Number(e.target.value) })} />
            </Field>
          </div>
        </Card>
        <Card>
          <div className="text-xs font-black text-slate-400">نافذة الحجز</div>
          <div className="mt-2 text-4xl font-black text-slate-900">{form.maxAdvanceDays}<span className="ms-1 text-base text-slate-400">يوم</span></div>
          <div className="mt-4">
            <Field label="كم يوماً مسبقاً">
              <Input type="number" value={form.maxAdvanceDays} onChange={(e) => setForm({ ...form, maxAdvanceDays: Number(e.target.value) })} />
            </Field>
          </div>
        </Card>
        <Card>
          <div className="text-xs font-black text-slate-400">إشعار الإلغاء</div>
          <div className="mt-2 text-4xl font-black text-slate-900">{form.cancellationHours}<span className="ms-1 text-base text-slate-400">ساعة</span></div>
          <div className="mt-4">
            <Field label="ساعات قبل البداية">
              <Input type="number" value={form.cancellationHours} onChange={(e) => setForm({ ...form, cancellationHours: Number(e.target.value) })} />
            </Field>
          </div>
        </Card>
      </div>
      <Card>
        <Field label="سياسة الإلغاء التي تظهر للزبائن">
          <Textarea value={form.cancellationPolicy} onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })} placeholder="استرداد كامل إذا أُلغي قبل 6 ساعات." />
        </Field>
        <Button className="mt-4" size="lg">حفظ القواعد</Button>
      </Card>
    </form>
  );
}
