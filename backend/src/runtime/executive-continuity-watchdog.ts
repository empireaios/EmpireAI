/**
 * Executive Continuity Watchdog (HA).
 *
 * Main-thread lag monitors cannot fire while the event loop is wedged
 * (e.g. long sql.js db.export). A Worker observes a SharedArrayBuffer heartbeat
 * and forces process termination only after a bounded confirmed stall. Recovery
 * uses a process-wide signal because a wedged main cannot run worker exit callbacks.
 */
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { CONTINUITY_BUFFER_BYTES, attachContinuityHeartbeat, monotonicNowMs, readContinuityHeartbeat, writeContinuityHeartbeat, type ContinuityHeartbeat } from "./continuity-heartbeat.js";
import { logger } from "../config/logger.js";
import { getRecentEventLoopLagMs } from "./event-loop-cooperative.js";
import { bindSqliteFlushGuard, getSqlitePersistStats } from "../brain/sqlite-database.js";

const ENABLED =
  (process.env.EXECUTIVE_CONTINUITY_WATCHDOG_ENABLED ?? "true").toLowerCase() !==
  "false";
/** Large sql.js exports regularly exceed 17–25s; stall exit must sit above that floor. */
const STALL_EXIT_MS = Number(process.env.EXECUTIVE_CONTINUITY_STALL_EXIT_MS ?? 45_000);
const POLL_MS = Number(process.env.EXECUTIVE_CONTINUITY_WATCHDOG_POLL_MS ?? 2_000);
const HEARTBEAT_MS = Number(process.env.EXECUTIVE_CONTINUITY_HEARTBEAT_MS ?? 1_000);
const HIGH_LAG_ALERT_MS = Number(process.env.EXECUTIVE_CONTINUITY_HIGH_LAG_MS ?? 500);
/**
 * Exit only on *extreme* sustained lag. Prior default (exit if lag≥500ms for 45s)
 * false-positive-killed the Brain after large sql.js exports: residual 0.5–2s lag
 * from background ticks accumulated into process.exit(78) → Railway crash-loop →
 * CRASHED with no healthy successor when a recovery deploy also failed.
 */
const HIGH_LAG_EXIT_THRESHOLD_MS = Number(
  process.env.EXECUTIVE_CONTINUITY_HIGH_LAG_EXIT_THRESHOLD_MS ?? 4_000,
);
const HIGH_LAG_EXIT_MS = Number(process.env.EXECUTIVE_CONTINUITY_HIGH_LAG_EXIT_MS ?? 120_000);
/** Ignore stall/high-lag exits during cold start (Pillow session init / large sql.js load). */
const BOOT_GRACE_MS = Number(
  process.env.EXECUTIVE_CONTINUITY_BOOT_GRACE_MS ??
    (process.env.EMPIRE_ROLE === "brain-worker" ? 600_000 : 180_000),
);
/** After a completed sql.js flush, suppress high-lag exit while residual samples drain. */
const POST_FLUSH_COOLDOWN_MS = Number(
  process.env.EXECUTIVE_CONTINUITY_POST_FLUSH_COOLDOWN_MS ?? 90_000,
);

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
let heartbeatView: ContinuityHeartbeat | null = null;
let workerReady = false;
let workerFailure: string | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let highLagSinceMs: number | null = null;
let lastAlertAtMs = 0;
let startedAtMs: number | null = null;
let gracefulRecoveryRequested = false;
let gracefulRecoveryDeadline: ReturnType<typeof setTimeout> | null = null;

/** High-lag polling runs on the Brain thread, so use its installed SIGTERM
 * shutdown path to save SQL.js writes before the primary respawns the worker.
 * The off-thread watchdog can still kill a genuinely wedged thread. */
export function requestGracefulContinuityRecovery(
  signal: () => void = () => { process.kill(process.pid, "SIGTERM"); },
): boolean {
  if (gracefulRecoveryRequested) return false;
  gracefulRecoveryRequested = true;
  // An active but non-terminating shutdown cannot suppress recovery forever.
  gracefulRecoveryDeadline = setTimeout(() => {
    logger.error("Executive continuity graceful shutdown timed out; durability unverified");
    process.exit(78);
  }, Math.max(MAX_FLUSH_GUARD_MS, 600_000) + 30_000);
  gracefulRecoveryDeadline.unref?.();
  try {
    signal();
    return true;
  } catch (error) {
    if (gracefulRecoveryDeadline) clearTimeout(gracefulRecoveryDeadline);
    gracefulRecoveryDeadline = null;
    gracefulRecoveryRequested = false;
    throw error;
  }
}

function inBootGrace(): boolean {
  return startedAtMs !== null && Number(monotonicNowMs()) - startedAtMs < BOOT_GRACE_MS;
}

function workerPath(): string {
  return fileURLToPath(new URL("./executive-continuity-watchdog-worker.js", import.meta.url));
}

function beat(): void {
  if (!heartbeatView) return;
  writeContinuityHeartbeat(heartbeatView);
}

let flushGuardSinceMs: number | null = null;
let lastObservedFlushCount = 0;
let postFlushCooldownUntilMs = 0;
/** Must exceed worst-case sql.js export on large DBs (observed ~283s). */
const MAX_FLUSH_GUARD_MS = Number(
  process.env.EXECUTIVE_CONTINUITY_MAX_FLUSH_GUARD_MS ?? 600_000,
);

function evaluateHighLagExit(): void {
  // The shutdown is already in progress; avoid emitting repeated errors while
  // its SQL.js persistence runs. The off-thread stall watchdog remains active.
  if (gracefulRecoveryRequested) return;
  if (inBootGrace()) {
    // Still beat so worker sees activity after grace ends.
    return;
  }
  const sqlite = getSqlitePersistStats();
  // Arm post-flush cooldown when a flush completes — residual lag samples must not
  // drive HA exit while auth/health recover.
  if (sqlite.flushCount > lastObservedFlushCount) {
    lastObservedFlushCount = sqlite.flushCount;
    const flushDur = sqlite.lastFlushDurationMs ?? 0;
    const cooldown = Math.max(POST_FLUSH_COOLDOWN_MS, flushDur * 3);
    postFlushCooldownUntilMs = Number(monotonicNowMs()) + cooldown;
    highLagSinceMs = null;
    logger.info(
      { flushCount: sqlite.flushCount, flushDurMs: flushDur, cooldownMs: cooldown },
      "Executive continuity — post-flush high-lag exit cooldown armed",
    );
  }
  // Only suppress exit during the synchronous export itself.
  // pending=true (dirty, waiting for first-flush delay) must NOT disable HA recovery.
  // A stuck flushInFlight must not permanently disable HA (auth would stay dead).
  if (sqlite.flushInFlight) {
    if (flushGuardSinceMs === null) flushGuardSinceMs = Number(monotonicNowMs());
    const guardedFor = Number(monotonicNowMs()) - flushGuardSinceMs;
    if (guardedFor < MAX_FLUSH_GUARD_MS) {
      highLagSinceMs = null;
      return;
    }
    logger.error(
      { guardedForMs: guardedFor, maxFlushGuardMs: MAX_FLUSH_GUARD_MS, sqlite },
      "Executive continuity watchdog — sqlite flush guard stuck; exiting for Railway restart",
    );
    process.exit(78);
  } else {
    flushGuardSinceMs = null;
  }
  if (Number(monotonicNowMs()) < postFlushCooldownUntilMs) {
    highLagSinceMs = null;
    return;
  }
  const lag = getRecentEventLoopLagMs();
  if (lag >= HIGH_LAG_ALERT_MS) {
    if (Number(monotonicNowMs()) - lastAlertAtMs > 10_000) {
      lastAlertAtMs = Number(monotonicNowMs());
      logger.warn(
        {
          lagMs: Math.round(lag),
          sustainedMs: highLagSinceMs === null ? 0 : Number(monotonicNowMs()) - highLagSinceMs,
          exitThresholdMs: HIGH_LAG_EXIT_THRESHOLD_MS,
          sqlite,
        },
        "Executive continuity alert — elevated event-loop lag",
      );
    }
  }
  // Exit path uses a higher threshold than alerts so mild residual lag cannot kill auth.
  if (lag >= HIGH_LAG_EXIT_THRESHOLD_MS) {
    if (highLagSinceMs === null) highLagSinceMs = Number(monotonicNowMs());
    const sustained = Number(monotonicNowMs()) - highLagSinceMs;
    if (sustained >= HIGH_LAG_EXIT_MS) {
      logger.error(
        {
          lagMs: Math.round(lag),
          sustainedMs: sustained,
          exitThresholdMs: HIGH_LAG_EXIT_THRESHOLD_MS,
        },
        "Executive continuity watchdog — sustained extreme lag; requesting graceful shutdown",
      );
      requestGracefulContinuityRecovery();
    }
  } else {
    highLagSinceMs = null;
  }
}

export function startExecutiveContinuityWatchdog(options: { workerFile?: string } = {}): void {
  if (!ENABLED || started) return;
  started = true;
  startedAtMs = Number(monotonicNowMs());

  // Header Int32[1] stays SQLite-compatible; timestamp is a disjoint atomic Int64.
  const sharedBuffer = new SharedArrayBuffer(CONTINUITY_BUFFER_BYTES);
  heartbeatView = attachContinuityHeartbeat(sharedBuffer);
  workerReady = false;
  workerFailure = null;
  bindSqliteFlushGuard(heartbeatView.flags, beat);
  beat();

  try {
    const currentWorker = new Worker(options.workerFile ?? workerPath(), {
      workerData: {
        sharedBuffer,
        stallExitMs: STALL_EXIT_MS,
        pollMs: POLL_MS,
        bootGraceMs: BOOT_GRACE_MS,
        startedAtMs,
      },
    });
    worker = currentWorker;
    currentWorker.on("message", (message) => {
      if (worker !== currentWorker) return;
      if (message?.type === "continuity_watchdog_ready") workerReady = true;
    });
    currentWorker.on("error", (error) => {
      if (worker !== currentWorker) return;
      workerReady = false;
      workerFailure = "watchdog_worker_error";
      logger.error({ err: error }, "Executive continuity watchdog worker error");
    });
    currentWorker.on("exit", (code) => {
      if (worker !== currentWorker) return;
      workerReady = false;
      workerFailure = `watchdog_worker_exit_${code}`;
      logger.warn({ code }, "Executive continuity watchdog worker exited");
      worker = null;
    });
  } catch (error) {
    workerReady = false;
    workerFailure = "watchdog_worker_start_failed";
    logger.error({ err: error }, "Failed to start executive continuity watchdog worker");
  }

  heartbeatTimer = setInterval(() => {
    beat();
    evaluateHighLagExit();
  }, HEARTBEAT_MS);

  lastObservedFlushCount = getSqlitePersistStats().flushCount;
  logger.info(
    {
      stallExitMs: STALL_EXIT_MS,
      highLagExitMs: HIGH_LAG_EXIT_MS,
      highLagExitThresholdMs: HIGH_LAG_EXIT_THRESHOLD_MS,
      postFlushCooldownMs: POST_FLUSH_COOLDOWN_MS,
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
  const stoppingWorker = worker;
  worker = null;
  workerReady = false;
  workerFailure = null;
  if (stoppingWorker) void stoppingWorker.terminate();
  bindSqliteFlushGuard(null);
  heartbeatView = null;
  started = false;
  highLagSinceMs = null;
  startedAtMs = null;
  lastAlertAtMs = 0;
  flushGuardSinceMs = null;
  lastObservedFlushCount = 0;
  postFlushCooldownUntilMs = 0;
  if (gracefulRecoveryDeadline) clearTimeout(gracefulRecoveryDeadline);
  gracefulRecoveryDeadline = null;
  gracefulRecoveryRequested = false;
}

export function getExecutiveContinuityHealth(): ContinuityHealth {
  const reading = heartbeatView ? readContinuityHeartbeat(heartbeatView) : null;
  const age = reading?.ageMs ?? null;
  const running = Boolean(worker) && workerReady && Boolean(heartbeatTimer);
  const lag = getRecentEventLoopLagMs();
  const sqlite = getSqlitePersistStats();
  const alerts: string[] = [];
  if (!ENABLED) alerts.push("watchdog_disabled");
  else if (!running) alerts.push(workerFailure ?? "watchdog_not_running");
  if (ENABLED && reading?.error) alerts.push(reading.error);
  if (ENABLED && !reading) alerts.push("heartbeat_missing");
  if (lag >= HIGH_LAG_ALERT_MS) {
    alerts.push(`event_loop_lag_ms=${Math.round(lag)}`);
  }
  if (sqlite.lastFlushDurationMs !== null && sqlite.lastFlushDurationMs >= 5_000) {
    alerts.push(`sqlite_flush_duration_ms=${sqlite.lastFlushDurationMs}`);
  }
  if (sqlite.pending) alerts.push("sqlite_persist_pending");
  if (gracefulRecoveryRequested) alerts.push("graceful_recovery_requested");
  if (age !== null && age >= STALL_EXIT_MS / 2) {
    alerts.push(`heartbeat_age_ms=${age}`);
  }

  return {
    watchdogEnabled: ENABLED,
    watchdogRunning: running,
    lastHeartbeatAgeMs: age,
    eventLoopLagMs: lag,
    sqlite,
    alerts,
    healthy: alerts.length === 0 && lag < HIGH_LAG_ALERT_MS,
  };
}
