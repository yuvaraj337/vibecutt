"use client";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VIBE CUT — Main Landing Page
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Composes the Cinematic Hero, Services & Menu
   Section, and full-screen Booking Modal.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import React, { useState } from "react";
import CinematicScrollHero from "@/components/cinematic/CinematicScrollHero";
import ServicesSection from "@/components/services/ServicesSection";
import BookingModal from "@/components/booking/BookingModal";
import { type ServiceItem } from "@/data/services";

export default function Home() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingService, setBookingService] = useState<ServiceItem | null>(null);

  const handleOpenBooking = (service?: ServiceItem) => {
    if (service) {
      setBookingService(service);
    }
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
  };

  return (
    <main>
      {/* ── Cinematic Hero (Scroll-Controlled Sequence) ── */}
      <CinematicScrollHero onOpenBooking={() => handleOpenBooking()} />

      {/* ── Services / Menu Section ── */}
      <ServicesSection onBookService={handleOpenBooking} />

      {/* ── Booking Modal Overlay ── */}
      <BookingModal
        isOpen={isBookingOpen}
        initialService={bookingService}
        onClose={handleCloseBooking}
      />
    </main>
  );
}
