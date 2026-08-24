/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VIBE CUT — Services & Pricing Data
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export interface ServiceItem {
  id: string;
  number: string;
  name: string;
  price: number;
  currency: string;
  includes: string[];
  isPopular?: boolean;
}

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: "haircut-shave",
    number: "01",
    name: "HAIRCUT + SHAVE",
    price: 199,
    currency: "₹",
    includes: ["Haircut", "Shave", "Hair Wash", "Hair Dry"],
    isPopular: true,
  },
  {
    id: "haircut-massage",
    number: "02",
    name: "HAIRCUT + MASSAGE",
    price: 299,
    currency: "₹",
    includes: ["Haircut", "Head Massage", "Hair Wash", "Hair Dry"],
  },
  {
    id: "hair-dye",
    number: "03",
    name: "HAIR DYE",
    price: 399,
    currency: "₹",
    includes: ["Hair Dye", "Hair Wash", "Hair Dry"],
  },
  {
    id: "global-hair-color",
    number: "04",
    name: "GLOBAL HAIR COLOR",
    price: 499,
    currency: "₹",
    includes: ["Global Hair Color", "Hair Wash", "Hair Dry"],
  },
  {
    id: "hair-spa",
    number: "05",
    name: "HAIR SPA",
    price: 599,
    currency: "₹",
    includes: ["Hair Spa", "Hair Wash", "Hair Dry"],
  },
  {
    id: "hair-dye-de-tan",
    number: "06",
    name: "HAIR DYE + DE-TAN",
    price: 799,
    currency: "₹",
    includes: ["Hair Dye", "De-Tan", "Hair Wash", "Hair Dry"],
  },
  {
    id: "diamond-facial",
    number: "07",
    name: "DIAMOND FACIAL",
    price: 999,
    currency: "₹",
    includes: ["Diamond Facial", "Clean Up", "Massage"],
  },
  {
    id: "premium-grooming",
    number: "08",
    name: "PREMIUM GROOMING",
    price: 1299,
    currency: "₹",
    includes: [
      "Haircut",
      "Hair Color",
      "Hair Spa",
      "Facial",
      "De-Tan",
      "Head Massage",
      "Hair Wash",
    ],
    isPopular: true,
  },
];
