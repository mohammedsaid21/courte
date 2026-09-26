"use client";

import { SPEC_AMENITY_SLUGS, WEST_BANK_CITIES } from "@courte/shared";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CourtSettings } from "@/components/court-settings";
import { MapPicker } from "@/components/map-picker";
import { useVenue } from "@/components/venue-provider";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { uploadVenuePhoto } from "@/lib/upload-venue-photo";
import { CatalogItem, ownerApi } from "@/lib/api";
import { CITY_AR, catalogName } from "@/lib/ar";
import { CUSTOMER_SITE_URL } from "@/lib/utils";

export default function VenueProfilePage() {
  const { venue, refresh, replaceVenue } = useVenue();
  const [types, setTypes] = useState<CatalogItem[]>([]);
  const [amenities, setAmenities] = useState<CatalogItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    nameEn: "",
    city: "",
    address: "",
    addressEn: "",
    phone: "",
    whatsapp: "",
    description: "",
    descriptionEn: "",
    latitude: "",
    longitude: "",
    coverImageUrl: "",
    photoUrls: [] as string[],
    venueTypeIds: [] as string[],
    amenityIds: [] as string[],
    isActive: true,
    acceptsOnlineBooking: true,
  });

  const extraAmenities = useMemo(
    () => amenities.filter((item) => !(SPEC_AMENITY_SLUGS as readonly string[]).includes(item.slug)),
    [amenities],
  );

  useEffect(() => {
    void Promise.all([ownerApi.venueTypes(), ownerApi.amenities()]).then(([venueTypes, amenityList]) => {
      setTypes(venueTypes);
      setAmenities(amenityList);
    });
  }, []);

  useEffect(() => {
    if (!venue || uploading) return;
    setForm({
      name: venue.name,
      nameEn: venue.nameEn ?? "",
      city: venue.city,
      address: venue.address,
      addressEn: venue.addressEn ?? "",
      phone: venue.phone,
      whatsapp: venue.whatsapp ?? "",
      description: venue.description ?? "",
      descriptionEn: venue.descriptionEn ?? "",
      latitude: venue.latitude != null ? String(venue.latitude) : "",
      longitude: venue.longitude != null ? String(venue.longitude) : "",
      coverImageUrl: venue.coverImageUrl ?? "",
      photoUrls: venue.photos.map((photo) => photo.url),
      venueTypeIds: venue.types.map((item) => item.id),
      amenityIds: venue.amenities.map((item) => item.id),
      isActive: venue.isActive,
      acceptsOnlineBooking: venue.acceptsOnlineBooking,
    });
  }, [venue, uploading]);

  function applyVenuePhotos(updated: { coverImageUrl: string | null; photos: { url: string }[] }) {
    setForm((current) => ({
      ...current,
      coverImageUrl: updated.coverImageUrl ?? "",
      photoUrls: updated.photos.map((photo) => photo.url),
    }));
  }

  async function persistPhotos(coverImageUrl: string, photoUrls: string[]) {
    if (!venue) return;
    const updated = await ownerApi.updateVenue(venue.id, {
      coverImageUrl: coverImageUrl || null,
      photoUrls,
    });
    replaceVenue(updated);
    applyVenuePhotos(updated);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!venue) return;
    await ownerApi.updateVenue(venue.id, {
      name: form.name,
      nameEn: form.nameEn || null,
      city: form.city,
      address: form.address,
      addressEn: form.addressEn || null,
      phone: form.phone,
      whatsapp: form.whatsapp || null,
      description: form.description || null,
      descriptionEn: form.descriptionEn || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      coverImageUrl: form.coverImageUrl || null,
      photoUrls: form.photoUrls,
      venueTypeIds: form.venueTypeIds,
      amenityIds: form.amenityIds,
      isActive: form.isActive,
      acceptsOnlineBooking: form.acceptsOnlineBooking,
    });
    await refresh();
    toast.success("تم حفظ بيانات الملعب");
  }

  async function upload(files: FileList | File[]) {
    if (!venue) return;
    setUploading(true);
    try {
      let coverImageUrl = form.coverImageUrl;
      let photoUrls = [...form.photoUrls];
      for (const file of Array.from(files)) {
        const { publicUrl } = await uploadVenuePhoto(venue.id, file);
        if (!photoUrls.includes(publicUrl)) photoUrls = [...photoUrls, publicUrl];
        if (!coverImageUrl) coverImageUrl = publicUrl;
      }
      setForm((current) => ({ ...current, coverImageUrl, photoUrls }));
      await persistPhotos(coverImageUrl, photoUrls);
      toast.success("تم رفع الصور وستظهر في صفحة الزبائن.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  async function setCover(url: string) {
    const next = { ...form, coverImageUrl: url };
    setForm(next);
    try {
      await persistPhotos(url, next.photoUrls);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الغلاف");
    }
  }

  async function removePhoto(url: string) {
    const photoUrls = form.photoUrls.filter((item) => item !== url);
    const coverImageUrl = form.coverImageUrl === url ? photoUrls[0] ?? "" : form.coverImageUrl;
    const next = { ...form, photoUrls, coverImageUrl };
    setForm(next);
    try {
      await persistPhotos(coverImageUrl, photoUrls);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف الصورة");
    }
  }

  if (!venue) return null;

  return (
    <div className="space-y-5">
    <form className="space-y-5" onSubmit={onSubmit}>
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">الصفحة العامة</div>
          <div className="mt-1 text-lg font-black text-slate-900">/venues/{venue.slug}</div>
          <p className="mt-1 text-sm font-medium text-slate-500">هذا ما يراه الزبائن عند البحث والحجز.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setForm({ ...form, isActive: !form.isActive })}
            className={`rounded-xl px-4 py-2.5 text-sm font-black ${form.isActive ? "bg-brand text-slate-900 shadow-brand" : "bg-slate-100 text-slate-500"}`}
          >
            {form.isActive ? "ظاهر" : "مخفي"}
          </button>
          <Link
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:border-brand"
            href={`${CUSTOMER_SITE_URL}/venues/${venue.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            معاينة
          </Link>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black text-slate-900">الاسم والوصف</h2>
        <p className="mb-5 mt-1 text-sm font-medium text-slate-500">أدخل النصوص بالعربية والإنجليزية.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم الملعب بالعربية">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Venue name in English">
            <Input dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
          </Field>
          <Field label="المدينة">
            <Select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
              {WEST_BANK_CITIES.map((city) => (
                <option key={city} value={city}>
                  {CITY_AR[city] ?? city}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="الهاتف">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="العنوان بالعربية">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Address in English">
            <Input dir="ltr" value={form.addressEn} onChange={(e) => setForm({ ...form, addressEn: e.target.value })} />
          </Field>
          <Field label="WhatsApp">
            <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="الوصف بالعربية">
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description in English">
              <Textarea dir="ltr" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black text-slate-900">موقع الملعب</h2>
        <p className="mb-5 mt-1 text-sm font-medium text-slate-500">حدد الموقع على الخريطة ليظهر للزبائن.</p>
        <MapPicker
          latitude={form.latitude ? Number(form.latitude) : null}
          longitude={form.longitude ? Number(form.longitude) : null}
          onChange={(latitude, longitude) =>
            setForm((current) => ({ ...current, latitude: String(latitude), longitude: String(longitude) }))
          }
        />
      </Card>

      <Card>
        <h2 className="text-lg font-black text-slate-900">صور الملعب</h2>
        <p className="mb-4 mt-1 text-sm font-medium text-slate-500">
          ارفع صورة أو أكثر. تُحفظ تلقائياً وتظهر في صفحة الزبائن. اضغط على صورة لجعلها الغلاف.
        </p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploading}
          onChange={(event) => {
            const files = event.target.files;
            if (files?.length) void upload(files);
            event.target.value = "";
          }}
        />
        {form.photoUrls.length === 0 && (
          <p className="mt-3 text-sm font-medium text-slate-500">لا توجد صور بعد.</p>
        )}
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {form.photoUrls.map((url) => (
            <div key={url} className="relative">
              <button
                type="button"
                className={`overflow-hidden rounded-2xl border-2 ${form.coverImageUrl === url ? "border-brand shadow-brand" : "border-slate-200"}`}
                onClick={() => void setCover(url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-24 w-full object-cover" />
              </button>
              <button
                type="button"
                className="absolute end-1 top-1 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-black text-red-600"
                onClick={() => void removePhoto(url)}
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black text-slate-900">الحجز عبر الموقع</h2>
        <p className="mb-4 mt-1 text-sm font-medium text-slate-500">
          إذا أوقفت الحجز، يظهر الملعب للزبائن مع الهاتف والعنوان فقط بدون أوقات على الموقع.
        </p>
        <button
          type="button"
          onClick={() => setForm({ ...form, acceptsOnlineBooking: !form.acceptsOnlineBooking })}
          className={`rounded-xl px-4 py-2.5 text-sm font-black ${form.acceptsOnlineBooking ? "bg-brand text-slate-900 shadow-brand" : "bg-slate-100 text-slate-500"}`}
        >
          {form.acceptsOnlineBooking ? "الحجز مفعّل على الموقع" : "عرض فقط — بدون حجز أونلاين"}
        </button>
      </Card>

      <Card>
        <h2 className="text-lg font-black text-slate-900">الرياضة</h2>
        <p className="mb-4 mt-1 text-sm font-medium text-slate-500">يصفّي الزبائن حسب هذه الأنواع.</p>
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <button
              type="button"
              key={type.id}
              className={`rounded-full px-4 py-2 text-sm font-black ${form.venueTypeIds.includes(type.id) ? "bg-brand text-slate-900 shadow-brand" : "bg-slate-100 text-slate-600"}`}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  venueTypeIds: current.venueTypeIds.includes(type.id)
                    ? current.venueTypeIds.filter((id) => id !== type.id)
                    : [...current.venueTypeIds, type.id],
                }))
              }
            >
              {catalogName(type)}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black text-slate-900">مرافق إضافية</h2>
        <p className="mb-4 mt-1 text-sm font-medium text-slate-500">مواقف، غرف تبديل، كافتيريا وغيرها. حجم الملعب والعشب والإنارة في القسم التالي.</p>
        <div className="flex flex-wrap gap-2">
          {extraAmenities.map((amenity) => (
            <button
              type="button"
              key={amenity.id}
              className={`rounded-full px-4 py-2 text-sm font-black ${form.amenityIds.includes(amenity.id) ? "bg-brand text-slate-900 shadow-brand" : "bg-slate-100 text-slate-600"}`}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  amenityIds: current.amenityIds.includes(amenity.id)
                    ? current.amenityIds.filter((id) => id !== amenity.id)
                    : [...current.amenityIds, amenity.id],
                }))
              }
            >
              {catalogName(amenity)}
            </button>
          ))}
        </div>
      </Card>

      <Button className="w-full sm:w-auto" size="lg">حفظ الملعب</Button>
    </form>
      <CourtSettings venue={venue} onSaved={refresh} />
    </div>
  );
}
