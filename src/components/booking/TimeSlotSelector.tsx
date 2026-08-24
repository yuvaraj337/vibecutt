"use client";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TimeSlotSelector — VIBE CUT Booking
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Dynamically generates 30-minute appointment slots
   according to salonConfig (Mon-Sat 10AM-8PM, Sun 10AM-6PM)
   and visibly disables unavailable/booked/past slots.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import React, { useMemo } from "react";
import { type BookingDate } from "./DateSelector";
import { SALON_CONFIG } from "@/data/salonConfig";

interface TimeSlotSelectorProps {
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  selectedDate: BookingDate | null;
  unavailableSlots?: string[];
}

// Helper to convert "10:00 AM" format to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [time, period] = timeStr.split(" ");
  const [hoursStr, minsStr] = time.split(":");
  let hours = parseInt(hoursStr, 10);
  const mins = parseInt(minsStr, 10);

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 60 + mins;
}

// Helper to convert minutes from midnight to "10:00 AM" format
function minutesToTime(totalMins: number): string {
  let hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const period = hours >= 12 ? "PM" : "AM";

  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  const hoursStr = String(hours).padStart(2, "0");
  const minsStr = String(mins).padStart(2, "0");
  return `${hoursStr}:${minsStr} ${period}`;
}

export default function TimeSlotSelector({
  selectedTime,
  onSelectTime,
  selectedDate,
  unavailableSlots = [],
}: TimeSlotSelectorProps) {
  // Generate slots for the selected date based on working hours
  const generatedSlots = useMemo(() => {
    if (!selectedDate) return [];

    const dayName = selectedDate.dateObj.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const schedule =
      SALON_CONFIG.defaultWorkingHours[dayName] ||
      SALON_CONFIG.defaultWorkingHours["Monday"];

    if (schedule.isClosed) return [];

    const startMins = timeToMinutes(schedule.open);
    const endMins = timeToMinutes(schedule.close);
    const interval = SALON_CONFIG.slotDurationMinutes || 30;

    const slots: string[] = [];
    for (let m = startMins; m + interval <= endMins; m += interval) {
      slots.push(minutesToTime(m));
    }

    return slots;
  }, [selectedDate]);

  // Check if slot has already passed for today
  const isSlotPast = (slot: string): boolean => {
    if (!selectedDate) return false;
    const today = new Date();
    const isToday =
      selectedDate.dateObj.getDate() === today.getDate() &&
      selectedDate.dateObj.getMonth() === today.getMonth() &&
      selectedDate.dateObj.getFullYear() === today.getFullYear();

    if (!isToday) return false;

    const currentMins = today.getHours() * 60 + today.getMinutes();
    const slotMins = timeToMinutes(slot);
    return slotMins <= currentMins;
  };

  const allSlotsPast =
    generatedSlots.length > 0 &&
    generatedSlots.every((s) => isSlotPast(s) || unavailableSlots.includes(s));

  if (!selectedDate) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs sm:text-sm tracking-[0.22em] uppercase font-bold text-brand-gold">
            SELECT TIME <span className="text-brand-orange">*</span>
          </label>
        </div>
        <div className="p-6 rounded-[12px] bg-[#161616] border border-brand-gold/15 text-center text-xs sm:text-sm text-brand-muted/80">
          Please select a date above to view available time slots.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <label className="text-xs sm:text-sm tracking-[0.22em] uppercase font-bold text-brand-gold">
          SELECT TIME <span className="text-brand-orange">*</span>
        </label>
        {selectedTime && (
          <span className="text-xs sm:text-sm text-brand-gold-light/90 font-light tracking-wide">
            {selectedTime}
          </span>
        )}
      </div>

      {/* Grid of time slots */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-3">
        {generatedSlots.map((slot) => {
          const isSelected = selectedTime === slot;
          const isBookedOrBlocked = unavailableSlots.includes(slot);
          const isPast = isSlotPast(slot);
          const isUnavailable = isBookedOrBlocked || isPast;

          return (
            <button
              key={slot}
              type="button"
              disabled={isUnavailable}
              onClick={() => onSelectTime(slot)}
              aria-label={`Select time slot ${slot}${isUnavailable ? " (Unavailable)" : ""}`}
              className={`h-11 sm:h-12 px-3 flex items-center justify-center rounded-[8px] text-xs sm:text-sm font-medium tracking-wider transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-gradient-to-r from-[#dfc27e] to-[#c8a45a] text-[#0a0a0a] font-bold shadow-[0_0_18px_rgba(200,164,90,0.35)] ring-2 ring-brand-gold/60 -translate-y-0.5"
                  : isUnavailable
                  ? "bg-[#141414] border border-white/5 text-brand-muted/30 line-through decoration-brand-muted/30 cursor-not-allowed"
                  : "bg-[#161616] border border-brand-gold/20 text-brand-white hover:border-brand-gold/50 hover:text-white hover:-translate-y-0.5"
              }`}
            >
              {slot}
            </button>
          );
        })}
      </div>

      {allSlotsPast && (
        <p className="text-xs text-brand-gold-light/80 italic mt-3 bg-brand-gold/10 p-3 rounded-[8px] border border-brand-gold/20">
          ℹ All appointment slots for this date have passed or are fully booked. Please choose an upcoming date above.
        </p>
      )}

      {generatedSlots.length === 0 && (
        <p className="text-xs text-brand-muted italic mt-2">
          No available time slots on this date.
        </p>
      )}
    </div>
  );
}
