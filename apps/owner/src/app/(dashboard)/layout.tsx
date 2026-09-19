"use client";

import { VenueProvider } from "@/components/venue-provider";
import { AppShell } from "@/components/app-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <VenueProvider>
      <AppShell>{children}</AppShell>
    </VenueProvider>
  );
}
