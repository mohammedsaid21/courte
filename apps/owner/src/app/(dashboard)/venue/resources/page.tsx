"use client";

import {
  BOOKING_DURATIONS,
  COURT_SETTING_LABELS,
  COURT_SETTINGS,
  COURT_SIZE_LABELS,
  COURT_SIZES,
  COURT_SURFACE_LABELS,
  COURT_SURFACES,
  durationPayload,
} from "@courte/shared";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChoicePills } from "@/components/choice-pills";
import { EmptyState } from "@/components/empty-state";
import { useVenue } from "@/components/venue-provider";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { CatalogItem, Resource, ownerApi } from "@/lib/api";
import { catalogName } from "@/lib/ar";
import { formatDuration } from "@/lib/utils";

const sizeOptions = COURT_SIZES.map((value) => ({ value, label: COURT_SIZE_LABELS[value].ar }));
const surfaceOptions = COURT_SURFACES.map((value) => ({ value, label: COURT_SURFACE_LABELS[value].ar }));
const settingOptions = COURT_SETTINGS.map((value) => ({ value, label: COURT_SETTING_LABELS[value].ar }));
const durationOptions = BOOKING_DURATIONS.map((value) => ({
  value: String(value),
  label: value === 90 ? "ساعة ونصف" : "ساعة",
}));

export default function ResourcesPage() {
  const { venue, refresh } = useVenue();
  const [types, setTypes] = useState<CatalogItem[]>([]);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [venueTypeId, setVenueTypeId] = useState("");
  const [duration, setDuration] = useState(60);
  const [size, setSize] = useState<(typeof COURT_SIZES)[number]>("FIVE_V_FIVE");
  const [surface, setSurface] = useState<(typeof COURT_SURFACES)[number]>("ARTIFICIAL_GRASS");
  const [setting, setSetting] = useState<(typeof COURT_SETTINGS)[number]>("OUTDOOR");
  const [hasLights, setHasLights] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    void ownerApi.venueTypes().then(setTypes);
  }, []);

  useEffect(() => {
    if (venue?.types[0] && !venueTypeId) {
      setVenueTypeId(venue.types[0].id);
    }
  }, [venue, venueTypeId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!venue) return;
    await ownerApi.createResource(venue.id, {
      name,
      nameEn: nameEn || null,
      ...durationPayload(duration),
      venueTypeId: venueTypeId || venue.types[0]?.id,
      size,
      surface,
      setting,
      hasLights,
    });
    setName("");
    setNameEn("");
    await refresh();
    toast.success("تمت إضافة الملعب");
  }

  if (!venue) return null;

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-lg font-black text-slate-900">أضف ملعباً أو مساحة</h2>
        <p className="mb-5 mt-1 text-sm font-medium text-slate-500">كل مساحة لها حجم ومواصفات ومدة حجز خاصة.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الاسم بالعربية"><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="ملعب 1" /></Field>
            <Field label="Name in English"><Input dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></Field>
            <Field label="النوع">
              <Select value={venueTypeId} onChange={(e) => setVenueTypeId(e.target.value)}>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>{catalogName(type)}</option>
                ))}
              </Select>
            </Field>
            <Field label="مدة الحجز">
              <ChoicePills
                value={String(duration)}
                onChange={(value) => setDuration(Number(value))}
                options={durationOptions}
              />
            </Field>
          </div>
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
            <input type="checkbox" checked={hasLights} onChange={(e) => setHasLights(e.target.checked)} />
            إنارة ليلية
          </label>
          <Button>إضافة مساحة</Button>
        </form>
      </Card>
      {venue.resources.length === 0 && (
        <EmptyState
          title="أضف أول ملعب"
          body="يمكن للملعب أن يحتوي عدة مساحات. أضف الأولى لبدء الحجوزات."
        />
      )}
      {venue.resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          types={types}
          editing={editing === resource.id}
          onEdit={() => setEditing(resource.id)}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      ))}
    </div>
  );
}

function ResourceCard({
  resource,
  types,
  editing,
  onEdit,
  onClose,
  onSaved,
}: {
  resource: Resource;
  types: CatalogItem[];
  editing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: resource.name,
    nameEn: resource.nameEn ?? "",
    description: resource.description ?? "",
    descriptionEn: resource.descriptionEn ?? "",
    venueTypeId: resource.venueTypeId ?? types[0]?.id ?? "",
    size: resource.size ?? "FIVE_V_FIVE",
    surface: resource.surface ?? "ARTIFICIAL_GRASS",
    setting: resource.setting ?? "OUTDOOR",
    hasLights: resource.hasLights,
    duration: resource.defaultDurationMinutes === 90 ? 90 : 60,
  });

  async function save(event: FormEvent) {
    event.preventDefault();
    await ownerApi.updateResource(resource.id, {
      name: form.name,
      nameEn: form.nameEn || null,
      description: form.description || null,
      descriptionEn: form.descriptionEn || null,
      venueTypeId: form.venueTypeId || null,
      size: form.size,
      surface: form.surface,
      setting: form.setting,
      hasLights: form.hasLights,
      ...durationPayload(form.duration),
    });
    await onSaved();
    onClose();
    toast.success("تم حفظ المساحة");
  }

  const specBits = [
    resource.size ? COURT_SIZE_LABELS[resource.size].ar : null,
    resource.surface ? COURT_SURFACE_LABELS[resource.surface].ar : null,
    resource.setting ? COURT_SETTING_LABELS[resource.setting].ar : null,
    resource.hasLights ? "إنارة ليلية" : null,
  ].filter(Boolean);

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="h-10 w-1.5 rounded-full bg-brand" />
          <div>
            <div className="text-xl font-black text-slate-900">{resource.name}</div>
            {resource.nameEn && <div className="text-sm font-semibold text-slate-500" dir="ltr">{resource.nameEn}</div>}
            <div className="mt-1 text-sm font-semibold text-slate-500">
              {resource.venueType ? catalogName(resource.venueType) : "بدون نوع"} · {formatDuration(resource.defaultDurationMinutes)}
            </div>
            {specBits.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {specBits.map((bit) => (
                  <span key={bit} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{bit}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-xl px-3 py-2 text-xs font-black ${resource.isActive ? "bg-brand text-slate-900" : "bg-slate-100 text-slate-500"}`}>
            {resource.isActive ? "نشط" : "متوقف"}
          </span>
          <Button variant="outline" onClick={onEdit}>{editing ? "جارٍ التعديل" : "تعديل"}</Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await ownerApi.updateResource(resource.id, { isActive: !resource.isActive });
              await onSaved();
            }}
          >
            {resource.isActive ? "إيقاف" : "تفعيل"}
          </Button>
        </div>
      </div>
      {editing && (
        <form className="mt-5 space-y-4 rounded-2xl bg-slate-50 p-4" onSubmit={save}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الاسم بالعربية"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Name in English"><Input dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} /></Field>
            <Field label="النوع">
              <Select value={form.venueTypeId} onChange={(e) => setForm({ ...form, venueTypeId: e.target.value })}>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>{catalogName(type)}</option>
                ))}
              </Select>
            </Field>
            <Field label="مدة الحجز">
              <ChoicePills
                value={String(form.duration)}
                onChange={(value) => setForm({ ...form, duration: Number(value) as 60 | 90 })}
                options={durationOptions}
              />
            </Field>
          </div>
          <Field label="حجم الملعب">
            <ChoicePills value={form.size} onChange={(value) => setForm({ ...form, size: value })} options={sizeOptions} />
          </Field>
          <Field label="العشب">
            <ChoicePills value={form.surface} onChange={(value) => setForm({ ...form, surface: value })} options={surfaceOptions} />
          </Field>
          <Field label="داخلي / خارجي">
            <ChoicePills value={form.setting} onChange={(value) => setForm({ ...form, setting: value })} options={settingOptions} />
          </Field>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={form.hasLights} onChange={(e) => setForm({ ...form, hasLights: e.target.checked })} />
            إنارة ليلية
          </label>
          <Field label="الوصف بالعربية"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Description in English"><Textarea dir="ltr" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} /></Field>
          <div className="flex gap-2">
            <Button>حفظ</Button>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
