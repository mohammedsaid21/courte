"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { customerService, type Me } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

type SessionContextValue = {
  session: Session | null;
  me: Me | null;
  loading: boolean;
  profileLoading: boolean;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function needsProfile(pathname: string) {
  return pathname.startsWith("/account/profile") || pathname.includes("/book/review");
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const loadProfile = needsProfile(pathname);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    try {
      const supabase = createClient();
      void supabase.auth.getSession().then(({ data }) => {
        if (cancelled) return;
        setSession(data.session);
        setLoading(false);
      }).catch(() => {
        if (cancelled) return;
        setSession(null);
        setLoading(false);
      });
      const { data } = supabase.auth.onAuthStateChange((event, next) => {
        if (event === "INITIAL_SESSION") return;
        setSession(next);
        if (!next) setMe(null);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      setSession(null);
      setLoading(false);
    }
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!loadProfile || !session) {
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    void customerService
      .me()
      .then((profile) => {
        if (!cancelled) setMe(profile);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadProfile, session?.user.id]);

  async function refresh() {
    if (!session) {
      setMe(null);
      return;
    }
    setMe(await customerService.me());
  }

  const value = useMemo(
    () => ({ session, me, loading, profileLoading, refresh }),
    [session, me, loading, profileLoading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
