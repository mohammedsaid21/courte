import type { Metadata } from "next";
import { HomeLanding } from "@/components/home-landing";

export const metadata: Metadata = {
  title: "ميدان — احجز ملعبك في الضفة الغربية",
  description: "احجز ملاعب كرة القدم والمرافق الرياضية في رام الله، نابلس، الخليل، بيت لحم والقدس. حساب مجاني للتصفح والحجز.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeLanding />;
}
