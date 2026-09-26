/** Off-thread recovery of a genuinely blocked main event loop. */
import { parentPort, workerData } from "node:worker_threads";
import { writeSync } from "node:fs";
import {
  attachContinuityHeartbeat, evaluateContinuityPoll, monotonicNowMs, readContinuityHeartbeat,
} from "./continuity-heartbeat.js";

type WatchdogWorkerData = {
  sharedBuffer: SharedArrayBuffer;
  stallExitMs: number;
  pollMs: number;
  bootGraceMs?: number;
  startedAtMs?: number;
};
const data = workerData as WatchdogWorkerData;
const view = attachContinuityHeartbeat(data.sharedBuffer);
const duration = (value: unknown, fallback: number, min: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(min, value) : fallback;
const stallExitMs = duration(data.stallExitMs, 20_000, 5_000);
const pollMs = duration(data.pollMs, 2_000, 500);
const bootGraceMs = duration(data.bootGraceMs, 0, 0);
const startedAtMs = duration(data.startedAtMs, Number(monotonicNowMs()), 0);
const maxFlushGuardMs = Math.max(stallExitMs * 4, 600_000);
let invalidSinceMs: number | null = null;

setInterval(() => {
  // Acquire the guard before the timestamp: a cleared guard must expose the
  // completion heartbeat that SQLite published before clearing it.
  const flushInFlight = Atomics.load(view.flags, 1) === 1;
  const reading = readContinuityHeartbeat(view);
  const decision = evaluateContinuityPoll({ reading, startedAtMs, bootGraceMs, stallExitMs,
    flushInFlight, maxFlushGuardMs, invalidSinceMs });
  invalidSinceMs = decision.invalidSinceMs;
  if (!decision.terminate) return;
  // Worker console output is forwarded through the main thread; write directly
  // so a wedged main cannot hide the recovery receipt.
  try {
    writeSync(2, JSON.stringify({ level: "fatal", event: "executive_continuity_watchdog_exit",
      stalledForMs: reading.ageMs, reason: decision.reason, stallExitMs, flushInFlight,
      signal: "SIGKILL", message: "Unresponsive main process requires forced recovery; unflushed state may be lost" }) + "\n");
  } finally {
    // process.exit() here terminates only this worker. SIGKILL reaches the whole
    // process even when its main-thread exit callback or signal handler cannot run.
    process.kill(process.pid, "SIGKILL");
  }
}, pollMs);
parentPort?.postMessage({ type: "continuity_watchdog_ready" });
