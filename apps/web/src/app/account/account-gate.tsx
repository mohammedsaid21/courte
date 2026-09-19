"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/components/session-provider";
import { Skeleton } from "@/components/skeleton";

export function AccountGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading && !session) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
