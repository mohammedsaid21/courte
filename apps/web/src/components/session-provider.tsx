"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { customerService, type Me } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

type SessionContextValue = {
  session: Session | null;
  me: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session) {
        setMe(await customerService.me());
      } else {
        setMe(null);
      }
    } catch {
      setSession(null);
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    try {
      const supabase = createClient();
      const { data } = supabase.auth.onAuthStateChange(() => {
        void load();
      });
      return () => data.subscription.unsubscribe();
    } catch {
      return undefined;
    }
  }, []);

  const value = useMemo(
    () => ({ session, me, loading, refresh: load }),
    [session, me, loading],
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
