"use client";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ServicesSection — VIBE CUT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Interactive Services & Pricing section following
   the cinematic hero. Features 8 salon services,
   generous 110px top breathing space, 60px header gap,
   and 100px bottom CTA separation inside a unified
   max-1440px content wrapper.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import React, { useState } from "react";
import ServiceGrid from "./ServiceGrid";
import { type ServiceItem } from "@/data/services";

interface ServicesSectionProps {
  onBookService?: (service?: ServiceItem) => void;
}

export default function ServicesSection({ onBookService }: ServicesSectionProps = {}) {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const handleSelectService = (service: ServiceItem) => {
    setSelectedService(service);
    if (onBookService) {
      onBookService(service);
    }
  };

  return (
    <section id="services-section" className="services-section">
      {/* ── Background Ambient Gold Glows ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div
          className="absolute"
          style={{
            top: "15%",
            left: "5%",
            width: "45vw",
            height: "45vw",
            background:
              "radial-gradient(ellipse, rgba(200,164,90,0.035) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: "10%",
            right: "5%",
            width: "40vw",
            height: "40vw",
            background:
              "radial-gradient(ellipse, rgba(200,164,90,0.03) 0%, transparent 70%)",
            filter: "blur(120px)",
          }}
        />
      </div>

      {/* ── Central Content Wrapper (width: min(100% - 96px, 1440px)) ── */}
      <div className="services-wrapper relative z-10">
        {/* ── Section Header (Max-900px, 60px Margin to Grid) ── */}
        <div className="services-header">
          {/* Eyebrow (20px gap to heading) */}
          <p className="services-eyebrow">
            THE VIBE CUT EXPERIENCE
          </p>

          {/* Main Heading (56–64px desktop, 18px gap to text) */}
          <h2 className="services-heading">
            SHARP STYLE. <span className="text-gold-gradient">SMART PRICE.</span>
          </h2>

          {/* Divider accent line */}
          <div className="w-10 h-px bg-gradient-to-r from-transparent via-brand-gold/45 to-transparent mx-auto mb-4.5" />

          {/* Supporting Description */}
          <p className="services-description">
            Premium grooming services designed for a sharp, confident look.
          </p>
        </div>

        {/* ── Services Grid ── */}
        <ServiceGrid onSelectService={handleSelectService} />

        {/* ── Bottom Section CTA (100px Separation from Grid, Max-760px) ── */}
        <div className="services-bottom-cta">
          {/* CTA Heading (18px gap to text) */}
          <h3 className="services-cta-heading">
            READY FOR YOUR NEXT LOOK?
          </h3>

          {/* CTA Supporting Text (32px gap to button) */}
          <p className="services-cta-text">
            Choose your service and book your time at VIBE CUT.
          </p>

          {/* CTA Button (300px desktop, full-width max-340px mobile) */}
          <div className="services-cta-btn-wrap">
            <button
              id="services-cta-book"
              onClick={() => onBookService?.()}
              className="btn-primary services-cta-btn"
              aria-label="Book an appointment at VIBE CUT"
            >
              Book Appointment
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
