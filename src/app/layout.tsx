import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIBE CUT — Premium Men's Salon | Tirupati",
  description:
    "Sharp Style. Smart Price. Experience premium grooming at VIBE CUT Men's Salon in Tirupati, India. Expert barbers, cinematic ambiance, and world-class service.",
  keywords: [
    "men's salon",
    "barber",
    "Tirupati",
    "haircut",
    "grooming",
    "VIBE CUT",
    "premium salon",
  ],
  openGraph: {
    title: "VIBE CUT — Premium Men's Salon",
    description: "Sharp Style. Smart Price. Premium grooming in Tirupati.",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
