/**
 * Production admission control — permanent safeguard against event-loop wedges.
 *
 * Class of failure: concurrent expensive work (Pillow session create / chat) +
 * sql.js sync export saturates the Node event loop → Railway edge 15s timeout → 502
 * while the process remains "Online".
 *
 * This module fails closed (503 + Retry-After) before queueing more work when:
 * - recent event-loop lag exceeds the admission threshold, or
 * - too many Pillow session creates are already in flight.
 *
 * Health/auth routes must never call into this gate.
 */
import { getRecentEventLoopLagMs } from "./event-loop-cooperative.js";

const LAG_REJECT_MS = Number(process.env.ADMISSION_LAG_REJECT_MS ?? 250);
const MAX_SESSION_CREATES = Math.max(
  1,
  Number(process.env.ADMISSION_MAX_PILLOW_SESSION_CREATES ?? 2),
);

let pillowSessionCreatesInFlight = 0;

export type AdmissionDecision =
  | { admit: true }
  | { admit: false; reason: string; retryAfterSec: number; lagMs: number };

export function getAdmissionStats(): {
  pillowSessionCreatesInFlight: number;
  maxPillowSessionCreates: number;
  lagRejectMs: number;
  recentLagMs: number;
} {
  return {
    pillowSessionCreatesInFlight,
    maxPillowSessionCreates: MAX_SESSION_CREATES,
    lagRejectMs: LAG_REJECT_MS,
    recentLagMs: getRecentEventLoopLagMs(),
  };
}

/** Reject expensive work when the loop is already saturated. */
export function admitExpensiveWork(label = "work"): AdmissionDecision {
  const lagMs = getRecentEventLoopLagMs();
  if (lagMs >= LAG_REJECT_MS) {
    return {
      admit: false,
      reason: `Event loop saturated (lag ${Math.round(lagMs)}ms) — refusing ${label}`,
      retryAfterSec: Math.min(30, Math.max(2, Math.ceil(lagMs / 1000) + 1)),
      lagMs,
    };
  }
  return { admit: true };
}

export function admitPillowSessionCreate(): AdmissionDecision {
  const base = admitExpensiveWork("pillow session create");
  if (!base.admit) return base;

  if (pillowSessionCreatesInFlight >= MAX_SESSION_CREATES) {
    return {
      admit: false,
      reason: `Pillow session create concurrency limit (${MAX_SESSION_CREATES})`,
      retryAfterSec: 3,
      lagMs: getRecentEventLoopLagMs(),
    };
  }
  return { admit: true };
}

export function beginPillowSessionCreate(): void {
  pillowSessionCreatesInFlight += 1;
}

export function endPillowSessionCreate(): void {
  pillowSessionCreatesInFlight = Math.max(0, pillowSessionCreatesInFlight - 1);
}

/** Test-only reset. */
export function resetAdmissionControlForTesting(): void {
  pillowSessionCreatesInFlight = 0;
}
