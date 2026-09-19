import type { Metadata } from "next";
import { HomeLanding } from "@/components/home-landing";

export const metadata: Metadata = {
  title: "ملعبك جاهز",
  description: "اعثر على ملعب كرة قدم في مدينتك واحجزه خلال دقائق.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeLanding />;
}
