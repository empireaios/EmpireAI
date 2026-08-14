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
  process.env.EXECUTIVE_CONTINUITY_HIGH_LAG_EXIT_THRESHOLD_MS ?? 2_000,
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

let flushGuardSinceMs: number | null = null;
let lastObservedFlushCount = 0;
let postFlushCooldownUntilMs = 0;
/** Must exceed worst-case sql.js export on large DBs (observed ~283s). */
const MAX_FLUSH_GUARD_MS = Number(
  process.env.EXECUTIVE_CONTINUITY_MAX_FLUSH_GUARD_MS ?? 600_000,
);

function evaluateHighLagExit(): void {
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
    postFlushCooldownUntilMs = Date.now() + cooldown;
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
    if (flushGuardSinceMs === null) flushGuardSinceMs = Date.now();
    const guardedFor = Date.now() - flushGuardSinceMs;
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
  if (Date.now() < postFlushCooldownUntilMs) {
    highLagSinceMs = null;
    return;
  }
  const lag = getRecentEventLoopLagMs();
  if (lag >= HIGH_LAG_ALERT_MS) {
    if (Date.now() - lastAlertAtMs > 10_000) {
      lastAlertAtMs = Date.now();
      logger.warn(
        {
          lagMs: Math.round(lag),
          sustainedMs: highLagSinceMs === null ? 0 : Date.now() - highLagSinceMs,
          exitThresholdMs: HIGH_LAG_EXIT_THRESHOLD_MS,
          sqlite,
        },
        "Executive continuity alert — elevated event-loop lag",
      );
    }
  }
  // Exit path uses a higher threshold than alerts so mild residual lag cannot kill auth.
  if (lag >= HIGH_LAG_EXIT_THRESHOLD_MS) {
    if (highLagSinceMs === null) highLagSinceMs = Date.now();
    const sustained = Date.now() - highLagSinceMs;
    if (sustained >= HIGH_LAG_EXIT_MS) {
      logger.error(
        {
          lagMs: Math.round(lag),
          sustainedMs: sustained,
          exitThresholdMs: HIGH_LAG_EXIT_THRESHOLD_MS,
        },
        "Executive continuity watchdog — sustained extreme lag; exiting for Railway restart",
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
  if (worker) {
    void worker.terminate();
    worker = null;
  }
  heartbeatView = null;
  started = false;
  highLagSinceMs = null;
  startedAtMs = 0;
  flushGuardSinceMs = null;
  lastObservedFlushCount = 0;
  postFlushCooldownUntilMs = 0;
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
