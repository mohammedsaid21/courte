"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BOOKING_DURATIONS,
  COURT_SETTING_LABELS,
  COURT_SETTINGS,
  COURT_SIZE_LABELS,
  COURT_SIZES,
  COURT_SURFACE_LABELS,
  COURT_SURFACES,
  PRICING_RULE_NAMES,
  buildTierPricingRules,
  durationPayload,
} from "@courte/shared";
import { ChoicePills } from "@/components/choice-pills";
import { Button, Card, Field, Input } from "@/components/ui";
import { Resource, Venue, ownerApi } from "@/lib/api";
import Link from "next/link";

const sizeOptions = COURT_SIZES.map((value) => ({ value, label: COURT_SIZE_LABELS[value].ar }));
const surfaceOptions = COURT_SURFACES.map((value) => ({ value, label: COURT_SURFACE_LABELS[value].ar }));
const settingOptions = COURT_SETTINGS.map((value) => ({ value, label: COURT_SETTING_LABELS[value].ar }));
const durationOptions = BOOKING_DURATIONS.map((value) => ({
  value: String(value),
  label: value === 90 ? "ساعة ونصف" : "ساعة",
}));

export function CourtSettings({
  venue,
  onSaved,
}: {
  venue: Venue;
  onSaved: () => Promise<void>;
}) {
  if (venue.resources.length === 0) {
    return (
      <Card>
        <h2 className="text-lg font-black text-slate-900">مواصفات الملعب والأسعار</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          أضف ملعباً لتحديد الحجم (5 ضد 5 / 7 ضد 7 / 11 ضد 11) ومدة الحجز وأسعار الأوقات العادية والذروة والعطلة.
        </p>
        <Link
          href="/venue/resources"
          className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-black text-slate-900"
        >
          إضافة ملعب
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {venue.resources.map((resource) => (
        <ResourceSetup key={resource.id} resource={resource} onSaved={onSaved} />
      ))}
    </div>
  );
}

function ResourceSetup({
  resource,
  onSaved,
}: {
  resource: Resource;
  onSaved: () => Promise<void>;
}) {
  const [size, setSize] = useState<(typeof COURT_SIZES)[number]>(resource.size ?? "FIVE_V_FIVE");
  const [surface, setSurface] = useState<(typeof COURT_SURFACES)[number]>(resource.surface ?? "ARTIFICIAL_GRASS");
  const [setting, setSetting] = useState<(typeof COURT_SETTINGS)[number]>(resource.setting ?? "OUTDOOR");
  const [hasLights, setHasLights] = useState(resource.hasLights);
  const [duration, setDuration] = useState(resource.defaultDurationMinutes === 90 ? 90 : 60);
  const [regularPrice, setRegularPrice] = useState(50);
  const [peakPrice, setPeakPrice] = useState(70);
  const [peakStartsAt, setPeakStartsAt] = useState("16:00");
  const [weekendPrice, setWeekendPrice] = useState(80);
  const [hasPeak, setHasPeak] = useState(true);
  const [hasWeekend, setHasWeekend] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void ownerApi.pricing(resource.id).then((rules) => {
      const regular = rules.find((rule) => rule.name === PRICING_RULE_NAMES.REGULAR) ?? rules.find((rule) => rule.isDefault);
      const peak = rules.find((rule) => rule.name === PRICING_RULE_NAMES.PEAK);
      const weekend = rules.find((rule) => rule.name === PRICING_RULE_NAMES.WEEKEND);
      if (regular) setRegularPrice(regular.priceAmount);
      if (peak) {
        setHasPeak(true);
        setPeakPrice(peak.priceAmount);
        setPeakStartsAt(peak.startsAt);
      } else {
        setHasPeak(false);
      }
      if (weekend) {
        setHasWeekend(true);
        setWeekendPrice(weekend.priceAmount);
      } else {
        setHasWeekend(false);
      }
    });
  }, [resource.id]);

  const unit = duration === 90 ? "ساعة ونصف" : "ساعة";

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await ownerApi.updateResource(resource.id, {
        size,
        surface,
        setting,
        hasLights,
        ...durationPayload(duration),
      });
      await ownerApi.replacePricing(resource.id, {
        rules: buildTierPricingRules({
          regularPrice: Number(regularPrice),
          peakPrice: hasPeak ? Number(peakPrice) : null,
          peakStartsAt,
          weekendPrice: hasWeekend ? Number(weekendPrice) : null,
        }),
      });
      await onSaved();
      toast.success("تم حفظ المواصفات والأسعار");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-black text-slate-900">مواصفات {resource.name}</h2>
      <p className="mb-5 mt-1 text-sm font-medium text-slate-500">
        الحجم، نوع العشب، داخلي أو خارجي، الإنارة، مدة الحجز، والأسعار حسب الوقت.
      </p>
      <form className="space-y-5" onSubmit={save}>
        <Field label="مدة الحجز">
          <ChoicePills value={String(duration)} onChange={(value) => setDuration(Number(value))} options={durationOptions} />
        </Field>
        <Field label="حجم الملعب">
          <ChoicePills value={size} onChange={setSize} options={sizeOptions} />
        </Field>
        <Field label="العشب">
          <ChoicePills value={surface} onChange={setSurface} options={surfaceOptions} />
        </Field>
        <Field label="داخلي / خارجي">
          <ChoicePills value={setting} onChange={setSetting} options={settingOptions} />
        </Field>
        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <input type="checkbox" checked={hasLights} onChange={(event) => setHasLights(event.target.checked)} />
          إنارة ليلية
        </label>

        <div>
          <h3 className="text-base font-black text-slate-900">تحديد السعر حسب الوقت</h3>
          <p className="mb-3 mt-1 text-sm font-medium text-slate-500">السعر لكل {unit}.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={`أوقات عادية (₪ / ${unit})`}>
              <Input type="number" min={0} value={regularPrice} onChange={(e) => setRegularPrice(Number(e.target.value))} />
            </Field>
            <Field label={`أوقات الذروة (₪ / ${unit})`}>
              <Input type="number" min={0} value={peakPrice} onChange={(e) => setPeakPrice(Number(e.target.value))} disabled={!hasPeak} />
            </Field>
            <Field label="بداية الذروة">
              <Input type="time" value={peakStartsAt} onChange={(e) => setPeakStartsAt(e.target.value)} disabled={!hasPeak} />
            </Field>
            <Field label={`عطلة نهاية الأسبوع (₪ / ${unit})`}>
              <Input type="number" min={0} value={weekendPrice} onChange={(e) => setWeekendPrice(Number(e.target.value))} disabled={!hasWeekend} />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={hasPeak} onChange={(e) => setHasPeak(e.target.checked)} />
              سعر ذروة منفصل
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={hasWeekend} onChange={(e) => setHasWeekend(e.target.checked)} />
              سعر الجمعة والسبت
            </label>
          </div>
        </div>
        <Button disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ المواصفات والأسعار"}</Button>
      </form>
    </Card>
  );
}
