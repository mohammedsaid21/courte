"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { ResourcePills } from "@/components/page-header";
import { useVenue } from "@/components/venue-provider";
import { Button, Card, Input } from "@/components/ui";
import { ownerApi } from "@/lib/api";
import { weekdayLabel } from "@/lib/utils";

type Hour = { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean };

const defaultHours = (): Hour[] =>
  Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    opensAt: "08:00",
    closesAt: "23:00",
    isClosed: false,
  }));

export default function HoursPage() {
  const { venue } = useVenue();
  const [resourceId, setResourceId] = useState("");
  const [hours, setHours] = useState<Hour[]>(defaultHours());

  useEffect(() => {
    if (!venue?.resources[0]) return;
    setResourceId(venue.resources[0].id);
  }, [venue?.id]);

  useEffect(() => {
    const resource = venue?.resources.find((item) => item.id === resourceId);
    if (resource?.operatingHours?.length) {
      setHours([...resource.operatingHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
      return;
    }
    if (resourceId && venue) {
      void ownerApi.resources(venue.id).then((resources) => {
        const match = resources.find((item) => item.id === resourceId);
        setHours(
          match?.operatingHours?.length
            ? [...match.operatingHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
            : defaultHours(),
        );
      });
    }
  }, [resourceId, venue]);

  if (!venue) return null;

  if (venue.resources.length === 0) {
    return (
      <EmptyState
        title="أضف أول ملعب"
        body="تُحدد ساعات العمل لكل مساحة."
        href="/venue/resources"
        action="إضافة ملعب"
      />
    );
  }

  return (
    <Card>
      <h2 className="text-lg font-black text-slate-900">ساعات الأسبوع</h2>
      <p className="mb-5 mt-1 text-sm font-medium text-slate-500">
        الزبائن يحجزون داخل هذه الساعات فقط. الأيام المغلقة تبقى فارغة في الجدول.
      </p>
      <ResourcePills items={venue.resources} value={resourceId} onChange={setResourceId} />
      {venue.resources.length === 1 && (
        <div className="mb-4 text-sm font-black text-slate-700">{venue.resources[0].name}</div>
      )}
      <div className="mt-4 space-y-2">
        {hours.map((hour, index) => (
          <div
            key={hour.dayOfWeek}
            className={`grid items-center gap-3 rounded-2xl border p-4 sm:grid-cols-[140px_1fr_1fr_auto] ${hour.isClosed ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"}`}
          >
            <div>
              <div className="text-base font-black text-slate-900">{weekdayLabel(hour.dayOfWeek)}</div>
              <div className="text-xs font-bold text-slate-400">{hour.isClosed ? "مغلق" : `${hour.opensAt} – ${hour.closesAt}`}</div>
            </div>
            <Input
              disabled={hour.isClosed}
              value={hour.opensAt}
              onChange={(e) => setHours(hours.map((item, i) => i === index ? { ...item, opensAt: e.target.value } : item))}
            />
            <Input
              disabled={hour.isClosed}
              value={hour.closesAt}
              onChange={(e) => setHours(hours.map((item, i) => i === index ? { ...item, closesAt: e.target.value } : item))}
            />
            <button
              type="button"
              onClick={() => setHours(hours.map((item, i) => i === index ? { ...item, isClosed: !item.isClosed } : item))}
              className={`min-h-11 rounded-xl px-4 text-sm font-black ${hour.isClosed ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-500"}`}
            >
              {hour.isClosed ? "مغلق" : "مفتوح"}
            </button>
          </div>
        ))}
      </div>
      <Button
        className="mt-5"
        size="lg"
        onClick={async () => {
          await ownerApi.replaceHours(resourceId, hours);
          toast.success("تم حفظ الساعات");
        }}
      >
        حفظ الساعات
      </Button>
    </Card>
  );
}
