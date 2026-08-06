/**
 * Runs off the main thread. If the main-thread heartbeat stalls, exit the process
 * so Railway ON_FAILURE restarts the Brain (hung event loops cannot self-heal).
 *
 * Boot grace: ignore stalls during Pillow cold-start so HA deploy healthchecks
 * are not killed by legitimate long synchronous initialization.
 */
import { workerData } from "node:worker_threads";

type WatchdogWorkerData = {
  sharedBuffer: SharedArrayBuffer;
  stallExitMs: number;
  pollMs: number;
  bootGraceMs?: number;
  startedAtMs?: number;
};

const data = workerData as WatchdogWorkerData;
const view = new Int32Array(data.sharedBuffer);
const stallExitMs = Math.max(5_000, Number(data.stallExitMs) || 20_000);
const pollMs = Math.max(500, Number(data.pollMs) || 2_000);
const bootGraceMs = Math.max(0, Number(data.bootGraceMs) || 0);
const startedAtMs = Number(data.startedAtMs) || Date.now();

setInterval(() => {
  if (Date.now() - startedAtMs < bootGraceMs) {
    return;
  }
  // Index 1: sqlite flush-in-flight — sync db.export() cannot beat; do not stall-exit.
  if (Atomics.load(view, 1) === 1) {
    return;
  }
  const lastHeartbeatMs = Atomics.load(view, 0);
  if (lastHeartbeatMs <= 0) return;
  const stalledFor = Date.now() - lastHeartbeatMs;
  if (stalledFor >= stallExitMs) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        level: "fatal",
        event: "executive_continuity_watchdog_exit",
        stalledForMs: stalledFor,
        stallExitMs,
        message:
          "Main-thread heartbeat stalled — exiting for Railway restart (HA continuity)",
      }),
    );
    process.exit(78);
  }
}, pollMs);
