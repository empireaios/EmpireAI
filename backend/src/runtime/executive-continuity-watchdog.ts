/**
 * Executive Continuity Watchdog (HA).
 *
 * Main-thread lag monitors cannot fire while the event loop is wedged
 * (e.g. long sql.js db.export). A Worker observes a SharedArrayBuffer heartbeat
 * and process.exit(78) when the heartbeat stalls, triggering Railway ON_FAILURE restart.
 */
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { logger } from "../config/logger.js";
import { getRecentEventLoopLagMs } from "./event-loop-cooperative.js";
import { bindSqliteFlushGuard, getSqlitePersistStats } from "../brain/sqlite-database.js";

const ENABLED =
  (process.env.EXECUTIVE_CONTINUITY_WATCHDOG_ENABLED ?? "true").toLowerCase() !==
  "false";
const STALL_EXIT_MS = Number(process.env.EXECUTIVE_CONTINUITY_STALL_EXIT_MS ?? 20_000);
const POLL_MS = Number(process.env.EXECUTIVE_CONTINUITY_WATCHDOG_POLL_MS ?? 2_000);
const HEARTBEAT_MS = Number(process.env.EXECUTIVE_CONTINUITY_HEARTBEAT_MS ?? 1_000);
const HIGH_LAG_ALERT_MS = Number(process.env.EXECUTIVE_CONTINUITY_HIGH_LAG_MS ?? 500);
const HIGH_LAG_EXIT_MS = Number(process.env.EXECUTIVE_CONTINUITY_HIGH_LAG_EXIT_MS ?? 45_000);
/** Ignore stall/high-lag exits during cold start (Pillow session init can block the loop). */
const BOOT_GRACE_MS = Number(process.env.EXECUTIVE_CONTINUITY_BOOT_GRACE_MS ?? 180_000);

type ContinuityHealth = {
  watchdogEnabled: boolean;
  watchdogRunning: boolean;
  lastHeartbeatAgeMs: number | null;
  eventLoopLagMs: number;
  sqlite: Readonly<{
    pending: boolean;
    flushCount: number;
    lastFlushMs: number | null;
    lastFlushDurationMs: number | null;
    flushInFlight: boolean;
  }>;
  alerts: string[];
  healthy: boolean;
};

let started = false;
let worker: Worker | null = null;
let heartbeatView: Int32Array | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let highLagSinceMs: number | null = null;
let lastAlertAtMs = 0;
let startedAtMs = 0;

function inBootGrace(): boolean {
  return startedAtMs > 0 && Date.now() - startedAtMs < BOOT_GRACE_MS;
}

function workerPath(): string {
  return fileURLToPath(new URL("./executive-continuity-watchdog-worker.js", import.meta.url));
}

function beat(): void {
  if (!heartbeatView) return;
  Atomics.store(heartbeatView, 0, Date.now());
}

function evaluateHighLagExit(): void {
  if (inBootGrace()) {
    // Still beat so worker sees activity after grace ends.
    return;
  }
  const sqlite = getSqlitePersistStats();
  // Only suppress exit during the synchronous export itself.
  // pending=true (dirty, waiting for first-flush delay) must NOT disable HA recovery.
  if (sqlite.flushInFlight) {
    highLagSinceMs = null;
    return;
  }
  const lag = getRecentEventLoopLagMs();
  if (lag >= HIGH_LAG_ALERT_MS) {
    if (highLagSinceMs === null) highLagSinceMs = Date.now();
    const sustained = Date.now() - highLagSinceMs;
    if (Date.now() - lastAlertAtMs > 10_000) {
      lastAlertAtMs = Date.now();
      logger.warn(
        { lagMs: Math.round(lag), sustainedMs: sustained, sqlite },
        "Executive continuity alert — elevated event-loop lag",
      );
    }
    if (sustained >= HIGH_LAG_EXIT_MS) {
      logger.error(
        { lagMs: Math.round(lag), sustainedMs: sustained },
        "Executive continuity watchdog — sustained high lag; exiting for Railway restart",
      );
      process.exit(78);
    }
  } else {
    highLagSinceMs = null;
  }
}

export function startExecutiveContinuityWatchdog(): void {
  if (!ENABLED || started) return;
  started = true;
  startedAtMs = Date.now();

  // [0]=heartbeat ms, [1]=sqlite flush-in-flight guard (1=ignore stall)
  const sharedBuffer = new SharedArrayBuffer(8);
  heartbeatView = new Int32Array(sharedBuffer);
  Atomics.store(heartbeatView, 1, 0);
  bindSqliteFlushGuard(heartbeatView);
  beat();

  try {
    worker = new Worker(workerPath(), {
      workerData: {
        sharedBuffer,
        stallExitMs: STALL_EXIT_MS,
        pollMs: POLL_MS,
        bootGraceMs: BOOT_GRACE_MS,
        startedAtMs,
      },
    });
    worker.on("error", (error) => {
      logger.error({ err: error }, "Executive continuity watchdog worker error");
    });
    worker.on("exit", (code) => {
      if (code === 78) {
        // Worker already exited the process; this is belt-and-suspenders.
        process.exit(78);
      }
      logger.warn({ code }, "Executive continuity watchdog worker exited");
      worker = null;
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to start executive continuity watchdog worker");
  }

  heartbeatTimer = setInterval(() => {
    beat();
    evaluateHighLagExit();
  }, HEARTBEAT_MS);

  logger.info(
    {
      stallExitMs: STALL_EXIT_MS,
      highLagExitMs: HIGH_LAG_EXIT_MS,
      pollMs: POLL_MS,
      bootGraceMs: BOOT_GRACE_MS,
    },
    "Executive continuity watchdog started",
  );
}

export function stopExecutiveContinuityWatchdogForTesting(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (worker) {
    void worker.terminate();
    worker = null;
  }
  heartbeatView = null;
  started = false;
  highLagSinceMs = null;
  startedAtMs = 0;
}

export function getExecutiveContinuityHealth(): ContinuityHealth {
  const last = heartbeatView ? Atomics.load(heartbeatView, 0) : 0;
  const age = last > 0 ? Date.now() - last : null;
  const lag = getRecentEventLoopLagMs();
  const sqlite = getSqlitePersistStats();
  const alerts: string[] = [];
  if (lag >= HIGH_LAG_ALERT_MS) {
    alerts.push(`event_loop_lag_ms=${Math.round(lag)}`);
  }
  if (sqlite.lastFlushDurationMs !== null && sqlite.lastFlushDurationMs >= 5_000) {
    alerts.push(`sqlite_flush_duration_ms=${sqlite.lastFlushDurationMs}`);
  }
  if (sqlite.pending) alerts.push("sqlite_persist_pending");
  if (age !== null && age >= STALL_EXIT_MS / 2) {
    alerts.push(`heartbeat_age_ms=${age}`);
  }

  return {
    watchdogEnabled: ENABLED,
    watchdogRunning: Boolean(worker) || Boolean(heartbeatTimer),
    lastHeartbeatAgeMs: age,
    eventLoopLagMs: lag,
    sqlite,
    alerts,
    healthy: alerts.length === 0 && lag < HIGH_LAG_ALERT_MS,
  };
}
