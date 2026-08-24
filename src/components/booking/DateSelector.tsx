"use client";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DateSelector — VIBE CUT Booking
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Taller & wider dynamic 14-day interactive date cards
   with premium gold active states and smooth scroll.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import React, { useMemo, useRef } from "react";

export interface BookingDate {
  dateObj: Date;
  dayShort: string;
  dayNum: string;
  monthShort: string;
  fullDateString: string;
  formattedDisplay: string;
}

interface DateSelectorProps {
  selectedDate: BookingDate | null;
  onSelectDate: (date: BookingDate) => void;
}

export default function DateSelector({
  selectedDate,
  onSelectDate,
} : DateSelectorProps) {
  const dateRailRef = useRef<HTMLDivElement>(null);

  const scrollDates = (direction: "next" | "prev") => {
    dateRailRef.current?.scrollBy({
      left: direction === "next" ? 210 : -210,
      behavior: "smooth",
    });
  };

  // Generate next 14 days dynamically starting from today
  const availableDates = useMemo(() => {
    const dates: BookingDate[] = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const dayShort = d
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase();
      const dayNum = String(d.getDate()).padStart(2, "0");
      const monthShort = d
        .toLocaleDateString("en-US", { month: "short" })
        .toUpperCase();
      const fullDateString = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}-${dayNum}`;
      const formattedDisplay = `${dayNum} ${monthShort} ${d.getFullYear()}`;

      dates.push({
        dateObj: d,
        dayShort,
        dayNum,
        monthShort,
        fullDateString,
        formattedDisplay,
      });
    }

    return dates;
  }, []);

  return (
    <div className="w-full vc-time-date-selector">
      <div className="flex items-center justify-between mb-4 vc-time-section-label">
        <label className="text-xs sm:text-sm tracking-[0.22em] uppercase font-bold text-brand-gold">
          SELECT DATE <span className="text-brand-orange">*</span>
        </label>
        {selectedDate && (
          <span className="text-xs sm:text-sm text-brand-gold-light/90 font-light tracking-wide">
            {selectedDate.formattedDisplay}
          </span>
        )}
      </div>

      <div className="vc-time-date-viewport">
        <div
          ref={dateRailRef}
          className="vc-time-date-rail flex gap-4 overflow-x-auto pb-4 pt-1.5 scroll-smooth scrollbar-thin scrollbar-thumb-brand-charcoal-light scrollbar-track-transparent"
        >
          {availableDates.map((item) => {
            const isSelected =
              selectedDate?.fullDateString === item.fullDateString;

            return (
              <button
                key={item.fullDateString}
                type="button"
                onClick={() => onSelectDate(item)}
                aria-label={`Select ${item.dayShort}, ${item.formattedDisplay}`}
                className={`w-[130px] min-w-[130px] h-[150px] p-5 px-4 flex flex-col items-center justify-between text-center rounded-[14px] border flex-shrink-0 transition-all duration-250 cursor-pointer ${
                  isSelected
                    ? "bg-[#221b12] border-brand-gold text-[#dfc27e] shadow-[0_0_24px_rgba(200,164,90,0.32)] -translate-y-1.5 ring-1 ring-brand-gold/50"
                    : "bg-[#161616] border-brand-gold/15 text-brand-muted hover:border-brand-gold/45 hover:text-white hover:-translate-y-1"
                }`}
              >
                <span
                  className={`text-[0.8125rem] sm:text-sm tracking-[0.2em] uppercase font-semibold ${
                    isSelected ? "text-brand-gold" : "text-brand-muted/70"
                  }`}
                >
                  {item.dayShort}
                </span>
                <span
                  className={`text-[2.1rem] sm:text-[2.35rem] font-bold tracking-tight my-auto ${
                    isSelected ? "text-gold-gradient" : "text-[#f5f0e8]"
                  }`}
                >
                  {item.dayNum}
                </span>
                <span
                  className={`text-xs sm:text-[0.8125rem] tracking-[0.18em] uppercase font-medium ${
                    isSelected ? "text-brand-gold-light/90" : "text-brand-muted/60"
                  }`}
                >
                  {item.monthShort}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="vc-time-date-arrow"
          aria-label="Show more dates"
          onClick={() => scrollDates("next")}
        >
          ›
        </button>
      </div>
    </div>
  );

}
