"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { useVenue } from "@/components/venue-provider";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { CatalogItem, Resource, ownerApi } from "@/lib/api";

export default function ResourcesPage() {
  const { venue, refresh } = useVenue();
  const [types, setTypes] = useState<CatalogItem[]>([]);
  const [name, setName] = useState("");
  const [venueTypeId, setVenueTypeId] = useState("");
  const [duration, setDuration] = useState(60);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    void ownerApi.venueTypes().then(setTypes);
  }, []);

  useEffect(() => {
    if (venue?.types[0] && !venueTypeId) {
      setVenueTypeId(venue.types[0].id);
    }
    if (venue?.defaultDurationMinutes) {
      setDuration(venue.defaultDurationMinutes);
    }
  }, [venue, venueTypeId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!venue) return;
    await ownerApi.createResource(venue.id, {
      name,
      defaultDurationMinutes: duration,
      slotIntervalMinutes: duration,
      minDurationMinutes: Math.min(30, duration),
      maxDurationMinutes: Math.max(duration * 2, 120),
      venueTypeId: venueTypeId || venue.types[0]?.id,
    });
    setName("");
    await refresh();
    toast.success("تمت إضافة المساحة");
  }

  if (!venue) return null;

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-lg font-black text-slate-900">أضف ملعباً أو مساحة</h2>
        <p className="mb-5 mt-1 text-sm font-medium text-slate-500">كل مساحة لها جدول وساعات وأسعار خاصة.</p>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
          <Field label="الاسم"><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="ملعب 1" /></Field>
          <Field label="النوع">
            <Select value={venueTypeId} onChange={(e) => setVenueTypeId(e.target.value)}>
              {types.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="المدة الافتراضية">
            <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </Field>
          <div className="flex items-end"><Button className="w-full">إضافة مساحة</Button></div>
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
    description: resource.description ?? "",
    venueTypeId: resource.venueTypeId ?? types[0]?.id ?? "",
    defaultDurationMinutes: resource.defaultDurationMinutes,
    slotIntervalMinutes: resource.slotIntervalMinutes,
    minDurationMinutes: resource.minDurationMinutes,
    maxDurationMinutes: resource.maxDurationMinutes,
  });

  async function save(event: FormEvent) {
    event.preventDefault();
    await ownerApi.updateResource(resource.id, {
      ...form,
      description: form.description || null,
      venueTypeId: form.venueTypeId || null,
    });
    await onSaved();
    onClose();
    toast.success("Resource updated");
  }

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="h-10 w-1.5 rounded-full bg-brand" />
          <div>
            <div className="text-xl font-black text-slate-900">{resource.name}</div>
            <div className="mt-1 text-sm font-semibold text-slate-500">
              {resource.venueType?.name ?? "No type"} · {resource.defaultDurationMinutes} min slots
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-xl px-3 py-2 text-xs font-black ${resource.isActive ? "bg-brand text-slate-900" : "bg-slate-100 text-slate-500"}`}>
            {resource.isActive ? "ACTIVE" : "OFF"}
          </span>
          <Button variant="outline" onClick={onEdit}>{editing ? "Editing" : "Edit"}</Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await ownerApi.updateResource(resource.id, { isActive: !resource.isActive });
              await onSaved();
            }}
          >
            {resource.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>
      {editing && (
        <form className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2" onSubmit={save}>
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Type">
            <Select value={form.venueTypeId} onChange={(e) => setForm({ ...form, venueTypeId: e.target.value })}>
              {types.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="المدة الافتراضية">
            <Input type="number" value={form.defaultDurationMinutes} onChange={(e) => setForm({ ...form, defaultDurationMinutes: Number(e.target.value) })} />
          </Field>
          <Field label="Slot interval">
            <Input type="number" value={form.slotIntervalMinutes} onChange={(e) => setForm({ ...form, slotIntervalMinutes: Number(e.target.value) })} />
          </Field>
          <Field label="Minimum duration">
            <Input type="number" value={form.minDurationMinutes} onChange={(e) => setForm({ ...form, minDurationMinutes: Number(e.target.value) })} />
          </Field>
          <Field label="Maximum duration">
            <Input type="number" value={form.maxDurationMinutes} onChange={(e) => setForm({ ...form, maxDurationMinutes: Number(e.target.value) })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          </div>
          <div className="flex gap-2">
            <Button>Save</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
