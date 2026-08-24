/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VIBE CUT — Salon Configuration Data
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Central verified salon settings. Contact details use
   explicit placeholders until confirmed by the salon owner.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import { WorkingHoursConfig } from "@/lib/types";

export interface SalonConfig {
  name: string;
  tagline: string;
  city: string;
  state: string;
  country: string;
  formattedLocation: string;
  phonePlaceholder: string;
  whatsappPlaceholder: string;
  mapsUrlPlaceholder: string;
  slotDurationMinutes: number;
  defaultWorkingHours: WorkingHoursConfig;
}

export const SALON_CONFIG: SalonConfig = {
  name: "VIBE CUT MEN'S SALON",
  tagline: "Sharp Style. Smart Price.",
  city: "Tirupati",
  state: "Andhra Pradesh",
  country: "India",
  formattedLocation: "Tirupati, Andhra Pradesh, India",

  // Explicit configuration placeholders (no fake numbers or fake street addresses)
  phonePlaceholder: "+91 [SALON_PHONE_NUMBER]",
  whatsappPlaceholder: "+91 [SALON_WHATSAPP_NUMBER]",
  mapsUrlPlaceholder: "https://maps.google.com/?q=VIBE+CUT+Tirupati",

  slotDurationMinutes: 30,

  defaultWorkingHours: {
    Monday: { open: "10:00 AM", close: "08:00 PM" },
    Tuesday: { open: "10:00 AM", close: "08:00 PM" },
    Wednesday: { open: "10:00 AM", close: "08:00 PM" },
    Thursday: { open: "10:00 AM", close: "08:00 PM" },
    Friday: { open: "10:00 AM", close: "08:00 PM" },
    Saturday: { open: "10:00 AM", close: "08:00 PM" },
    Sunday: { open: "10:00 AM", close: "06:00 PM" },
  },
};
