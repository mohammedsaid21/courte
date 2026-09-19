import type { Metadata } from "next";
import { AccountGate } from "./account-gate";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountGate>{children}</AccountGate>;
}
