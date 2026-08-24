"use client";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CinematicScrollHero
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Full-screen cinematic hero with scroll-controlled
   872-frame sequence. The canvas stays sticky while the
   user scrolls through the tall section.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import { useRef, useEffect, useState } from "react";
import FrameCanvas, { type FrameCanvasHandle } from "./FrameCanvas";
import { progressToFrameIndex, SCROLL_HEIGHT_VH } from "./frameSequence";

interface CinematicScrollHeroProps {
  onOpenBooking?: () => void;
}

export default function CinematicScrollHero({ onOpenBooking }: CinematicScrollHeroProps = {}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasHandleRef = useRef<FrameCanvasHandle>(null);
  const ticking = useRef(false);
  const lastProgressRef = useRef(0);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // ── Detect reduced motion preference ──
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Scroll → Frame mapping ──
  useEffect(() => {
    if (prefersReducedMotion) {
      canvasHandleRef.current?.renderFrame(progressToFrameIndex(0.5), "idle");
      return;
    }

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const section = sectionRef.current;
        if (!section) {
          ticking.current = false;
          return;
        }

        const rect = section.getBoundingClientRect();
        const sectionHeight = section.offsetHeight;
        const viewportHeight = window.innerHeight;

        const scrollableDistance = sectionHeight - viewportHeight;
        const scrolled = -rect.top;
        const progress = Math.max(
          0,
          Math.min(1, scrolled / scrollableDistance)
        );

        const direction: "down" | "up" | "idle" =
          progress > lastProgressRef.current
            ? "down"
            : progress < lastProgressRef.current
            ? "up"
            : "idle";
        lastProgressRef.current = progress;

        const frameIndex = progressToFrameIndex(progress);
        canvasHandleRef.current?.renderFrame(frameIndex, direction);

        // Hide scroll indicator once user starts scrolling
        if (progress > 0.015) {
          setShowScrollIndicator(false);
        } else {
          setShowScrollIndicator(true);
        }

        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="cinematic-hero"
      className="relative"
      style={{ height: `${SCROLL_HEIGHT_VH}vh` }}
    >
      {/* ── Sticky viewport ── */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-brand-black">
        {/* ── Ambient glow background ── */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute"
            style={{
              top: "5%",
              left: "10%",
              width: "50vw",
              height: "50vw",
              background:
                "radial-gradient(ellipse, rgba(200,164,90,0.04) 0%, transparent 65%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute"
            style={{
              bottom: "8%",
              right: "8%",
              width: "35vw",
              height: "35vw",
              background:
                "radial-gradient(ellipse, rgba(200,164,90,0.03) 0%, transparent 65%)",
              filter: "blur(100px)",
            }}
          />
        </div>

        {/* ── Main layout: flex column with 3 zones ── */}
        <div className="relative z-10 flex flex-col h-full">
          {/* ── Zone 1: Brand (top) — Desktop only, hidden on mobile ── */}
          <div className="hidden sm:flex flex-shrink-0 flex-col items-center sm:pt-6 sm:pb-2 md:pt-7 md:pb-3">
            <h1
              className="text-gold-gradient tracking-[0.35em] sm:text-2xl md:text-3xl font-semibold"
              style={{ fontFamily: "var(--font-family-display)" }}
            >
              VIBE CUT
            </h1>
            <p
              className="mt-1 text-brand-muted text-[0.6rem] md:text-[0.65rem] tracking-[0.35em] uppercase font-light"
              style={{ fontFamily: "var(--font-family-body)" }}
            >
              Men&apos;s Salon
            </p>
          </div>

          {/* ── Zone 2: Cinematic canvas (flex-grow center) ── */}
          <div className="flex-1 min-h-0 flex items-center justify-center pt-2 pb-1 sm:pt-0 sm:pb-0 px-2 sm:px-4 md:px-8">
            <div
              className="relative gold-glow"
              style={{
                /* Preserve 9:16 aspect ratio, fill available vertical height */
                aspectRatio: "9 / 16",
                height: "100%",
                maxHeight: "100%",
                maxWidth: "min(94vw, 56.25vh)",
              }}
            >
              {/* Subtle border frame */}
              <div
                className="absolute -inset-px pointer-events-none z-20"
                style={{
                  border: "1px solid rgba(200, 164, 90, 0.12)",
                }}
              />
              <FrameCanvas ref={canvasHandleRef} className="w-full h-full" />
            </div>
          </div>

          {/* ── Zone 3: Tagline + CTAs + Scroll indicator (bottom) ── */}
          <div className="flex-shrink-0 flex flex-col items-center pt-2 pb-2.5 sm:pt-3.5 sm:pb-5 lg:pb-6">
            {/* Tagline */}
            <p
              className="text-brand-gold/90 text-[0.6rem] sm:text-[0.7rem] tracking-[0.25em] sm:tracking-[0.28em] uppercase mb-2 sm:mb-4 font-medium"
              style={{ fontFamily: "var(--font-family-body)" }}
            >
              Sharp Style. Smart Price.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 w-full px-4 mb-2 sm:mb-3">
              <button
                id="cta-book"
                onClick={onOpenBooking}
                className="btn-primary"
                aria-label="Book an appointment"
              >
                Book Appointment
              </button>
              <button
                id="cta-services"
                onClick={() => {
                  const el = document.getElementById("services-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="btn-secondary"
                aria-label="Explore our services"
              >
                Explore Services
              </button>
            </div>

            {/* Scroll indicator */}
            <div
              className="transition-opacity duration-700 ease-out"
              style={{ opacity: showScrollIndicator ? 1 : 0 }}
            >
              <div
                className="flex flex-col items-center gap-1"
                style={{
                  animation: showScrollIndicator
                    ? "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                    : "none",
                }}
              >
                <span
                  className="text-[0.5rem] sm:text-[0.525rem] tracking-[0.3em] uppercase text-brand-muted/60"
                  style={{ fontFamily: "var(--font-family-body)" }}
                >
                  Scroll to explore
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-brand-gold/40"
                >
                  <path
                    d="M8 2 L8 12 M4 8 L8 12 L12 8"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
