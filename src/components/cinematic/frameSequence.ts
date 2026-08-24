/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Frame Sequence Engine — VIBE CUT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Handles 872 real cinematic frames (540×960, 9:16).
   Features progressive loading, sliding window cache,
   nearest-frame fallback, and smooth scroll mapping.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

// ── Configuration ───────────────────────────────

/** Total number of frames in the cinematic sequence */
export const FRAME_COUNT = 872;

/** Frame file format extension */
export const FRAME_EXTENSION = "jpg";

/** Base directory for frame files (relative to /public) */
export const FRAME_BASE_PATH = "/cinematic";

/** Set to false to render real video frames */
export const USE_TEST_FRAMES = false;

/** 9:16 aspect ratio constant (540 / 960) */
export const FRAME_ASPECT_RATIO = 9 / 16;

/** Scroll height multiplier — spans 750vh for smooth 872-frame progression */
export const SCROLL_HEIGHT_VH = 750;

/** Maximum frames kept in memory cache simultaneously */
export const MAX_CACHE_SIZE = 180;

/** Max concurrent image downloads */
export const MAX_CONCURRENT_LOADS = 8;


// ── Frame Path Generator ────────────────────────

/**
 * Generates the path for a frame at a given 1-based index.
 * Pads index to 4 digits: frame-0001.jpg, frame-0002.jpg, ..., frame-0872.jpg
 */
export function getFramePath(index: number): string {
  const clamped = Math.max(1, Math.min(FRAME_COUNT, index));
  const paddedIndex = String(clamped).padStart(4, "0");
  return `${FRAME_BASE_PATH}/frame-${paddedIndex}.${FRAME_EXTENSION}`;
}

/**
 * Generates an array of all frame paths.
 */
export function getAllFramePaths(): string[] {
  return Array.from({ length: FRAME_COUNT }, (_, i) => getFramePath(i + 1));
}


// ── Scroll-to-Frame Mapping ─────────────────────

/**
 * Maps a scroll progress value (0.0 to 1.0) to a frame index (0 to 871).
 * Continuous and deterministic mapping.
 */
export function progressToFrameIndex(progress: number): number {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  return Math.min(
    Math.floor(clampedProgress * FRAME_COUNT),
    FRAME_COUNT - 1
  );
}


// ── Frame Loader with Sliding Window Caching ────

export interface FrameLoaderOptions {
  preloadAhead?: number;
  preloadBehind?: number;
  onFirstFrameReady?: (img: HTMLImageElement) => void;
  onFrameLoaded?: (index: number) => void;
}

export class FrameLoader {
  private cache: Map<number, HTMLImageElement> = new Map();
  private loading: Set<number> = new Set();
  private queue: number[] = [];
  private activeLoads = 0;
  private options: Required<FrameLoaderOptions>;
  private isFirstFrameReady = false;

  constructor(options: FrameLoaderOptions = {}) {
    this.options = {
      preloadAhead: options.preloadAhead ?? 24,
      preloadBehind: options.preloadBehind ?? 12,
      onFirstFrameReady: options.onFirstFrameReady ?? (() => {}),
      onFrameLoaded: options.onFrameLoaded ?? (() => {}),
    };
  }

  /**
   * Load frame 0001 immediately (highest priority).
   */
  async loadFirstFrame(): Promise<HTMLImageElement | null> {
    const cached = this.cache.get(0);
    if (cached) {
      if (!this.isFirstFrameReady) {
        this.isFirstFrameReady = true;
        this.options.onFirstFrameReady(cached);
      }
      return cached;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      const path = getFramePath(1);

      img.onload = () => {
        this.cache.set(0, img);
        this.isFirstFrameReady = true;
        this.options.onFirstFrameReady(img);
        this.options.onFrameLoaded(0);
        // Begin initial preload buffer
        this.preloadAround(0);
        resolve(img);
      };

      img.onerror = () => {
        resolve(null);
      };

      img.src = path;
    });
  }

  /**
   * Check if a frame is already cached.
   */
  getCachedFrame(index: number): HTMLImageElement | null {
    return this.cache.get(index) ?? null;
  }

  /**
   * Find the closest loaded frame to `targetIndex`.
   * Prevents black frames or flashing during fast scrolling.
   */
  getNearestCachedFrame(targetIndex: number): HTMLImageElement | null {
    if (this.cache.has(targetIndex)) {
      return this.cache.get(targetIndex)!;
    }

    // Search outwards from targetIndex
    for (let offset = 1; offset < FRAME_COUNT; offset++) {
      const prev = targetIndex - offset;
      if (prev >= 0 && this.cache.has(prev)) {
        return this.cache.get(prev)!;
      }
      const next = targetIndex + offset;
      if (next < FRAME_COUNT && this.cache.has(next)) {
        return this.cache.get(next)!;
      }
    }

    return null;
  }

  /**
   * Request a frame and trigger queue processing.
   */
  loadFrame(index: number): Promise<HTMLImageElement | null> {
    if (this.cache.has(index)) {
      return Promise.resolve(this.cache.get(index)!);
    }

    if (this.loading.has(index)) {
      return Promise.resolve(null);
    }

    // Prioritize this index at front of queue
    const existingPos = this.queue.indexOf(index);
    if (existingPos !== -1) {
      this.queue.splice(existingPos, 1);
    }
    this.queue.unshift(index);

    this.processQueue();

    return Promise.resolve(null);
  }

  /**
   * Preload frames around the current scroll position.
   */
  preloadAround(currentIndex: number, direction: "down" | "up" | "idle" = "down"): void {
    const ahead = direction === "up" ? this.options.preloadBehind : this.options.preloadAhead;
    const behind = direction === "up" ? this.options.preloadAhead : this.options.preloadBehind;

    const start = Math.max(0, currentIndex - behind);
    const end = Math.min(FRAME_COUNT - 1, currentIndex + ahead);

    // Queue frames starting closest to currentIndex
    const indicesToQueue: number[] = [];
    for (let i = 0; i <= Math.max(ahead, behind); i++) {
      const nextIdx = currentIndex + i;
      if (nextIdx <= end && !this.cache.has(nextIdx) && !this.loading.has(nextIdx)) {
        indicesToQueue.push(nextIdx);
      }
      const prevIdx = currentIndex - i;
      if (prevIdx >= start && prevIdx !== currentIndex && !this.cache.has(prevIdx) && !this.loading.has(prevIdx)) {
        indicesToQueue.push(prevIdx);
      }
    }

    for (const idx of indicesToQueue) {
      if (!this.queue.includes(idx)) {
        this.queue.push(idx);
      }
    }

    this.processQueue();
    this.pruneCache(currentIndex);
  }

  /**
   * Process the download queue with concurrency limit.
   */
  private processQueue(): void {
    while (this.activeLoads < MAX_CONCURRENT_LOADS && this.queue.length > 0) {
      const nextIndex = this.queue.shift()!;
      if (this.cache.has(nextIndex) || this.loading.has(nextIndex)) {
        continue;
      }

      this.loading.add(nextIndex);
      this.activeLoads++;

      const img = new Image();
      img.decoding = "async";
      const path = getFramePath(nextIndex + 1);

      img.onload = () => {
        this.cache.set(nextIndex, img);
        this.loading.delete(nextIndex);
        this.activeLoads--;
        this.options.onFrameLoaded(nextIndex);
        this.processQueue();
      };

      img.onerror = () => {
        this.loading.delete(nextIndex);
        this.activeLoads--;
        this.processQueue();
      };

      img.src = path;
    }
  }

  /**
   * Memory management: Prune cache entries furthest from currentIndex
   * when cache exceeds MAX_CACHE_SIZE. Frame 0 is always retained.
   */
  private pruneCache(currentIndex: number): void {
    if (this.cache.size <= MAX_CACHE_SIZE) return;

    // Collect keys sorted by distance from currentIndex (descending)
    const entries = Array.from(this.cache.keys())
      .filter((idx) => idx !== 0) // Always retain frame 0001
      .sort((a, b) => Math.abs(b - currentIndex) - Math.abs(a - currentIndex));

    const toRemove = this.cache.size - MAX_CACHE_SIZE;
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i]);
    }
  }

  /**
   * Clean up all loaded resources.
   */
  dispose(): void {
    this.cache.clear();
    this.loading.clear();
    this.queue = [];
    this.activeLoads = 0;
  }
}

