/**
 * Keeps /health/live and auth routes responsive while heavy cockpit aggregation runs.
 * Monitors event-loop lag and yields aggressively when the loop is saturated.
 */
import { logger } from "../config/logger.js";

const LAG_WARN_MS = Number(process.env.EVENT_LOOP_LAG_WARN_MS ?? 200);
const LAG_PAUSE_MS = Number(process.env.EVENT_LOOP_LAG_PAUSE_MS ?? 100);
const MONITOR_INTERVAL_MS = Number(process.env.EVENT_LOOP_MONITOR_INTERVAL_MS ?? 500);

let recentLagMs = 0;
let monitorStarted = false;
let heavyWorkPaused = false;

export function getRecentEventLoopLagMs(): number {
  return recentLagMs;
}

export function isHeavyWorkPaused(): boolean {
  return heavyWorkPaused;
}

export function startEventLoopLagMonitor(): void {
  if (monitorStarted) return;
  monitorStarted = true;

  let expected = performance.now() + MONITOR_INTERVAL_MS;
  const tick = () => {
    const now = performance.now();
    const lag = Math.max(0, now - expected);
    recentLagMs = lag;
    heavyWorkPaused = lag >= LAG_PAUSE_MS;

    if (lag >= LAG_WARN_MS) {
      logger.warn({ lagMs: Math.round(lag) }, "Event loop lag detected");
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
