"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError, Me, Venue, ownerApi } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { getStoredVenueId, setStoredVenueId } from "@/lib/venue-storage";

type VenueContextValue = {
  me: Me | null;
  venue: Venue | null;
  venues: Me["venues"];
  loading: boolean;
  setVenueId: (id: string) => void;
  replaceVenue: (venue: Venue) => void;
  refresh: () => Promise<void>;
};

const VenueContext = createContext<VenueContextValue | null>(null);

export function VenueProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.replace("/login");
      return;
    }
    const storedId = getStoredVenueId();
    try {
      const [profile, storedVenue] = await Promise.all([
        ownerApi.me(),
        storedId ? ownerApi.venue(storedId).catch(() => null) : Promise.resolve(null),
      ]);
      setMe(profile);
      if (profile.accountKind === "CUSTOMER" && profile.venues.length === 0) {
        router.replace("/owner-only");
        setLoading(false);
        return;
      }
      if (profile.venues.length === 0) {
        router.replace("/onboarding");
        setLoading(false);
        return;
      }
      const selected =
        storedVenue && profile.venues.some((item) => item.id === storedVenue.id)
          ? storedVenue.id
          : profile.venues[0].id;
      setStoredVenueId(selected);
      setVenue(
        storedVenue && storedVenue.id === selected
          ? storedVenue
          : await ownerApi.venue(selected),
      );
      setLoading(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      toast.error(error instanceof Error ? error.message : "تعذر تحميل الحساب");
      setLoading(false);
    }
  }

  async function refreshVenue() {
    const id = getStoredVenueId() ?? venue?.id;
    if (!id) return;
    setVenue(await ownerApi.venue(id));
  }

  useEffect(() => {
    void load();
  }, []);

  const value = useMemo<VenueContextValue>(
    () => ({
      me,
      venue,
      venues: me?.venues ?? [],
      loading,
      setVenueId: (id: string) => {
        setStoredVenueId(id);
        setLoading(true);
        void ownerApi.venue(id).then((details) => {
          setVenue(details);
          setLoading(false);
        });
      },
      replaceVenue: (details) => setVenue(details),
      refresh: refreshVenue,
    }),
    [me, venue, loading],
  );

  return <VenueContext.Provider value={value}>{children}</VenueContext.Provider>;
}

export function useVenue() {
  const context = useContext(VenueContext);
  if (!context) {
    throw new Error("useVenue must be used within VenueProvider");
  }
  return context;
}
