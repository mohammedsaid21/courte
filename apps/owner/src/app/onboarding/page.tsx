"use client";

import { WEST_BANK_CITIES } from "@courte/shared";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { CatalogItem, ownerApi } from "@/lib/api";
import { CITY_AR, catalogName } from "@/lib/ar";
import { createClient } from "@/lib/supabase/client";
import { setStoredVenueId } from "@/lib/venue-storage";

const defaultHours = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  opensAt: "08:00",
  closesAt: "23:00",
  isClosed: false,
}));

export default function OnboardingPage() {
  const router = useRouter();
  const [types, setTypes] = useState<CatalogItem[]>([]);
  const [amenities, setAmenities] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "Ramallah",
    address: "",
    phone: "",
    whatsapp: "",
    description: "",
    venueTypeId: "",
    amenityIds: [] as string[],
    resourceName: "ملعب 1",
    duration: 60,
    interval: 60,
    dayPrice: 30,
    eveningPrice: 40,
  });

  useEffect(() => {
    void (async () => {
      const session = await createClient().auth.getSession();
      if (!session.data.session) {
        router.replace("/signup");
        return;
      }
      const [venueTypes, amenityList] = await Promise.all([ownerApi.venueTypes(), ownerApi.amenities()]);
      setTypes(venueTypes);
      setAmenities(amenityList);
      setForm((current) => ({ ...current, venueTypeId: venueTypes[0]?.id ?? "" }));
    })();
  }, [router]);

  function toggleAmenity(id: string) {
    setForm((current) => ({
      ...current,
      amenityIds: current.amenityIds.includes(id)
        ? current.amenityIds.filter((item) => item !== id)
        : [...current.amenityIds, id],
    }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const venue = await ownerApi.onboard({
        venue: {
          name: form.name,
          city: form.city,
          address: form.address,
          phone: form.phone,
          whatsapp: form.whatsapp || null,
          description: form.description || null,
          venueTypeIds: [form.venueTypeId],
          amenityIds: form.amenityIds,
          photoUrls: [],
        },
        resource: {
          name: form.resourceName,
          venueTypeId: form.venueTypeId,
          defaultDurationMinutes: form.duration,
          slotIntervalMinutes: form.interval,
          minDurationMinutes: Math.min(30, form.duration),
          maxDurationMinutes: Math.max(form.duration * 2, 120),
        },
        hours: defaultHours,
        defaultPrice: Number(form.dayPrice),
        peakPrice: Number(form.eveningPrice),
        peakStartsAt: "16:00",
      });
      setStoredVenueId(venue.id);
      toast.success("الملعب جاهز. يمكنك البدء بالحجز من الجدول.");
      router.replace("/calendar");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إنشاء الملعب");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <div className="text-2xl font-black italic tracking-wider text-slate-900">COURTE<span className="text-brand">.</span></div>
        <h1 className="mt-4 text-3xl font-black text-slate-900">جهّز ملعبك</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          هذا يكفي لبدء استقبال الحجوزات اليوم. يمكنك إضافة ملاعب وساعات وأسعار لاحقاً.
        </p>
      </div>
      <form className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={onSubmit}>
        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم الملعب">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="المدينة">
            <Select
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            >
              {WEST_BANK_CITIES.map((city) => (
                <option key={city} value={city}>
                  {CITY_AR[city] ?? city}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="العنوان">
            <Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="الهاتف">
            <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="WhatsApp">
            <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </Field>
          <Field label="الرياضة">
            <Select
              value={form.venueTypeId}
              onChange={(e) => setForm({ ...form, venueTypeId: e.target.value })}
            >
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {catalogName(type)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="الوصف">
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
        </section>
        <section>
          <div className="mb-3 text-lg font-black text-slate-900">الخدمات</div>
          <p className="mb-4 text-sm font-medium text-slate-500">اختر ما يقدّمه الملعب للزبائن.</p>
          <div className="flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <button
                type="button"
                key={amenity.id}
                onClick={() => toggleAmenity(amenity.id)}
                className={`rounded-full px-4 py-2 text-sm font-black ${form.amenityIds.includes(amenity.id) ? "bg-brand text-slate-900 shadow-brand" : "bg-slate-100 text-slate-600"}`}
              >
                {catalogName(amenity)}
              </button>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-1 text-lg font-black text-slate-900">أول ملعب والأسعار</h2>
          <p className="mb-4 text-sm font-medium text-slate-500">يمكنك إضافة ملاعب وأسعار مسائية بعد فتح لوحة التحكم.</p>
          <div className="grid gap-4 sm:grid-cols-2">
          <Field label="أول مساحة قابلة للحجز">
            <Input required value={form.resourceName} onChange={(e) => setForm({ ...form, resourceName: e.target.value })} />
          </Field>
          <Field label="المدة الافتراضية (دقائق)">
            <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
          </Field>
          <Field label="سعر النهار حتى 16:00 (د.أ)">
            <Input type="number" value={form.dayPrice} onChange={(e) => setForm({ ...form, dayPrice: Number(e.target.value) })} />
          </Field>
          <Field label="سعر المساء (د.أ)">
            <Input type="number" value={form.eveningPrice} onChange={(e) => setForm({ ...form, eveningPrice: Number(e.target.value) })} />
          </Field>
          </div>
        </section>
        <Button className="w-full sm:w-auto" size="lg" disabled={loading}>{loading ? "جاري الحفظ…" : "افتح لوحة التحكم"}</Button>
      </form>
      </div>
    </div>
  );
}
