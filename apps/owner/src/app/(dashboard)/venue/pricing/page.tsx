"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { buildTierPricingRules, PRICING_RULE_NAMES } from "@courte/shared";
import { EmptyState } from "@/components/empty-state";
import { ResourcePills } from "@/components/page-header";
import { useVenue } from "@/components/venue-provider";
import { Button, Card, Field, Input } from "@/components/ui";
import { PricingRule, ownerApi } from "@/lib/api";
import { formatMoney } from "@/lib/utils";

export default function PricingPage() {
  const { venue } = useVenue();
  const [resourceId, setResourceId] = useState("");
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [regularPrice, setRegularPrice] = useState(50);
  const [peakPrice, setPeakPrice] = useState(70);
  const [peakStartsAt, setPeakStartsAt] = useState("16:00");
  const [weekendPrice, setWeekendPrice] = useState(80);
  const [hasPeak, setHasPeak] = useState(true);
  const [hasWeekend, setHasWeekend] = useState(true);

  async function load(id: string) {
    const next = await ownerApi.pricing(id);
    setRules(next);
    const regular = next.find((rule) => rule.name === PRICING_RULE_NAMES.REGULAR) ?? next.find((rule) => rule.isDefault);
    const peak = next.find((rule) => rule.name === PRICING_RULE_NAMES.PEAK);
    const weekend = next.find((rule) => rule.name === PRICING_RULE_NAMES.WEEKEND);
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
  }

  useEffect(() => {
    if (!venue?.resources[0]) return;
    setResourceId(venue.resources[0].id);
    void load(venue.resources[0].id);
  }, [venue?.id]);

  const grouped = useMemo(() => {
    const weekend = rules.filter((rule) => rule.name === PRICING_RULE_NAMES.WEEKEND);
    const rest = rules.filter((rule) => rule.name !== PRICING_RULE_NAMES.WEEKEND);
    return [
      ...rest,
      weekend[0]
        ? {
            ...weekend[0],
            id: weekend.map((item) => item.id).join(","),
            startsAt: "الجمعة والسبت",
            endsAt: "",
          }
        : null,
    ].filter(Boolean) as PricingRule[];
  }, [rules]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextRules = buildTierPricingRules({
      regularPrice: Number(regularPrice),
      peakPrice: hasPeak ? Number(peakPrice) : null,
      peakStartsAt,
      weekendPrice: hasWeekend ? Number(weekendPrice) : null,
    });
    await ownerApi.replacePricing(resourceId, { rules: nextRules });
    await load(resourceId);
    toast.success("تم حفظ الأسعار");
  }

  if (!venue) return null;
  if (venue.resources.length === 0) {
    return (
      <EmptyState
        title="أضف أول ملعب"
        body="حدد سعر الأوقات العادية والذروة وعطلة نهاية الأسبوع لكل مساحة."
        href="/venue/resources"
        action="إضافة ملعب"
      />
    );
  }

  const resource = venue.resources.find((item) => item.id === resourceId) ?? venue.resources[0];
  const unit = resource.defaultDurationMinutes === 90 ? "ساعة ونصف" : "ساعة";

  return (
    <div className="space-y-4">
      <ResourcePills
        items={venue.resources}
        value={resourceId}
        onChange={(id) => {
          setResourceId(id);
          void load(id);
        }}
      />
      {venue.resources.length === 1 && (
        <div className="text-sm font-black text-slate-700">{venue.resources[0].name}</div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {grouped.map((rule) => (
          <Card key={rule.id}>
            <div className="text-xs font-black uppercase tracking-wider text-slate-400">
              {rule.name === PRICING_RULE_NAMES.REGULAR
                ? "أوقات عادية"
                : rule.name === PRICING_RULE_NAMES.PEAK
                  ? "أوقات الذروة"
                  : rule.name === PRICING_RULE_NAMES.WEEKEND
                    ? "عطلة نهاية الأسبوع"
                    : rule.name}
            </div>
            <div className="mt-3 text-4xl font-black text-slate-900">{formatMoney(rule.priceAmount)}</div>
            <div className="mt-1 text-sm font-bold text-slate-500">
              {rule.name === PRICING_RULE_NAMES.WEEKEND
                ? "الجمعة والسبت"
                : `${rule.startsAt}${rule.endsAt ? ` – ${rule.endsAt}` : ""}`}
              {" "}· لكل {unit}
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="text-lg font-black text-slate-900">تحديد السعر حسب الوقت</h2>
        <p className="mb-5 mt-1 text-sm font-medium text-slate-500">
          السعر لكل {unit}. يمكن تمييز أوقات الذروة وعطلة نهاية الأسبوع.
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={`أوقات عادية (₪ / ${unit})`}>
              <Input type="number" min={0} value={regularPrice} onChange={(e) => setRegularPrice(Number(e.target.value))} />
            </Field>
            <Field label="بداية الذروة">
              <Input type="time" value={peakStartsAt} onChange={(e) => setPeakStartsAt(e.target.value)} disabled={!hasPeak} />
            </Field>
            <Field label={`أوقات الذروة (₪ / ${unit})`}>
              <Input type="number" min={0} value={peakPrice} onChange={(e) => setPeakPrice(Number(e.target.value))} disabled={!hasPeak} />
            </Field>
            <Field label={`عطلة نهاية الأسبوع (₪ / ${unit})`}>
              <Input type="number" min={0} value={weekendPrice} onChange={(e) => setWeekendPrice(Number(e.target.value))} disabled={!hasWeekend} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={hasPeak} onChange={(e) => setHasPeak(e.target.checked)} />
              سعر ذروة منفصل
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={hasWeekend} onChange={(e) => setHasWeekend(e.target.checked)} />
              سعر الجمعة والسبت
            </label>
          </div>
          <Button>حفظ الأسعار</Button>
        </form>
      </Card>
    </div>
  );
}
