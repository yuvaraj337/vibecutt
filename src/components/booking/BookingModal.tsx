"use client";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BookingModal — VIBE CUT (Complete 4-Step Flow)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Spacious, architectural luxury booking experience:
   - Step 1: SERVICE (Selection + Change Service)
   - Step 2: DATE & TIME (14-day carousel + Slots with conflict detection)
   - Step 3: CUSTOMER DETAILS + LIVE SUMMARY (2-column desktop layout)
   - Step 4: CONFIRMATION (Reference ID + Book Another / Return Home)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import React, { useState, useEffect, useCallback } from "react";
import { SERVICES_DATA, type ServiceItem } from "@/data/services";
import { type Appointment } from "@/lib/types";
import {
  createAppointment,
  getBookedTimes,
  getBlockedSlots,
  getBlockedDates,
} from "@/lib/appointmentService";
import BookingProgressIndicator, {
  type BookingStep,
} from "./BookingProgressIndicator";
import ServiceSelector from "./ServiceSelector";
import DateSelector, { type BookingDate } from "./DateSelector";
import TimeSlotSelector from "./TimeSlotSelector";
import CustomerDetailsForm, {
  type CustomerDetails,
} from "./CustomerDetailsForm";
import BookingSummary from "./BookingSummary";
import BookingSuccess from "./BookingSuccess";

interface BookingModalProps {
  isOpen: boolean;
  initialService?: ServiceItem | null;
  onClose: () => void;
}

export default function BookingModal({
  isOpen,
  initialService,
  onClose,
}: BookingModalProps) {
  // ── Step State ──
  const [step, setStep] = useState<BookingStep>("service");

  // ── Selection State ──
  const [selectedService, setSelectedService] = useState<ServiceItem>(
    initialService || SERVICES_DATA[0]
  );
  const [selectedDate, setSelectedDate] = useState<BookingDate | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // ── Customer Form State ──
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    fullName: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof CustomerDetails, string>>
  >({});

  // ── Availability & Conflict State ──
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Confirmed Appointment State ──
  const [confirmedAppointment, setConfirmedAppointment] =
    useState<Appointment | null>(null);

  // Reset entire flow
  const resetBookingFlow = useCallback(() => {
    setStep("service");
    setSelectedService(initialService || SERVICES_DATA[0]);
    setSelectedDate(null);
    setSelectedTime(null);
    setCustomerDetails({ fullName: "", phone: "", email: "", notes: "" });
    setFormErrors({});
    setConflictError(null);
    setIsSubmitting(false);
    setConfirmedAppointment(null);
  }, [initialService]);

  // Sync initialService whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialService) {
        setSelectedService(initialService);
      }
    } else {
      resetBookingFlow();
    }
  }, [isOpen, initialService, resetBookingFlow]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Fetch unavailable slots when date changes
  useEffect(() => {
    if (!selectedDate) {
      setUnavailableSlots([]);
      return;
    }

    let isMounted = true;
    const fetchAvailability = async () => {
      try {
        const [bookedTimes, blockedSlotsList, blockedDatesList] =
          await Promise.all([
            getBookedTimes(selectedDate.fullDateString),
            getBlockedSlots(selectedDate.fullDateString),
            getBlockedDates(),
          ]);

        if (!isMounted) return;

        setBlockedDates(blockedDatesList);

        const activeBookedTimes = bookedTimes;
        const adminBlockedTimes = blockedSlotsList.map((s) => s.time);

        setUnavailableSlots([
          ...new Set([...activeBookedTimes, ...adminBlockedTimes]),
        ]);
      } catch (err) {
        console.error("Error fetching slot availability:", err);
      }
    };

    fetchAvailability();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // ── Indian Phone Validation & Normalization ──
  const validatePhone = (rawPhone: string): { isValid: boolean; formatted: string; error?: string } => {
    const cleaned = rawPhone.replace(/\D/g, "");
    
    // Check if 10 digits (or 12 digits starting with 91, or 11 with leading 0)
    let tenDigit = "";
    if (cleaned.length === 10) {
      tenDigit = cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
      tenDigit = cleaned.slice(2);
    } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
      tenDigit = cleaned.slice(1);
    }

    if (!tenDigit || tenDigit.length !== 10) {
      return {
        isValid: false,
        formatted: rawPhone,
        error: "Please enter a valid 10-digit Indian WhatsApp number.",
      };
    }

    if (!/^[6-9]/.test(tenDigit)) {
      return {
        isValid: false,
        formatted: rawPhone,
        error: "Phone number must start with 6, 7, 8, or 9.",
      };
    }

    return {
      isValid: true,
      formatted: `+91 ${tenDigit.slice(0, 5)} ${tenDigit.slice(5)}`,
    };
  };

  // ── Form Validation ──
  const validateDetailsForm = (): boolean => {
    const errors: Partial<Record<keyof CustomerDetails, string>> = {};

    if (!customerDetails.fullName.trim() || customerDetails.fullName.trim().length < 2) {
      errors.fullName = "Please enter your full name (minimum 2 characters).";
    }

    const phoneValidation = validatePhone(customerDetails.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error || "Please enter a valid WhatsApp number.";
    }

    if (customerDetails.email && customerDetails.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerDetails.email.trim())) {
        errors.email = "Please enter a valid email address.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit Booking ──
  const handleConfirmBooking = async () => {
    if (!validateDetailsForm()) return;
    if (!selectedDate || !selectedTime) {
      setStep("time");
      return;
    }

    setIsSubmitting(true);
    setConflictError(null);

    const phoneValidation = validatePhone(customerDetails.phone);

    try {
      const result = await createAppointment({
        service_id: selectedService.id,
        service_name: selectedService.name,
        price: selectedService.price,
        appointment_date: selectedDate.fullDateString,
        appointment_time: selectedTime,
        customer_name: customerDetails.fullName.trim(),
        phone: phoneValidation.formatted,
        email: customerDetails.email?.trim() || undefined,
        notes: customerDetails.notes?.trim() || undefined,
      });

      if (result.success && result.appointment) {
        setConfirmedAppointment(result.appointment);
        setStep("confirmed");
      } else {
        // Slot conflict or creation error
        const errorMessage =
          result.error ||
          "This time slot is no longer available. Please choose another time.";
        setConflictError(errorMessage);
        // Return customer to Step 2 to pick a new slot
        setStep("time");
        setSelectedTime(null);
        // Refresh unavailable slots
        const activeBookedTimes = await getBookedTimes(
          selectedDate.fullDateString
        );
        setUnavailableSlots((prev) => [
          ...new Set([...prev, ...activeBookedTimes]),
        ]);
      }
    } catch (err) {
      console.error("Booking error:", err);
      setConflictError("An unexpected error occurred. Please try again.");
      setStep("time");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-y-auto"
    >
      {/* ── Dark Backdrop ── */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* ── Modal Dialog Panel (Desktop: width min(1100px, calc(100vw - 80px)), min-height 680px) ── */}
      <div className={`vc-booking-panel relative z-10 w-full max-w-[1180px] md:w-[min(1180px,calc(100vw-40px))] h-[min(720px,calc(100vh-32px))] my-auto bg-[#031122] border border-brand-gold/70 rounded-[18px] shadow-[0_32px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(200,164,90,0.10)] flex flex-col justify-start overflow-hidden ${step === "time" ? "vc-booking-panel--time" : step === "details" ? "vc-booking-panel--details" : step === "confirmed" ? "vc-booking-panel--confirmed" : ""}`}>
        
        {/* ── Header Area (Hidden in confirmed step for clean thank-you experience) ── */}
        <div className="vc-booking-header">
          <div className="vc-booking-topline">
            <span className="vc-booking-id">{step === "time" ? "02" : step === "details" ? "03" : step === "confirmed" ? "04" : "01"}</span>
            <div className="vc-booking-brand">
              <span>VIBE CUT</span>
              <small>MEN&apos;S SALON</small>
            </div>
            <span className="vc-booking-step-badge">{step === "time" ? "TIME" : step === "details" ? "DETAILS" : step === "confirmed" ? "CONFIRM" : "SERVICE"}</span>
          </div>

          <div className="vc-booking-title-row">
            <div>
              <h3
                id="booking-modal-title"
                className="vc-booking-title"
              >
                BOOK YOUR APPOINTMENT
              </h3>
              <p className="vc-booking-subtitle">
                Choose your service, date and preferred time.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close booking modal"
              className="vc-booking-close"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── 4-Step Progress Stepper ── */}
        <div className="flex-shrink-0">
          <BookingProgressIndicator currentStep={step} />
        </div>

        {/* ── Conflict Error Alert ── */}
        {conflictError && (
          <div className="mx-6 sm:mx-10 mb-4 p-4 rounded-[10px] bg-red-950/40 border border-red-500/50 flex items-center gap-3 text-red-200 text-xs sm:text-sm">
            <span className="text-lg">⚠</span>
            <span>{conflictError}</span>
          </div>
        )}

        {/* ── Booking Content Body (Spacious & Responsive) ── */}
        <div className="vc-booking-body px-6 sm:px-8 pb-6 flex flex-col flex-1 min-h-0 overflow-hidden">
          
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
             STEP 1: SERVICE
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === "service" && (
            <div className="flex flex-col flex-1 justify-between animate-fade-in">
              <div className="space-y-6">
                {/* Back to Services trigger */}
                <div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm tracking-[0.16em] uppercase text-brand-gold hover:text-brand-gold-light hover:underline underline-offset-4 transition-colors cursor-pointer"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Services
                  </button>
                </div>

                {/* Selected Service Card Component */}
                <ServiceSelector
                  selectedService={selectedService}
                  onSelectService={setSelectedService}
                />
              </div>

              {/* Step 1 Bottom CTA */}
              <div className="mt-8 pt-6 border-t border-brand-gold/15 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep("time")}
                  className="btn-primary w-full sm:w-auto min-w-[240px] text-xs sm:text-sm tracking-[0.18em] uppercase py-3.5 px-8 flex items-center justify-center gap-2"
                >
                  <span>Continue to Date & Time</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
             STEP 2: DATE & TIME
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === "time" && (
            <div className="vc-time-step flex flex-col flex-1 justify-between animate-fade-in space-y-7">
              <div className="space-y-6 sm:space-y-7">
                {/* Back to Service button */}
                <div>
                  <button
                    type="button"
                    onClick={() => setStep("service")}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm tracking-[0.16em] uppercase text-brand-gold hover:text-brand-gold-light hover:underline underline-offset-4 transition-colors cursor-pointer"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Service
                  </button>
                </div>

                {/* Date Selector */}
                <DateSelector
                  selectedDate={selectedDate}
                  onSelectDate={(d) => {
                    setSelectedDate(d);
                    setSelectedTime(null); // Reset time when date changes
                    setConflictError(null);
                  }}
                />

                {/* Time Slot Selector */}
                <div className="pt-2">
                  <TimeSlotSelector
                    selectedTime={selectedTime}
                    onSelectTime={(t) => {
                      setSelectedTime(t);
                      setConflictError(null);
                    }}
                    selectedDate={selectedDate}
                    unavailableSlots={unavailableSlots}
                  />
                </div>
              </div>

              {/* Step 2 Bottom Navigation */}
              <div className="pt-6 border-t border-brand-gold/15 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setStep("service")}
                  className="btn-secondary w-full sm:w-auto min-w-[150px] text-xs uppercase tracking-wider"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep("details")}
                  className={`btn-primary w-full sm:w-auto min-w-[240px] text-xs sm:text-sm tracking-[0.18em] uppercase py-3.5 px-8 flex items-center justify-center gap-2 ${
                    !selectedDate || !selectedTime
                      ? "opacity-40 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <span>Continue to Details</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
             STEP 3: CUSTOMER DETAILS + LIVE SUMMARY
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === "details" && (
            <div className="vc-details-step flex flex-col flex-1 justify-between animate-fade-in space-y-7">
              <div className="space-y-5">
                {/* Back to Date & Time */}
                <div>
                  <button
                    type="button"
                    onClick={() => setStep("time")}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm tracking-[0.16em] uppercase text-brand-gold hover:text-brand-gold-light hover:underline underline-offset-4 transition-colors cursor-pointer"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Date & Time
                  </button>
                </div>

                {/* 2-Column Layout: Form (Left) & Summary (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 lg:gap-8 items-start">
                  <CustomerDetailsForm
                    details={customerDetails}
                    onChange={(updated) => {
                      setCustomerDetails(updated);
                      // Clear errors on change
                      if (formErrors.fullName && updated.fullName.trim().length >= 2) {
                        setFormErrors((prev) => ({ ...prev, fullName: undefined }));
                      }
                      if (formErrors.phone && updated.phone.trim().length >= 10) {
                        setFormErrors((prev) => ({ ...prev, phone: undefined }));
                      }
                    }}
                    errors={formErrors}
                  />

                  <BookingSummary
                    service={selectedService}
                    date={selectedDate}
                    time={selectedTime}
                    customer={customerDetails}
                  />
                </div>
              </div>

              {/* Step 3 Bottom Navigation */}
              <div className="pt-6 border-t border-brand-gold/15 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep("time")}
                  className="btn-secondary w-full sm:w-auto min-w-[180px] text-xs uppercase tracking-wider"
                >
                  ← Back to Date & Time
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmBooking}
                  className={`btn-primary w-full sm:w-auto min-w-[260px] text-xs sm:text-sm tracking-[0.18em] uppercase py-3.5 px-8 flex items-center justify-center gap-2 ${
                    isSubmitting ? "opacity-75 cursor-wait" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-black"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Confirming Request...
                    </span>
                  ) : (
                    <span>Confirm Appointment →</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
             STEP 4: CONFIRMATION
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === "confirmed" && confirmedAppointment && (
            <BookingSuccess
              appointment={confirmedAppointment}
              onBookAnother={resetBookingFlow}
              onClose={onClose}
            />
          )}

        </div>
      </div>
    </div>
  );
}
