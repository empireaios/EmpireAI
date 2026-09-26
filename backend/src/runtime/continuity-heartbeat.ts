/** Atomic heartbeat shared between the main thread and its watchdog. */
export const CONTINUITY_BUFFER_BYTES = 16;
export type ContinuityHeartbeat = {
  // Keep index 1 compatible with SQLite's existing in-flight export flag.
  flags: Int32Array;
  timestamp: BigInt64Array;
};

export function monotonicNowMs(): bigint {
  return process.hrtime.bigint() / 1_000_000n;
}

export function attachContinuityHeartbeat(buffer: SharedArrayBuffer): ContinuityHeartbeat {
  if (buffer.byteLength !== CONTINUITY_BUFFER_BYTES) throw new Error('Invalid continuity heartbeat buffer');
  return { flags: new Int32Array(buffer, 0, 2), timestamp: new BigInt64Array(buffer, 8, 1) };
}

export function writeContinuityHeartbeat(view: ContinuityHeartbeat, now = monotonicNowMs()): void {
  if (now < 0n || now > 0x7fffffffffffffffn) throw new Error('Invalid monotonic heartbeat');
  Atomics.store(view.timestamp, 0, now);
  Atomics.store(view.flags, 0, 1);
}

export type HeartbeatReading = { ageMs: number | null; error: string | null; nowMs: number };
export function readContinuityHeartbeat(view: ContinuityHeartbeat, now?: bigint): HeartbeatReading {
  const initialized = Atomics.load(view.flags, 0) === 1;
  const heartbeat = Atomics.load(view.timestamp, 0);
  // Sample AFTER loading: a concurrent fresh beat must not look like a future clock.
  const observedNow = now ?? monotonicNowMs();
  const nowMs = Number(observedNow);
  if (!Number.isSafeInteger(nowMs) || observedNow < 0n) return { ageMs: null, error: 'invalid_monotonic_clock', nowMs };
  if (!initialized) return { ageMs: null, error: 'heartbeat_missing', nowMs };
  if (heartbeat < 0n || heartbeat > observedNow) return { ageMs: null, error: 'heartbeat_clock_invalid', nowMs };
  return { ageMs: Number(observedNow - heartbeat), error: null, nowMs };
}

export function evaluateContinuityPoll(input: {
  reading: HeartbeatReading; startedAtMs: number; bootGraceMs: number; stallExitMs: number;
  flushInFlight: boolean; maxFlushGuardMs: number; invalidSinceMs: number | null;
}): { terminate: boolean; reason: string; invalidSinceMs: number | null } {
  const { reading } = input;
  const invalidSinceMs = reading.error ? input.invalidSinceMs ?? reading.nowMs : null;
  if (reading.nowMs - input.startedAtMs < input.bootGraceMs) {
    return { terminate: false, reason: 'boot_grace', invalidSinceMs };
  }
  if (reading.error) {
    // A corrupt/missing heartbeat must not bypass the existing SQLite export
    // allowance. Its invalid-reading window is bounded by the same hard cap.
    const invalidLimitMs = input.flushInFlight ? input.maxFlushGuardMs : input.stallExitMs;
    return { terminate: reading.nowMs - (invalidSinceMs ?? reading.nowMs) >= invalidLimitMs,
      reason: reading.error, invalidSinceMs };
  }
  if (input.flushInFlight && reading.ageMs! < input.maxFlushGuardMs) {
    return { terminate: false, reason: 'sqlite_flush_guard', invalidSinceMs };
  }
  return { terminate: reading.ageMs! >= input.stallExitMs,
    reason: reading.ageMs! >= input.stallExitMs ? 'heartbeat_stalled' : 'heartbeat_current', invalidSinceMs };
}
