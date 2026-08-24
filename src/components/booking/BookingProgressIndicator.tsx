"use client";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BookingProgressIndicator — VIBE CUT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   4-step luxury progress indicator:
   1. SERVICE (Active) → 2. TIME → 3. DETAILS → 4. CONFIRM
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import React from "react";

export type BookingStep = "service" | "time" | "details" | "confirmed";

interface BookingProgressIndicatorProps {
  currentStep?: BookingStep;
}

export default function BookingProgressIndicator({
  currentStep = "service",
}: BookingProgressIndicatorProps) {
  const steps: { id: BookingStep; label: string; num: string; displayNum: string }[] = [
    { id: "service", label: "SERVICE", num: "1", displayNum: "01" },
    { id: "time", label: "TIME", num: "2", displayNum: "02" },
    { id: "details", label: "DETAILS", num: "3", displayNum: "03" },
    { id: "confirmed", label: "CONFIRM", num: "4", displayNum: "04" },
  ];

  const stepOrder: Record<BookingStep, number> = {
    service: 0,
    time: 1,
    details: 2,
    confirmed: 3,
  };

  const currentIdx = stepOrder[currentStep] ?? 0;

  return (
    <div className="w-full relative px-4 sm:px-10 pt-4 sm:pt-6 pb-6 sm:pb-8">
      {/* Connecting line running through circle centers across the 3 columns */}
      <div className="absolute top-[42px] sm:top-[52px] left-[12.5%] right-[12.5%] h-px bg-brand-gold/20 -translate-y-1/2 z-0" />

      {/* 3-Column Grid */}
      <div className="grid grid-cols-4 relative z-10">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isPassed = currentIdx > idx;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center justify-center text-center"
            >
              {/* Circle: 48–56px */}
              <div
                className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm sm:text-base md:text-lg font-bold transition-all duration-250 ${
                  isActive
                    ? "bg-gradient-to-br from-[#dfc27e] to-[#c8a45a] text-[#0a0a0a] shadow-[0_0_24px_rgba(200,164,90,0.4)] ring-4 ring-[#dfc27e]/30 ring-offset-2 ring-offset-[#111111]"
                    : isPassed
                    ? "bg-[#221b12] text-[#dfc27e] border border-brand-gold shadow-[0_0_12px_rgba(200,164,90,0.2)]"
                    : "bg-[#161616] text-brand-muted/40 border border-brand-gold/15"
                }`}
              >
                {isPassed ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.num
                )}
              </div>

              {/* Label: 10–12px margin top */}
              <span
                className={`mt-2.5 sm:mt-3 text-[0.68rem] sm:text-xs tracking-[0.2em] uppercase font-semibold transition-colors ${
                  isActive
                    ? "text-[#dfc27e]"
                    : isPassed
                    ? "text-brand-white"
                    : "text-brand-muted/45"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
