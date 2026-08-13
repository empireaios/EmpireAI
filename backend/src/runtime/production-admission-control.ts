/**
 * Production admission control — permanent safeguard against event-loop wedges.
 *
 * Class of failure: concurrent expensive work (Pillow session create / chat) +
 * sql.js sync export saturates the Node event loop → Railway edge 15s timeout → 502
 * while the process remains "Online".
 *
 * This module fails closed (503 + Retry-After) before queueing more work when:
 * - recent event-loop lag exceeds the admission threshold, or
 * - too many Pillow session creates are already in flight, or
 * - session-create rate exceeds a hard window (protects even when lag metrics stall).
 *
 * Health/auth routes must never call into this gate.
 */
import {
  getRecentEventLoopLagMs,
  getSmoothedEventLoopLagMs,
} from "./event-loop-cooperative.js";
import { getSqlitePersistStats } from "../brain/sqlite-database.js";

/** Admission uses smoothed lag; default raised so ~500ms timer-noise cannot lock out Pillow. */
const LAG_REJECT_MS = Number(process.env.ADMISSION_LAG_REJECT_MS ?? 1_500);
const MAX_SESSION_CREATES = Math.max(
  1,
  Number(process.env.ADMISSION_MAX_PILLOW_SESSION_CREATES ?? 2),
);
/** Hard rate limit: max session creates accepted per rolling window (all callers). */
const SESSION_RATE_LIMIT = Math.max(
  1,
  Number(process.env.ADMISSION_SESSION_RATE_LIMIT ?? 4),
);
const SESSION_RATE_WINDOW_MS = Math.max(
  1_000,
  Number(process.env.ADMISSION_SESSION_RATE_WINDOW_MS ?? 10_000),
);

let pillowSessionCreatesInFlight = 0;
const sessionCreateTimestamps: number[] = [];

export type AdmissionDecision =
  | { admit: true }
  | { admit: false; reason: string; retryAfterSec: number; lagMs: number };

export function getAdmissionStats(): {
  pillowSessionCreatesInFlight: number;
  maxPillowSessionCreates: number;
  lagRejectMs: number;
  recentLagMs: number;
  sessionRateLimit: number;
  sessionRateWindowMs: number;
  sessionCreatesInWindow: number;
} {
  pruneSessionRateWindow();
  return {
    pillowSessionCreatesInFlight,
    maxPillowSessionCreates: MAX_SESSION_CREATES,
    lagRejectMs: LAG_REJECT_MS,
    recentLagMs: getSmoothedEventLoopLagMs(),
    sessionRateLimit: SESSION_RATE_LIMIT,
    sessionRateWindowMs: SESSION_RATE_WINDOW_MS,
    sessionCreatesInWindow: sessionCreateTimestamps.length,
  };
}

function pruneSessionRateWindow(): void {
  const cutoff = Date.now() - SESSION_RATE_WINDOW_MS;
  while (sessionCreateTimestamps.length > 0 && sessionCreateTimestamps[0]! < cutoff) {
    sessionCreateTimestamps.shift();
  }
}

const POST_FLUSH_PRESSURE_MS = Number(
  process.env.ADMISSION_POST_FLUSH_PRESSURE_MS ?? 60_000,
);
const POST_FLUSH_DURATION_GATE_MS = Number(
  process.env.ADMISSION_POST_FLUSH_DURATION_GATE_MS ?? 10_000,
);

/** Reject expensive work when the loop is already saturated. */
export function admitExpensiveWork(label = "work"): AdmissionDecision {
  const instantLagMs = getRecentEventLoopLagMs();
  const lagMs = getSmoothedEventLoopLagMs();
  const sqlite = getSqlitePersistStats();
  // Never pile background automation onto a synchronous sql.js export window.
  if (sqlite.flushInFlight) {
    return {
      admit: false,
      reason: `SQLite flush in flight — refusing ${label}`,
      retryAfterSec: 5,
      lagMs,
    };
  }
  // After a long sync export, keep Tier-0 free while residual pressure drains.
  // Ignore tiny flushes (< gate) so a 159ms write cannot open a 60s lockout.
  if (
    sqlite.lastFlushMs !== null &&
    sqlite.lastFlushDurationMs !== null &&
    sqlite.lastFlushDurationMs >= POST_FLUSH_DURATION_GATE_MS &&
    Date.now() - sqlite.lastFlushMs < POST_FLUSH_PRESSURE_MS
  ) {
    return {
      admit: false,
      reason: `Post-flush pressure window (lastFlush=${sqlite.lastFlushDurationMs}ms) — refusing ${label}`,
      retryAfterSec: 5,
      lagMs,
    };
  }
  if (lagMs >= LAG_REJECT_MS) {
    return {
      admit: false,
      reason: `Event loop saturated (smoothed lag ${Math.round(lagMs)}ms, instant ${Math.round(instantLagMs)}ms) — refusing ${label}`,
      retryAfterSec: Math.min(30, Math.max(2, Math.ceil(lagMs / 1000) + 1)),
      lagMs,
    };
  }
  return { admit: true };
}

export function admitPillowSessionCreate(): AdmissionDecision {
  const base = admitExpensiveWork("pillow session create");
  if (!base.admit) return base;

  pruneSessionRateWindow();
  if (sessionCreateTimestamps.length >= SESSION_RATE_LIMIT) {
    return {
      admit: false,
      reason: `Pillow session create rate limit (${SESSION_RATE_LIMIT}/${SESSION_RATE_WINDOW_MS}ms)`,
      retryAfterSec: Math.max(2, Math.ceil(SESSION_RATE_WINDOW_MS / 1000)),
      lagMs: getRecentEventLoopLagMs(),
    };
  }

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
  sessionCreateTimestamps.push(Date.now());
  pruneSessionRateWindow();
}

export function endPillowSessionCreate(): void {
  pillowSessionCreatesInFlight = Math.max(0, pillowSessionCreatesInFlight - 1);
}

/** Test-only reset. */
export function resetAdmissionControlForTesting(): void {
  pillowSessionCreatesInFlight = 0;
  sessionCreateTimestamps.length = 0;
}
