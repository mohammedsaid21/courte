"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { SearchPanel, SportFilter } from "@/components/search-panel";
import { VenueCardSkeleton } from "@/components/skeleton";
import { Button } from "@/components/ui";
import { VenueCard } from "@/components/venue-card";
import { userFacingMessage, venueService, type CatalogItem, type DiscoverVenue } from "@/lib/api";
import { todayYmd } from "@/lib/utils";

const PAGE_SIZE = 12;

export default function VenuesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [items, setItems] = useState<DiscoverVenue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [types, setTypes] = useState<CatalogItem[]>([]);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const query = useMemo(
    () => ({
      q: params.get("q") ?? undefined,
      city: params.get("city") ?? undefined,
      area: params.get("area") ?? undefined,
      typeId: params.get("typeId") ?? undefined,
      date: params.get("date") ?? undefined,
      dateTo: params.get("dateTo") ?? undefined,
      time: params.get("time") ?? undefined,
      size: (params.get("size") as DiscoverVenue["sizes"][number] | null) ?? undefined,
      minPrice: params.get("minPrice") ? Number(params.get("minPrice")) : undefined,
      maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined,
    }),
    [params],
  );

  useEffect(() => {
    void venueService.types().then(setTypes).catch(() => setTypes([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [params]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void venueService
      .search({
        ...query,
        page,
        pageSize: PAGE_SIZE,
        lat: coords?.lat,
        lng: coords?.lng,
        radiusKm: coords ? 50 : undefined,
        sort: coords ? "distance" : query.minPrice != null || query.maxPrice != null ? "price" : "name",
      })
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(userFacingMessage(err));
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, page, coords]);

  function setType(typeId: string) {
    const next = new URLSearchParams(params.toString());
    if (typeId) next.set("typeId", typeId);
    else next.delete("typeId");
    router.push(`/venues?${next.toString()}`);
  }

  function useLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("اختر مدينة. الموقع غير متاح على هذا الجهاز.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationMessage("نرتّب الملاعب الأقرب أولاً.");
      },
      () => {
        setCoords(null);
        setLocationMessage("لم يُسمح بالموقع. اختر مدينة بدل ذلك.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6">
      <div className="max-w-2xl">
        <h1 className="text-h1">ابحث عن ملعب</h1>
        <p className="mt-2 text-body">فلتر حسب المدينة والمنطقة والحجم والأوقات المتاحة ثم احجز.</p>
      </div>
      <SearchPanel initial={query} compact />
      <SportFilter types={types} value={query.typeId} onChange={setType} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={useLocation}>
          قربي
        </Button>
        {locationMessage && <p className="text-sm text-text-muted">{locationMessage}</p>}
      </div>
      {error && <Alert tone="danger" description={error} />}
      {loading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <VenueCardSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="لا يوجد ملعب بهذه الفلاتر"
          body={
            query.dateTo
              ? "لا توجد أوقات شاغرة خلال هذه الفترة. جرّب مدينة أو حجمًا آخر."
              : query.date
              ? "لا توجد أوقات في هذا اليوم. جرّب يومًا أو مدينة أخرى."
              : "جرّب مدينة أو حجمًا أو منطقة مختلفة."
          }
        />
      ) : (
        <>
          <p className="text-sm font-bold text-text-muted">
            {total} ملعب
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                السابق
              </Button>
              <span className="text-sm text-text-muted">
                {page} / {pageCount}
              </span>
              <Button variant="secondary" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>
                التالي
              </Button>
            </div>
          )}
        </>
      )}
      {(query.date || query.dateTo) && (
        <p className="text-sm text-text-muted">
          تظهر الملاعب التي فيها وقت شاغر
          {query.dateTo ? " خلال هذا الأسبوع." : query.date === todayYmd() ? " اليوم." : " في التاريخ المحدد."}
        </p>
      )}
    </div>
  );
}
