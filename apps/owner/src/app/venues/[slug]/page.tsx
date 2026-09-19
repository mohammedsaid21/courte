"use client";

import { useEffect, useState } from "react";
import { PublicVenue, ownerApi } from "@/lib/api";
import { weekdayLabel } from "@/lib/utils";

export default function PublicVenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const [venue, setVenue] = useState<PublicVenue | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    void params.then(async ({ slug }) => {
      try {
        setVenue(await ownerApi.publicVenue(slug));
      } catch {
        setMissing(true);
      }
    });
  }, [params]);

  if (missing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-2xl font-black italic">COURTE<span className="text-brand">.</span></div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">This venue is not public yet</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">Turn on the public profile in Settings to preview it here.</p>
        </div>
      </div>
    );
  }
  if (!venue) return null;

  const photos = venue.photos.length > 0 ? venue.photos : venue.coverImageUrl ? [{ url: venue.coverImageUrl }] : [];

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 text-xl font-black italic tracking-wider">COURTE<span className="text-brand">.</span></div>
        {photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photos[0].url} alt="" className="mb-6 h-72 w-full rounded-3xl object-cover shadow-sm" />
        )}
        {photos.length > 1 && (
          <div className="mb-6 grid grid-cols-3 gap-2">
            {photos.slice(1, 7).map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={photo.url} src={photo.url} alt="" className="h-24 w-full rounded-2xl object-cover" />
            ))}
          </div>
        )}
        <p className="text-xs font-black uppercase tracking-widest text-brand-700">{venue.city}</p>
        <h1 className="mt-1 text-4xl font-black tracking-tight text-slate-900">{venue.name}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {venue.types.map((type) => (
            <span key={type.id} className="rounded-full bg-brand px-4 py-1.5 text-sm font-black text-slate-900">{type.name}</span>
          ))}
        </div>
        {venue.description && <p className="mt-5 text-base font-medium leading-7 text-slate-600">{venue.description}</p>}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400">Location</div>
          <div className="mt-2 text-lg font-black text-slate-900">{venue.address}</div>
          <div className="text-sm font-semibold text-slate-500">{venue.city}</div>
          <div className="mt-4 text-sm font-bold text-slate-700">
            Phone {venue.phone}{venue.whatsapp ? ` · WhatsApp ${venue.whatsapp}` : ""}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400">Amenities</div>
          {venue.amenities.length === 0 ? (
            <p className="mt-2 text-sm font-medium text-slate-500">No amenities listed yet.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {venue.amenities.map((item) => (
                <span key={item.id} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">{item.name}</span>
              ))}
            </div>
          )}
        </div>

        {venue.resources.map((resource) => (
          <div key={resource.id} className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1.5 rounded-full bg-brand" />
              <div>
                <div className="text-lg font-black text-slate-900">{resource.name}</div>
                {resource.type && <div className="text-sm font-semibold text-slate-500">{resource.type.name}</div>}
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              {resource.hours.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((hour) => (
                <div key={hour.dayOfWeek} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-black text-slate-900">{weekdayLabel(hour.dayOfWeek)}</span>
                  <span className={`font-bold ${hour.isClosed ? "text-slate-400" : "text-brand-700"}`}>
                    {hour.isClosed ? "Closed" : `${hour.opensAt}–${hour.closesAt}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {venue.cancellationPolicy && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-black uppercase tracking-wider text-slate-400">Cancellation</div>
            <p className="mt-2 text-sm font-medium text-slate-600">{venue.cancellationPolicy}</p>
            {venue.cancellationHours ? (
              <p className="mt-1 text-xs font-bold text-slate-400">{venue.cancellationHours} hours notice.</p>
            ) : null}
          </div>
        )}
        <p className="mt-8 text-center text-sm font-medium text-slate-400">Owner preview — customers book from the Courte website.</p>
      </div>
    </div>
  );
}
