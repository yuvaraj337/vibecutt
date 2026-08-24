"use client";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BookingSuccess — VIBE CUT Booking
   Compact confirmation screen matching the supplied
   Step 4 reference. Scoped to the confirmed step only.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import React from "react";
import { type Appointment } from "@/lib/types";
import { SERVICES_DATA } from "@/data/services";

interface BookingSuccessProps {
  appointment: Appointment;
  onBookAnother: () => void;
  onClose: () => void;
}

export default function BookingSuccess({
  appointment,
  onBookAnother,
  onClose,
}: BookingSuccessProps) {
  const referenceId = `VC${appointment.id
    .replace(/^apt_/, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(-8)}`;

  const formattedDate = (() => {
    try {
      const [year, month, day] = appointment.appointment_date.split("-");
      if (!year || !month || !day) return appointment.appointment_date;
      const d = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10)
      );
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return appointment.appointment_date;
    }
  })();

  const service = SERVICES_DATA.find((item) => item.id === appointment.service_id);
  const duration =
    service?.id === "haircut-massage"
      ? "45 mins"
      : service?.id === "hair-dye-de-tan"
        ? "60 mins"
        : "30 mins";

  return (
    <div className="vc-confirmed-step" aria-label="Appointment confirmation">
      <div className="vc-confirmed-card">
        <div className="vc-confirmed-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h3 className="vc-confirmed-title">
          APPOINTMENT REQUEST
          <br />
          <span>CONFIRMED!</span>
        </h3>

        <p className="vc-confirmed-copy">
          Thank you for choosing VIBE CUT Men&apos;s Salon.
          <br />
          Your appointment has been received.
        </p>

        <div className="vc-confirmed-reference">
          <span>REFERENCE ID</span>
          <strong>{referenceId}</strong>
          <button
            type="button"
            className="vc-copy-reference"
            aria-label="Copy reference ID"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(referenceId);
              }
            }}
          >
            ⧉
          </button>
        </div>

        <div className="vc-confirmed-details">
          <div>
            <span className="vc-confirmed-detail-icon">✂</span>
            <span className="vc-confirmed-detail-label">Service</span>
            <strong>{appointment.service_name}</strong>
          </div>
          <div>
            <span className="vc-confirmed-detail-icon">▣</span>
            <span className="vc-confirmed-detail-label">Date</span>
            <strong>{formattedDate}</strong>
          </div>
          <div>
            <span className="vc-confirmed-detail-icon">◷</span>
            <span className="vc-confirmed-detail-label">Time</span>
            <strong>{appointment.appointment_time}</strong>
          </div>
          <div>
            <span className="vc-confirmed-detail-icon">◷</span>
            <span className="vc-confirmed-detail-label">Duration</span>
            <strong>{duration}</strong>
          </div>
          <div>
            <span className="vc-confirmed-detail-icon">♙</span>
            <span className="vc-confirmed-detail-label">Customer</span>
            <strong>{appointment.customer_name}</strong>
          </div>
          <div>
            <span className="vc-confirmed-detail-icon">◉</span>
            <span className="vc-confirmed-detail-label">WhatsApp</span>
            <strong>{appointment.phone}</strong>
          </div>
          <div>
            <span className="vc-confirmed-detail-icon">₹</span>
            <span className="vc-confirmed-detail-label">Total Amount</span>
            <strong>₹{appointment.price}</strong>
          </div>
        </div>

        <p className="vc-confirmed-whatsapp">
          You will receive a WhatsApp confirmation shortly.
        </p>
      </div>

      <div className="vc-confirmed-actions">
        <button
          type="button"
          onClick={onBookAnother}
          className="btn-secondary"
        >
          BOOK ANOTHER APPOINTMENT
        </button>
        <button type="button" onClick={onClose} className="btn-primary">
          RETURN HOME
        </button>
      </div>
    </div>
  );
}
