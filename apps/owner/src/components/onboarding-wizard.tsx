"use client";

import {
  BOOKING_DURATIONS,
  COURT_SETTING_LABELS,
  COURT_SETTINGS,
  COURT_SIZE_LABELS,
  COURT_SIZES,
  COURT_SURFACE_LABELS,
  COURT_SURFACES,
  SPEC_AMENITY_SLUGS,
  WEST_BANK_CITIES,
  durationPayload,
} from "@courte/shared";
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  MapPin,
  Moon,
  Sun,
  Wallet,
  X,
} from "lucide-react";
import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPicker } from "@/components/map-picker";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { CatalogItem, ownerApi } from "@/lib/api";
import { uploadVenuePhoto } from "@/lib/upload-venue-photo";
import { CITY_AR, catalogName } from "@/lib/ar";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { setStoredVenueId } from "@/lib/venue-storage";
import {
  ONBOARDING_STEPS,
  clearOnboardingForm,
  defaultOnboardingForm,
  isUuid,
  loadOnboardingForm,
  loadOnboardingPhotos,
  saveOnboardingForm,
  saveOnboardingPhotos,
  stepIndexFromPath,
} from "@/lib/onboarding-storage";

const defaultHours = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  opensAt: "08:00",
  closesAt: "23:00",
  isClosed: false,
}));

const MAX_PHOTOS = 8;

type LocalPhoto = { id: string; file: File; preview: string };

function OptionCards<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-12 rounded-2xl border px-3 text-sm font-bold transition",
              active
                ? "border-brand bg-brand/15 text-slate-900 ring-2 ring-brand"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function PriceField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-bold text-slate-900">{label}</div>
      <div className="mt-0.5 text-xs text-slate-500">{hint}</div>
      <div className="mt-3 flex items-center gap-2">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="border-0 bg-white text-2xl font-black"
        />
        <span className="text-sm font-bold text-slate-400">₪</span>
      </div>
    </label>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const fileInput = useRef<HTMLInputElement>(null);
  const photosRef = useRef<LocalPhoto[]>([]);
  const step = stepIndexFromPath(pathname);
  const [types, setTypes] = useState<CatalogItem[]>([]);
  const [amenities, setAmenities] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [coverId, setCoverId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultOnboardingForm);
  const [ready, setReady] = useState(false);

  photosRef.current = photos;
  const cover = photos.find((photo) => photo.id === coverId) ?? photos[0];
  const extraAmenities = useMemo(
    () => amenities.filter((item) => !(SPEC_AMENITY_SLUGS as readonly string[]).includes(item.slug)),
    [amenities],
  );

  useEffect(() => {
    setForm(loadOnboardingForm());
    void loadOnboardingPhotos()
      .then((stored) => {
        if (!stored) return;
        const restored = stored.photos.map((photo) => ({
          id: photo.id,
          file: photo.file,
          preview: URL.createObjectURL(photo.file),
        }));
        setPhotos(restored);
        setCoverId(stored.coverId && restored.some((photo) => photo.id === stored.coverId) ? stored.coverId : restored[0]?.id ?? null);
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) saveOnboardingForm(form);
  }, [form, ready]);

  useEffect(() => {
    if (!ready) return;
    void saveOnboardingPhotos(
      photos.map((photo) => ({ id: photo.id, file: photo.file })),
      coverId,
    );
  }, [photos, coverId, ready]);

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
      setForm((current) => ({
        ...current,
        venueTypeIds:
          current.venueTypeIds.filter((id) => venueTypes.some((type) => type.id === id)).length > 0
            ? current.venueTypeIds.filter((id) => venueTypes.some((type) => type.id === id))
            : venueTypes[0]
              ? [venueTypes[0].id]
              : [],
      }));
    })();
  }, [router]);

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview));
    };
  }, []);

  function addPhotos(files: FileList | File[]) {
    const incoming: LocalPhoto[] = [];
    for (const file of Array.from(files)) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        toast.error("استخدم صور JPG أو PNG أو WebP.");
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error("كل صورة حتى 8 ميغابايت.");
        continue;
      }
      incoming.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }
    setPhotos((current) => {
      const merged = [...current];
      for (const photo of incoming) {
        if (merged.length >= MAX_PHOTOS || merged.some((item) => item.id === photo.id)) {
          URL.revokeObjectURL(photo.preview);
          continue;
        }
        merged.push(photo);
      }
      setCoverId((currentCover) => currentCover ?? merged[0]?.id ?? null);
      return merged;
    });
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const photo = current.find((item) => item.id === id);
      if (photo) URL.revokeObjectURL(photo.preview);
      const next = current.filter((item) => item.id !== id);
      setCoverId((currentCover) => (currentCover === id ? next[0]?.id ?? null : currentCover));
      return next;
    });
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) addPhotos(event.dataTransfer.files);
  }

  function toggleAmenity(id: string) {
    setForm((current) => ({
      ...current,
      amenityIds: current.amenityIds.includes(id)
        ? current.amenityIds.filter((item) => item !== id)
        : [...current.amenityIds, id],
    }));
  }

  function canGoNext() {
    if (step === 0) {
      if (!form.name.trim() || !form.address.trim() || !form.phone.trim()) {
        toast.error("أكمل اسم الملعب والعنوان والهاتف.");
        return false;
      }
      if (form.venueTypeIds.length === 0) {
        toast.error("اختر قسمًا رياضيًا واحدًا على الأقل.");
        return false;
      }
    }
    if (step === 2 && form.acceptsOnlineBooking && !form.resourceName.trim()) {
      toast.error("أدخل اسم الملعب القابل للحجز.");
      return false;
    }
    return true;
  }

  function goTo(index: number) {
    const target = ONBOARDING_STEPS[index];
    if (target) router.push(target.href);
  }

  async function uploadPhotos(venueId: string) {
    const urls: string[] = [];
    const ordered = [...photos].sort((a, b) => Number(b.id === coverId) - Number(a.id === coverId));
    for (const photo of ordered) {
      const { publicUrl } = await uploadVenuePhoto(venueId, photo.file);
      urls.push(publicUrl);
    }
    return urls;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (step !== ONBOARDING_STEPS.length - 1) {
      if (!canGoNext()) return;
      if (step === 1 && !form.acceptsOnlineBooking) {
        goTo(ONBOARDING_STEPS.length - 1);
        return;
      }
      goTo(step + 1);
      return;
    }
    if (!canGoNext()) return;
    if (form.venueTypeIds.length === 0) {
      toast.error("اختر قسمًا رياضيًا واحدًا على الأقل قبل النشر.");
      goTo(0);
      return;
    }
    setLoading(true);
    try {
      const venue = await ownerApi.onboard({
        venue: {
          name: form.name,
          nameEn: form.nameEn || null,
          city: form.city,
          address: form.address,
          addressEn: form.addressEn || null,
          phone: form.phone,
          whatsapp: form.whatsapp || null,
          description: form.description || null,
          descriptionEn: form.descriptionEn || null,
          latitude: form.latitude,
          longitude: form.longitude,
          venueTypeIds: form.venueTypeIds,
          amenityIds: form.amenityIds,
          photoUrls: [],
          acceptsOnlineBooking: form.acceptsOnlineBooking,
        },
        ...(form.acceptsOnlineBooking
          ? {
              resource: {
                name: form.resourceName,
                nameEn: form.resourceNameEn || null,
                venueTypeId: form.venueTypeIds[0] ?? null,
                size: form.size,
                surface: form.surface,
                setting: form.setting,
                hasLights: form.hasLights,
                ...durationPayload(form.duration),
              },
              hours: defaultHours,
              defaultPrice: Number(form.dayPrice),
              peakPrice: Number(form.eveningPrice),
              peakStartsAt: "16:00",
              weekendPrice: Number(form.weekendPrice),
            }
          : {}),
      });
      setStoredVenueId(venue.id);
      clearOnboardingForm();
      if (photos.length > 0) {
        const photoUrls = await uploadPhotos(venue.id);
        await ownerApi.updateVenue(venue.id, {
          photoUrls,
          coverImageUrl: photoUrls[0] ?? null,
        });
      }
      toast.success("الملعب جاهز. يمكنك البدء بالحجز من الجدول.");
      router.replace("/calendar");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إنشاء الملعب");
    } finally {
      setLoading(false);
    }
  }

  const progress = ((step + 1) / ONBOARDING_STEPS.length) * 100;
  const durationLabel = form.duration === 90 ? "ساعة ونصف" : "ساعة";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ecfdf5_0%,#f1f5f9_220px)]">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <div className="text-xl font-black italic tracking-wider text-slate-900">
              COURTE<span className="text-brand">.</span>
            </div>
            <p className="text-[11px] font-bold text-slate-400">إعداد الملعب</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
            {step + 1} / {ONBOARDING_STEPS.length}
          </div>
        </div>
        <div className="h-1 bg-slate-200">
          <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 pb-36">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{ONBOARDING_STEPS[step].hint}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-slate-900">{ONBOARDING_STEPS[step].title}</h1>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible">
          {ONBOARDING_STEPS.map((item, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (index <= step || canGoNext()) goTo(index);
                }}
                className={cn(
                  "min-w-[9.5rem] rounded-2xl border px-3 py-3 text-start sm:min-w-0",
                  active
                    ? "border-brand bg-white shadow-sm"
                    : done
                      ? "border-slate-200 bg-white"
                      : "border-transparent bg-white/60",
                )}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      active || done ? "bg-brand text-slate-900" : "bg-slate-200 text-slate-500",
                    )}
                  >
                    {done ? <Check size={14} /> : index + 1}
                  </span>
                  <span className={active ? "text-slate-900" : "text-slate-500"}>{item.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          {step === 0 && (
            <section className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div>
                <h2 className="text-base font-bold text-slate-900">بيانات الملعب</h2>
                <p className="mt-1 text-sm text-slate-500">هذا ما يراه الزبائن عند البحث والحجز.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="اسم الملعب بالعربية">
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="أرينا النخيل" />
                </Field>
                <Field label="Name in English">
                  <Input dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="Nakheel Arena" />
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
                <Field label="الرياضة (يمكن أكثر من نوع)">
                  {types.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">جاري تحميل الأقسام…</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {types.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          className={cn(
                            "rounded-full px-4 py-2 text-sm font-black",
                            form.venueTypeIds.includes(type.id)
                              ? "bg-brand text-slate-900 shadow-brand"
                              : "bg-slate-100 text-slate-600",
                          )}
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
                  )}
                </Field>
                <div className="sm:col-span-2">
                  <Field label="الحجز عبر الموقع">
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3 text-start text-sm font-bold",
                        form.acceptsOnlineBooking
                          ? "border-brand bg-brand/10 text-slate-900"
                          : "border-slate-200 bg-white text-slate-600",
                      )}
                      onClick={() => setForm({ ...form, acceptsOnlineBooking: !form.acceptsOnlineBooking })}
                    >
                      {form.acceptsOnlineBooking
                        ? "نعم — الزبائن يحجزون من الموقع"
                        : "لا — عرض الملعب فقط (هاتف وعنوان)"}
                    </button>
                  </Field>
                </div>
                <Field label="الهاتف">
                  <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="059..." />
                </Field>
                <Field label="WhatsApp">
                  <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="اختياري" />
                </Field>
                <Field label="العنوان بالعربية">
                  <Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="الشارع، الحي" />
                </Field>
                <Field label="Address in English">
                  <Input dir="ltr" value={form.addressEn} onChange={(e) => setForm({ ...form, addressEn: e.target.value })} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="الوصف بالعربية">
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="ملعب مضاء، مواقف قريبة، مناسب للمباريات المسائية."
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Description in English">
                    <Textarea dir="ltr" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} />
                  </Field>
                </div>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/20 text-brand-700">
                    <MapPin size={18} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">حدد الموقع على الخريطة</h2>
                    <p className="text-sm text-slate-500">اضغط على نقطة الملعب ليظهر للزبائن في البحث.</p>
                  </div>
                </div>
                <MapPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onChange={(latitude, longitude) => setForm((current) => ({ ...current, latitude, longitude }))}
                />
                {form.latitude != null && form.longitude != null && (
                  <p className="mt-3 rounded-xl bg-brand/10 px-3 py-2 text-sm font-medium text-slate-700">
                    تم تحديد الموقع. يمكنك تحريك الدبوس بالنقر مرة أخرى.
                  </p>
                )}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/20 text-brand-700">
                      <Camera size={18} />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">صور الملعب</h2>
                      <p className="text-sm text-slate-500">
                        اختياري. ارفع حتى {MAX_PHOTOS} صور، أو أضفها لاحقاً من إعدادات الملعب. الصور تبقى معك بين الخطوات وبعد تحديث الصفحة.
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                    {photos.length}/{MAX_PHOTOS}
                  </span>
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files?.length) addPhotos(event.target.files);
                    event.target.value = "";
                  }}
                />

                {cover ? (
                  <div className="relative overflow-hidden rounded-3xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover.preview} alt="" className="h-56 w-full object-cover" />
                    <span className="absolute start-3 top-3 rounded-lg bg-brand px-2.5 py-1 text-[11px] font-black text-slate-900">
                      صورة الغلاف
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={cn(
                      "flex min-h-48 w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed text-slate-500 transition",
                      dragging ? "border-brand bg-brand/10 text-slate-800" : "border-slate-300 bg-slate-50 hover:border-brand hover:bg-white",
                    )}
                  >
                    <ImagePlus size={32} />
                    <span className="text-sm font-bold">اسحب الصور هنا أو اضغط للاختيار</span>
                    <span className="text-xs">JPG أو PNG أو WebP · حتى 8 ميغابايت</span>
                  </button>
                )}

                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative">
                      <button
                        type="button"
                        onClick={() => setCoverId(photo.id)}
                        className={cn(
                          "block w-full overflow-hidden rounded-2xl border-2",
                          coverId === photo.id ? "border-brand shadow-brand" : "border-slate-200",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.preview} alt="" className="h-24 w-full object-cover" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute end-1.5 top-1.5 rounded-full bg-white/95 p-1 text-slate-700 shadow"
                        aria-label="حذف الصورة"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {photos.length > 0 && photos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={onDrop}
                      className="flex h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-brand hover:text-slate-700"
                    >
                      <ImagePlus size={18} />
                      <span className="text-[11px] font-bold">أضف صورة</span>
                    </button>
                  )}
                </div>
                {photos.length > 0 && (
                  <p className="mt-3 text-xs text-slate-500">اضغط على صورة لجعلها الغلاف الذي يظهر في البحث.</p>
                )}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="اسم المساحة بالعربية">
                  <Input required value={form.resourceName} onChange={(e) => setForm({ ...form, resourceName: e.target.value })} />
                </Field>
                <Field label="Court name in English">
                  <Input dir="ltr" value={form.resourceNameEn} onChange={(e) => setForm({ ...form, resourceNameEn: e.target.value })} />
                </Field>
              </div>
              <Field label="مدة الحجز">
                <OptionCards
                  value={String(form.duration)}
                  onChange={(value) => setForm({ ...form, duration: Number(value) })}
                  options={BOOKING_DURATIONS.map((value) => ({
                    value: String(value),
                    label: value === 90 ? "ساعة ونصف" : "ساعة",
                  }))}
                />
              </Field>
              <Field label="حجم الملعب">
                <OptionCards
                  value={form.size}
                  onChange={(value) => setForm({ ...form, size: value })}
                  options={COURT_SIZES.map((value) => ({ value, label: COURT_SIZE_LABELS[value].ar }))}
                />
              </Field>
              <Field label="العشب">
                <OptionCards
                  value={form.surface}
                  onChange={(value) => setForm({ ...form, surface: value })}
                  options={COURT_SURFACES.map((value) => ({ value, label: COURT_SURFACE_LABELS[value].ar }))}
                />
              </Field>
              <Field label="داخلي / خارجي">
                <OptionCards
                  value={form.setting}
                  onChange={(value) => setForm({ ...form, setting: value })}
                  options={COURT_SETTINGS.map((value) => ({ value, label: COURT_SETTING_LABELS[value].ar }))}
                />
              </Field>
              <button
                type="button"
                onClick={() => setForm({ ...form, hasLights: !form.hasLights })}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-start",
                  form.hasLights ? "border-brand bg-brand/15" : "border-slate-200 bg-slate-50",
                )}
              >
                <div className="flex items-center gap-3">
                  {form.hasLights ? <Moon size={18} /> : <Sun size={18} className="text-slate-400" />}
                  <div>
                    <div className="text-sm font-bold text-slate-900">إنارة ليلية</div>
                    <div className="text-xs text-slate-500">الملعب يُلعب في المساء</div>
                  </div>
                </div>
                <span
                  className={cn(
                    "flex h-6 w-11 items-center rounded-full p-0.5 transition",
                    form.hasLights ? "bg-brand" : "bg-slate-300",
                  )}
                >
                  <span className={cn("h-5 w-5 rounded-full bg-white shadow", form.hasLights && "ms-auto")} />
                </span>
              </button>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-5">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                {cover && (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover.preview} alt="" className="h-40 w-full object-cover" />
                  </div>
                )}
                <div className="p-5 sm:p-7">
                  <p className="text-xs font-bold text-slate-400">ملخص الملعب</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">{form.name || "ملعبك"}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {CITY_AR[form.city] ?? form.city} · {form.address}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      COURT_SIZE_LABELS[form.size].ar,
                      COURT_SURFACE_LABELS[form.surface].ar,
                      COURT_SETTING_LABELS[form.setting].ar,
                      durationLabel,
                      form.hasLights ? "إنارة" : "بدون إنارة",
                      photos.length ? `${photos.length} صور` : "بدون صور",
                    ].map((item) => (
                      <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/20 text-brand-700">
                    <Wallet size={18} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">أسعار الحجز</h2>
                    <p className="text-sm text-slate-500">السعر لكل {durationLabel}، بالشيكل.</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <PriceField
                    label="أوقات عادية"
                    hint="قبل 16:00"
                    value={form.dayPrice}
                    onChange={(dayPrice) => setForm({ ...form, dayPrice })}
                  />
                  <PriceField
                    label="الذروة"
                    hint="من 16:00"
                    value={form.eveningPrice}
                    onChange={(eveningPrice) => setForm({ ...form, eveningPrice })}
                  />
                  <PriceField
                    label="الجمعة والسبت"
                    hint="عطلة نهاية الأسبوع"
                    value={form.weekendPrice}
                    onChange={(weekendPrice) => setForm({ ...form, weekendPrice })}
                  />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-lg font-bold text-slate-900">خدمات إضافية</h2>
                <p className="mb-4 mt-1 text-sm text-slate-500">مواقف، غرف تبديل، كافتيريا وغيرها. اختياري.</p>
                <div className="flex flex-wrap gap-2">
                  {extraAmenities.map((amenity) => (
                    <button
                      type="button"
                      key={amenity.id}
                      onClick={() => toggleAmenity(amenity.id)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-bold",
                        form.amenityIds.includes(amenity.id) ? "bg-brand text-slate-900 shadow-brand" : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {catalogName(amenity)}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
            <div className="mx-auto flex max-w-3xl gap-3">
              {step > 0 && (
                <Button type="button" variant="outline" className="min-w-28" onClick={() => goTo(step - 1)}>
                  <ChevronRight size={16} />
                  السابق
                </Button>
              )}
              {step < ONBOARDING_STEPS.length - 1 ? (
                <Button
                  type="button"
                  className="flex-1"
                  size="lg"
                  onClick={() => {
                    if (canGoNext()) goTo(step + 1);
                  }}
                >
                  التالي
                  <ChevronLeft size={16} />
                </Button>
              ) : (
                <Button className="flex-1" size="lg" disabled={loading}>
                  {loading ? "جاري الحفظ…" : "افتح لوحة التحكم"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
