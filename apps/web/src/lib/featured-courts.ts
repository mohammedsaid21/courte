export type FeaturedCourt = {
  id: string;
  name: string;
  city: string;
  surface: string;
  size: "5v5" | "7v7" | "11v11";
  sizeLabel: string;
  rating: number;
  price: number;
  image: string;
};

export const FEATURED_COURTS: FeaturedCourt[] = [
  {
    id: "nakheel",
    name: "أرينا النخيل",
    city: "رام الله",
    surface: "عشب صناعي",
    size: "5v5",
    sizeLabel: "5 ضد 5",
    rating: 4.9,
    price: 120,
    image: "/assets/arena-nakheel.svg",
  },
  {
    id: "qimma",
    name: "ملعب القمة",
    city: "بيت لحم",
    surface: "عشب صناعي",
    size: "7v7",
    sizeLabel: "7 ضد 7",
    rating: 4.8,
    price: 95,
    image: "/assets/malab-alqimma.svg",
  },
  {
    id: "madina",
    name: "ستاد المدينة",
    city: "الخليل",
    surface: "عشب طبيعي",
    size: "11v11",
    sizeLabel: "11 ضد 11",
    rating: 4.9,
    price: 160,
    image: "/assets/stad-almadina.svg",
  },
];

export const BOOKING_TIMES = ["17:00", "18:00", "19:00", "20:00", "21:00"];
