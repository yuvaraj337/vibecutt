"use client";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FrameCanvas
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HTML Canvas renderer for the 872-frame cinematic
   sequence. Handles DPR scaling, 9:16 aspect ratio,
   progressive loading, nearest-frame fallback,
   and luxury loading state.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import {
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  type Ref,
} from "react";
import {
  FRAME_ASPECT_RATIO,
  FRAME_COUNT,
  FrameLoader,
} from "./frameSequence";

export interface FrameCanvasHandle {
  /** Render frame at index (0 to 871) on the canvas */
  renderFrame: (frameIndex: number, direction?: "down" | "up" | "idle") => void;
}

interface FrameCanvasProps {
  className?: string;
  ref?: Ref<FrameCanvasHandle>;
  showFrameCounter?: boolean;
}

export default function FrameCanvas({
  className,
  ref,
  showFrameCounter = true,
}: FrameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameLoaderRef = useRef<FrameLoader | null>(null);
  const currentFrameRef = useRef<number>(0);
  const lastRenderedImageRef = useRef<HTMLImageElement | null>(null);
  const lastRenderedIndexRef = useRef<number>(0);
  const rafIdRef = useRef<number>(0);
  const isFirstFrameReadyRef = useRef<boolean>(false);

  // ── Render Luxury Loading State ──
  const renderLoadingState = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Deep black / charcoal background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#0a0a0a");
      bgGrad.addColorStop(0.5, "#141414");
      bgGrad.addColorStop(1, "#080808");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient gold glow
      const cx = width / 2;
      const cy = height * 0.45;
      const glowR = Math.min(width, height) * 0.4;
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glowGrad.addColorStop(0, "rgba(200, 164, 90, 0.08)");
      glowGrad.addColorStop(0.5, "rgba(200, 164, 90, 0.02)");
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // Brand text: VIBE CUT
      const titleSize = Math.max(16, width * 0.065);
      ctx.save();
      ctx.font = `600 ${titleSize}px 'Playfair Display', Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#dfc27e";
      ctx.fillText("VIBE CUT", cx, cy - 20);

      // Subtitle: MEN'S SALON
      const subSize = Math.max(9, width * 0.028);
      ctx.font = `400 ${subSize}px 'Inter', sans-serif`;
      ctx.fillStyle = "#9c9488";
      ctx.fillText("MEN'S SALON", cx, cy + 12);

      // Status: LOADING EXPERIENCE
      const statusSize = Math.max(8, width * 0.024);
      ctx.font = `300 ${statusSize}px 'Inter', sans-serif`;
      ctx.fillStyle = "rgba(200, 164, 90, 0.6)";
      ctx.fillText("LOADING EXPERIENCE", cx, cy + 50);

      // Subtle pulse line
      const lineWidth = width * 0.28;
      ctx.strokeStyle = "rgba(200, 164, 90, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - lineWidth / 2, cy + 68);
      ctx.lineTo(cx + lineWidth / 2, cy + 68);
      ctx.stroke();

      ctx.restore();
    },
    []
  );

  // ── Draw Image to Canvas (Cover & Centered) ──
  const drawImageCover = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement,
      cw: number,
      ch: number,
      frameIdx: number
    ) => {
      const nw = img.naturalWidth || 540;
      const nh = img.naturalHeight || 960;
      const imgAspect = nw / nh;
      const canvasAspect = cw / ch;

      let sx = 0;
      let sy = 0;
      let sw = nw;
      let sh = nh;

      if (imgAspect > canvasAspect) {
        // Image is wider than canvas — crop horizontal sides
        sw = nh * canvasAspect;
        sx = (nw - sw) / 2;
      } else {
        // Image is taller than canvas — crop vertical ends
        sh = nw / canvasAspect;
        sy = (nh - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);

      // ── Subtle Frame Counter (Development / Inspection) ──
      if (showFrameCounter) {
        const counterSize = Math.max(9, cw * 0.024);
        ctx.save();
        ctx.font = `400 ${counterSize}px 'Inter', monospace, sans-serif`;
        ctx.fillStyle = "rgba(223, 194, 126, 0.35)";
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        const paddedCurrent = String(frameIdx + 1).padStart(4, "0");
        const paddedTotal = String(FRAME_COUNT).padStart(4, "0");
        ctx.fillText(
          `${paddedCurrent} / ${paddedTotal}`,
          cw - counterSize * 1.2,
          ch - counterSize * 0.9
        );
        ctx.restore();
      }
    },
    [showFrameCounter]
  );

  // ── Resize canvas to fit container, preserving 9:16 ──
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    if (containerWidth === 0 || containerHeight === 0) return;

    const containerAspect = containerWidth / containerHeight;

    let drawWidth: number;
    let drawHeight: number;

    if (containerAspect > FRAME_ASPECT_RATIO) {
      // Container is wider — constrain by height
      drawHeight = containerHeight;
      drawWidth = drawHeight * FRAME_ASPECT_RATIO;
    } else {
      // Container is taller — constrain by width
      drawWidth = containerWidth;
      drawHeight = drawWidth / FRAME_ASPECT_RATIO;
    }

    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(drawWidth * dpr);
    canvas.height = Math.round(drawHeight * dpr);
    canvas.style.width = `${drawWidth}px`;
    canvas.style.height = `${drawHeight}px`;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    // Re-render current frame at new resolution
    renderFrameInternal(currentFrameRef.current);
  }, []);

  // ── Internal frame render ──
  const renderFrameInternal = useCallback(
    (frameIndex: number, direction: "down" | "up" | "idle" = "down") => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const drawWidth = canvas.width / dpr;
      const drawHeight = canvas.height / dpr;

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const loader = frameLoaderRef.current;

        if (!loader) {
          renderLoadingState(ctx, drawWidth, drawHeight);
          return;
        }

        // 1. Try to get the exact requested frame
        const exactImg = loader.getCachedFrame(frameIndex);

        if (exactImg) {
          lastRenderedImageRef.current = exactImg;
          lastRenderedIndexRef.current = frameIndex;
          isFirstFrameReadyRef.current = true;
          drawImageCover(ctx, exactImg, drawWidth, drawHeight, frameIndex);
        } else {
          // 2. Fallback: Draw the nearest already-cached frame to prevent flashing
          const fallbackImg =
            loader.getNearestCachedFrame(frameIndex) ||
            lastRenderedImageRef.current;

          if (fallbackImg) {
            drawImageCover(
              ctx,
              fallbackImg,
              drawWidth,
              drawHeight,
              lastRenderedIndexRef.current
            );
          } else {
            // No frame loaded at all yet — show luxury loading state
            renderLoadingState(ctx, drawWidth, drawHeight);
          }

          // 3. Request the exact frame asynchronously
          loader.loadFrame(frameIndex);
        }

        // 4. Preload surrounding frames in the direction of scroll
        loader.preloadAround(frameIndex, direction);
      });
    },
    [drawImageCover, renderLoadingState]
  );

  // ── Expose renderFrame handle via ref ──
  useImperativeHandle(
    ref,
    () => ({
      renderFrame: (
        frameIndex: number,
        direction: "down" | "up" | "idle" = "down"
      ) => {
        currentFrameRef.current = frameIndex;
        renderFrameInternal(frameIndex, direction);
      },
    }),
    [renderFrameInternal]
  );

  // ── Setup: lifecycle, resize observer & frame loader ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create frame loader instance
    const loader = new FrameLoader({
      preloadAhead: 28,
      preloadBehind: 14,
      onFirstFrameReady: (firstImg) => {
        isFirstFrameReadyRef.current = true;
        lastRenderedImageRef.current = firstImg;
        lastRenderedIndexRef.current = 0;
        renderFrameInternal(currentFrameRef.current);
      },
      onFrameLoaded: (loadedIndex) => {
        // If the loaded frame matches current requested frame, re-render immediately
        if (currentFrameRef.current === loadedIndex) {
          renderFrameInternal(loadedIndex);
        }
      },
    });

    frameLoaderRef.current = loader;

    // Priority-load first frame immediately
    loader.loadFirstFrame();

    // Observe container size
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(container);

    // Initial sizing and render
    resizeCanvas();

    return () => {
      resizeObserver.disconnect();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      loader.dispose();
      frameLoaderRef.current = null;
    };
  }, [resizeCanvas, renderFrameInternal]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          imageRendering: "auto",
        }}
      />
    </div>
  );
}
