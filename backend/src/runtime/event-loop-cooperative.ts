/**
 * Keeps /health/live and auth routes responsive while heavy cockpit aggregation runs.
 * Monitors event-loop lag and yields aggressively when the loop is saturated.
 */
import { logger } from "../config/logger.js";

const LAG_WARN_MS = Number(process.env.EVENT_LOOP_LAG_WARN_MS ?? 200);
const LAG_PAUSE_MS = Number(process.env.EVENT_LOOP_LAG_PAUSE_MS ?? 100);
const MONITOR_INTERVAL_MS = Number(process.env.EVENT_LOOP_MONITOR_INTERVAL_MS ?? 500);
const SMOOTH_WINDOW = Math.max(3, Number(process.env.EVENT_LOOP_LAG_SMOOTH_WINDOW ?? 11));
const LAG_WARN_EVERY_MS = Number(process.env.EVENT_LOOP_LAG_WARN_EVERY_MS ?? 10_000);

let recentLagMs = 0;
let smoothedLagMs = 0;
let monitorStarted = false;
let heavyWorkPaused = false;
let lastLagWarnAtMs = 0;
const lagRing: number[] = [];

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
}

export function getRecentEventLoopLagMs(): number {
  return recentLagMs;
}

/** Median of recent samples — used for admission so a sticky single-sample lag cannot lock out Pillow. */
export function getSmoothedEventLoopLagMs(): number {
  return smoothedLagMs;
}

export function isHeavyWorkPaused(): boolean {
  return heavyWorkPaused;
}

/**
 * After a known synchronous block (sql.js export), the lag monitor reports a
 * single huge sample. Clear it so residual ghost lag cannot keep admission
 * closed or accumulate toward HA high-lag exit while the loop is healthy again.
 */
export function clearEventLoopLagAfterKnownBlock(reason = "known-block"): void {
  recentLagMs = 0;
  smoothedLagMs = 0;
  heavyWorkPaused = false;
  lagRing.length = 0;
  logger.info({ reason }, "Event-loop lag cleared after known synchronous block");
}

export function startEventLoopLagMonitor(): void {
  if (monitorStarted) return;
  monitorStarted = true;

  let expected = performance.now() + MONITOR_INTERVAL_MS;
  const tick = () => {
    const now = performance.now();
    const lag = Math.max(0, now - expected);
    recentLagMs = lag;
    lagRing.push(lag);
    while (lagRing.length > SMOOTH_WINDOW) lagRing.shift();
    smoothedLagMs = median(lagRing);
    // Pause heavy work on smoothed lag so transient spikes don't wedge the process.
    heavyWorkPaused = smoothedLagMs >= LAG_PAUSE_MS;

    if (lag >= LAG_WARN_MS && Date.now() - lastLagWarnAtMs >= LAG_WARN_EVERY_MS) {
      lastLagWarnAtMs = Date.now();
      logger.warn(
        { lagMs: Math.round(lag), smoothedLagMs: Math.round(smoothedLagMs) },
        "Event loop lag detected",
      );
    }

    expected = now + MONITOR_INTERVAL_MS;
    setTimeout(tick, MONITOR_INTERVAL_MS).unref();
  };

  setTimeout(tick, MONITOR_INTERVAL_MS).unref();
}

/** Yield to the event loop; extra delay when lag is high. */
export async function cooperativeYield(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
  if (heavyWorkPaused || recentLagMs >= LAG_PAUSE_MS) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

/** Wait until event loop lag drops or maxWaitMs elapses. */
export async function waitForEventLoopCapacity(maxWaitMs = 2_000): Promise<void> {
  const deadline = performance.now() + maxWaitMs;
  while (heavyWorkPaused && performance.now() < deadline) {
    await cooperativeYield();
  }
}
