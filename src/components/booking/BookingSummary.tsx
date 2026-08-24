"use client";

/* Compact Step 3 booking summary — VIBE CUT reference layout. */

import React from "react";
import { type ServiceItem } from "@/data/services";
import { type BookingDate } from "./DateSelector";
import { type CustomerDetails } from "./CustomerDetailsForm";

interface BookingSummaryProps {
  service: ServiceItem;
  date: BookingDate | null;
  time: string | null;
  customer: CustomerDetails;
}

const imageMap: Record<string, string> = {
  "haircut-shave": "/services/haircut-shave.png",
  "haircut-massage": "/services/haircut-massage.png",
  "hair-dye": "/services/hair-dye.png",
  "global-hair-color": "/services/global-hair-color.png",
  "hair-spa": "/services/hair-spa.png",
  "hair-dye-de-tan": "/services/hair-dye-de-tan.png",
  "diamond-facial": "/services/diamond-facial.png",
  "premium-grooming": "/services/premium-grooming.png",
};

function durationFor(service: ServiceItem) {
  if (service.id === "haircut-massage") return "45 mins";
  if (service.id === "hair-dye-de-tan") return "60 mins";
  return "30 mins";
}

export default function BookingSummary({
  service,
  date,
  time,
}: BookingSummaryProps) {
  return (
    <div className="vc-details-summary">
      <h4 className="vc-details-summary-title">BOOKING SUMMARY</h4>

      <div className="vc-details-summary-service">
        <div className="vc-details-summary-image">
          <img src={imageMap[service.id]} alt="" />
        </div>
        <div className="vc-details-summary-service-copy">
          <span className="vc-details-summary-number">{service.number}</span>
          <h5>{service.name}</h5>
          <p>{service.includes.join(" · ")}</p>
        </div>
      </div>

      <div className="vc-details-summary-meta">
        <div>
          <span className="vc-summary-icon">▣</span>
          <div>
            <small>Date</small>
            <strong>{date ? date.formattedDisplay : "—"}</strong>
          </div>
        </div>
        <div>
          <span className="vc-summary-icon">◷</span>
          <div>
            <small>Time</small>
            <strong>{time || "—"}</strong>
          </div>
        </div>
        <div>
          <span className="vc-summary-icon">◷</span>
          <div>
            <small>Duration</small>
            <strong>{durationFor(service)}</strong>
          </div>
        </div>
      </div>

      <div className="vc-details-summary-total">
        <span>Total</span>
        <strong>{service.currency}{service.price}</strong>
      </div>
    </div>
  );
}
