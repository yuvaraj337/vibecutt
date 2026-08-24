"use client";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CustomerDetailsForm — VIBE CUT Booking
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Inputs for customer name, WhatsApp number, and
   optional email with inline validation.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import React from "react";

export interface CustomerDetails {
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
}

interface CustomerDetailsFormProps {
  details: CustomerDetails;
  onChange: (details: CustomerDetails) => void;
  errors: Partial<Record<keyof CustomerDetails, string>>;
}

export default function CustomerDetailsForm({
  details,
  onChange,
  errors,
}: CustomerDetailsFormProps) {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    onChange({
      ...details,
      [name]: value,
    });
  };

  return (
    <div className="w-full vc-details-form">
      <div className="vc-details-form-head">
        <h4 className="text-xs sm:text-sm tracking-[0.22em] uppercase font-bold text-brand-gold">
          YOUR DETAILS
        </h4>
        <p className="text-xs text-brand-muted font-light mt-1">
          Please provide your contact information to confirm the appointment.
        </p>
      </div>

      <div className="space-y-4 sm:space-y-4.5">
        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-xs font-semibold text-brand-white uppercase tracking-wider mb-1.5"
          >
            Full Name <span className="text-brand-orange">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            name="fullName"
            value={details.fullName}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            autoComplete="name"
            className={`vc-details-input w-full h-12 px-4 rounded-[8px] bg-[#161616] border text-sm text-white placeholder-brand-muted/40 transition-colors focus:outline-none ${
              errors.fullName
                ? "border-red-500/80 focus:border-red-500 ring-1 ring-red-500/30"
                : "border-brand-gold/25 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/40"
            }`}
          />
          {errors.fullName && (
            <p className="mt-1.5 text-xs text-red-400 font-light flex items-center gap-1.5">
              <span>⚠</span> {errors.fullName}
            </p>
          )}
        </div>

        {/* WhatsApp Number */}
        <div>
          <label
            htmlFor="phone"
            className="block text-xs font-semibold text-brand-white uppercase tracking-wider mb-1.5"
          >
            WhatsApp Number <span className="text-brand-orange">*</span>
          </label>
          <div className="relative">
            <input
              id="phone"
              type="tel"
              name="phone"
              value={details.phone}
              onChange={handleInputChange}
              placeholder="e.g. 9876543210 or +91 9876543210"
              autoComplete="tel"
              className={`vc-details-input w-full h-12 px-4 rounded-[8px] bg-[#161616] border text-sm text-white placeholder-brand-muted/40 transition-colors focus:outline-none ${
                errors.phone
                  ? "border-red-500/80 focus:border-red-500 ring-1 ring-red-500/30"
                  : "border-brand-gold/25 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/40"
              }`}
            />
          </div>
          {errors.phone && (
            <p className="mt-1.5 text-xs text-red-400 font-light flex items-center gap-1.5">
              <span>⚠</span> {errors.phone}
            </p>
          )}
        </div>

        {/* Email (Optional) */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-brand-white uppercase tracking-wider mb-1.5"
          >
            Email Address <span className="text-brand-muted/60 font-normal lowercase">(optional)</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={details.email || ""}
            onChange={handleInputChange}
            placeholder="Enter your email address"
            autoComplete="email"
            className={`vc-details-input w-full h-12 px-4 rounded-[8px] bg-[#161616] border text-sm text-white placeholder-brand-muted/40 transition-colors focus:outline-none ${
              errors.email
                ? "border-red-500/80 focus:border-red-500 ring-1 ring-red-500/30"
                : "border-brand-gold/25 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/40"
            }`}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-400 font-light flex items-center gap-1.5">
              <span>⚠</span> {errors.email}
            </p>
          )}
        </div>

        {/* Additional Notes (Optional) */}
        <div>
          <label
            htmlFor="notes"
            className="block text-xs font-semibold text-brand-white uppercase tracking-wider mb-1.5"
          >
            Additional Notes <span className="text-brand-muted/60 font-normal lowercase">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            value={details.notes || ""}
            onChange={handleInputChange}
            placeholder="Any special requests or grooming preferences?"
            className="vc-details-input vc-details-textarea w-full p-3.5 rounded-[8px] bg-[#161616] border border-brand-gold/25 text-sm text-white placeholder-brand-muted/40 transition-colors focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/40 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
