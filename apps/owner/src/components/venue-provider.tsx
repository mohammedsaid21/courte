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
    try {
      const profile = await ownerApi.me();
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
        getStoredVenueId() && profile.venues.some((item) => item.id === getStoredVenueId())
          ? getStoredVenueId()!
          : profile.venues[0].id;
      setStoredVenueId(selected);
      const details = await ownerApi.venue(selected);
      setVenue(details);
      setLoading(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      toast.error(error instanceof Error ? error.message : "Could not load your account");
      setLoading(false);
    }
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
      refresh: load,
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
