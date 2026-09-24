"use client";

import { osmEmbedUrl } from "@courte/shared";

export function VenueMap({
  latitude,
  longitude,
  title,
}: {
  latitude: number;
  longitude: number;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-brand border border-border">
      <iframe
        title={title}
        src={osmEmbedUrl(latitude, longitude)}
        className="h-64 w-full border-0"
        loading="lazy"
      />
    </div>
  );
}
