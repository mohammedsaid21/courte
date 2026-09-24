"use client";

import { RAMALLAH_CENTER } from "@courte/shared";
import { useEffect, useRef } from "react";
import { Button } from "./ui";
import "leaflet/dist/leaflet.css";

export function MapPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const leafletMod = await import("leaflet");
      const L = leafletMod.default ?? leafletMod;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const start = {
        lat: latitude ?? RAMALLAH_CENTER.latitude,
        lng: longitude ?? RAMALLAH_CENTER.longitude,
      };
      const map = L.map(containerRef.current, {
        center: [start.lat, start.lng],
        zoom: latitude != null && longitude != null ? 16 : 12,
        scrollWheelZoom: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
        }).addTo(map);

      const icon = L.divIcon({
        className: "courte-map-pin",
        html: `<span style="display:block;width:18px;height:18px;border-radius:999px;background:#86efac;border:3px solid #0f172a;box-shadow:0 0 0 4px rgba(15,23,42,.18)"></span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      if (latitude != null && longitude != null) {
        markerRef.current = L.marker([latitude, longitude], { icon }).addTo(map);
      }

      map.on("click", (event) => {
        const { lat, lng } = event.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
        }
        onChangeRef.current(Number(lat.toFixed(7)), Number(lng.toFixed(7)));
      });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Mount once; later coordinate changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || latitude == null || longitude == null) return;
    const next = { lat: latitude, lng: longitude };
    mapRef.current.setView(next, Math.max(mapRef.current.getZoom(), 15));
    if (markerRef.current) {
      markerRef.current.setLatLng(next);
    }
  }, [latitude, longitude]);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange(Number(position.coords.latitude.toFixed(7)), Number(position.coords.longitude.toFixed(7)));
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="space-y-3">
      <div dir="ltr" ref={containerRef} className="h-72 overflow-hidden rounded-2xl border border-slate-200" />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={useMyLocation}>
          استخدم موقعي
        </Button>
        {latitude != null && longitude != null ? (
          <p className="text-sm font-semibold text-slate-500">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </p>
        ) : (
          <p className="text-sm font-medium text-slate-500">اضغط على الخريطة لتحديد موقع الملعب.</p>
        )}
      </div>
    </div>
  );
}
