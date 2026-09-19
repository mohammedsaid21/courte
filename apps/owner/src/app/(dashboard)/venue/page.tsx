"use client";

import { WEST_BANK_CITIES } from "@courte/shared";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { useVenue } from "@/components/venue-provider";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { CatalogItem, ownerApi } from "@/lib/api";

export default function VenueProfilePage() {
  const { venue, refresh } = useVenue();
  const [types, setTypes] = useState<CatalogItem[]>([]);
  const [amenities, setAmenities] = useState<CatalogItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    address: "",
    phone: "",
    whatsapp: "",
    description: "",
    latitude: "",
    longitude: "",
    coverImageUrl: "",
    photoUrls: [] as string[],
    venueTypeIds: [] as string[],
    amenityIds: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    void Promise.all([ownerApi.venueTypes(), ownerApi.amenities()]).then(([venueTypes, amenityList]) => {
      setTypes(venueTypes);
      setAmenities(amenityList);
    });
  }, []);

  useEffect(() => {
    if (!venue) return;
    setForm({
      name: venue.name,
      city: venue.city,
      address: venue.address,
      phone: venue.phone,
      whatsapp: venue.whatsapp ?? "",
      description: venue.description ?? "",
      latitude: venue.latitude != null ? String(venue.latitude) : "",
      longitude: venue.longitude != null ? String(venue.longitude) : "",
      coverImageUrl: venue.coverImageUrl ?? "",
      photoUrls: venue.photos.map((photo) => photo.url),
      venueTypeIds: venue.types.map((item) => item.id),
      amenityIds: venue.amenities.map((item) => item.id),
      isActive: venue.isActive,
    });
  }, [venue]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!venue) return;
    await ownerApi.updateVenue(venue.id, {
      name: form.name,
      city: form.city,
      address: form.address,
      phone: form.phone,
      whatsapp: form.whatsapp || null,
      description: form.description || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      coverImageUrl: form.coverImageUrl || null,
      photoUrls: form.photoUrls,
      venueTypeIds: form.venueTypeIds,
      amenityIds: form.amenityIds,
      isActive: form.isActive,
    });
    await refresh();
    toast.success("Venue updated");
  }

  async function upload(file: File, asCover = false) {
    if (!venue) return;
    setUploading(true);
    try {
      const { signedUrl, publicUrl } = await ownerApi.upload(venue.id, file.type);
      const response = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      setForm((current) => ({
        ...current,
        coverImageUrl: asCover || !current.coverImageUrl ? publicUrl : current.coverImageUrl,
        photoUrls: current.photoUrls.includes(publicUrl) ? current.photoUrls : [...current.photoUrls, publicUrl],
      }));
      toast.success("Image uploaded. Save to keep it.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload image");
    } finally {
      setUploading(false);
    }
  }

  if (!venue) return null;

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Public page</div>
          <div className="mt-1 text-lg font-black text-slate-900">/venues/{venue.slug}</div>
          <p className="mt-1 text-sm font-medium text-slate-500">What customers see when they search and book.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setForm({ ...form, isActive: !form.isActive })}
            className={`rounded-xl px-4 py-2.5 text-sm font-black ${form.isActive ? "bg-brand text-slate-900 shadow-brand" : "bg-slate-100 text-slate-500"}`}
          >
            {form.isActive ? "LIVE" : "Hidden"}
          </button>
          <Link
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:border-brand"
            href={`/venues/${venue.slug}`}
            target="_blank"
          >
            Open preview
          </Link>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black text-slate-900">Venue details</h2>
        <p className="mb-5 mt-1 text-sm font-medium text-slate-500">Name, city, and how customers reach you.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="City">
            <Select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
              {WEST_BANK_CITIES.map((city) => <option key={city}>{city}</option>)}
            </Select>
          </Field>
          <Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="WhatsApp"><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
          <div className="sm:col-span-2">
            <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black text-slate-900">Map pin</h2>
        <p className="mb-5 mt-1 text-sm font-medium text-slate-500">Optional. Helps customers find the venue.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitude"><Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="31.9038" /></Field>
          <Field label="Longitude"><Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="35.2034" /></Field>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black text-slate-900">Photos</h2>
        <p className="mb-4 mt-1 text-sm font-medium text-slate-500">Tap an image to use it as the cover.</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file, form.photoUrls.length === 0);
          }}
        />
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {form.photoUrls.map((url) => (
            <button
              type="button"
              key={url}
              className={`overflow-hidden rounded-2xl border-2 ${form.coverImageUrl === url ? "border-brand shadow-brand" : "border-slate-200"}`}
              onClick={() => setForm({ ...form, coverImageUrl: url })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-24 w-full object-cover" />
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black text-slate-900">Sports</h2>
        <p className="mb-4 mt-1 text-sm font-medium text-slate-500">Customers filter by these.</p>
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
              {type.name}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black text-slate-900">Amenities</h2>
        <p className="mb-4 mt-1 text-sm font-medium text-slate-500">Parking, showers, floodlights — anything a customer looks for.</p>
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity) => (
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
              {amenity.name}
            </button>
          ))}
        </div>
      </Card>

      <Button className="w-full sm:w-auto" size="lg">Save venue</Button>
    </form>
  );
}
