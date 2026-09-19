import { Suspense } from "react";
import { Skeleton } from "@/components/skeleton";

export default function BookingDetailLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Skeleton className="h-64 w-full" />}>{children}</Suspense>;
}
