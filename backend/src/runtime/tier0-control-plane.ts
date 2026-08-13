/**
 * Tier-0 Grand King control-plane telemetry.
 *
 * Tracks latency / failure of auth, session, and liveness so EmpireAI can
 * observe degradation before the Grand King encounters “Brain timeout” /
 * “Authentication service unavailable”.
 *
 * Never gates Tier-0 traffic through admission control — this module only observes.
 */

export type Tier0Route =
  | "health_live"
  | "auth_login"
  | "auth_logout"
  | "auth_me"
  | "auth_refresh"
  | "other_tier0";

type Sample = { atMs: number; route: Tier0Route; ms: number; ok: boolean };

const WINDOW_MS = Number(process.env.TIER0_METRICS_WINDOW_MS ?? 300_000);
const MAX_SAMPLES = Math.max(64, Number(process.env.TIER0_METRICS_MAX_SAMPLES ?? 512));
const DEGRADED_P95_MS = Number(process.env.TIER0_DEGRADED_P95_MS ?? 5_000);
const DEGRADED_FAILURES = Number(process.env.TIER0_DEGRADED_FAILURES ?? 3);

const samples: Sample[] = [];
let processStartedAtMs = Date.now();

function prune(): void {
  const cutoff = Date.now() - WINDOW_MS;
  while (samples.length > 0 && samples[0]!.atMs < cutoff) {
    samples.shift();
  }
  while (samples.length > MAX_SAMPLES) {
    samples.shift();
  }
}

export function recordTier0Request(input: {
  route: Tier0Route;
  durationMs: number;
  ok: boolean;
}): void {
  samples.push({
    atMs: Date.now(),
    route: input.route,
    ms: Math.max(0, Math.round(input.durationMs)),
    ok: input.ok,
  });
  prune();
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx]!;
}

export function getTier0ControlPlaneSnapshot(): {
  windowMs: number;
  sampleCount: number;
  successCount: number;
  failureCount: number;
  p50Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  worstMs: number | null;
  byRoute: Record<string, { count: number; failures: number; p95Ms: number | null }>;
  degraded: boolean;
  processUptimeMs: number;
  alerts: string[];
} {
  prune();
  const ms = samples.map((s) => s.ms).sort((a, b) => a - b);
  const failures = samples.filter((s) => !s.ok);
  const byRoute: Record<string, { count: number; failures: number; durations: number[] }> = {};
  for (const s of samples) {
    const bucket = byRoute[s.route] ?? { count: 0, failures: 0, durations: [] };
    bucket.count += 1;
    if (!s.ok) bucket.failures += 1;
    bucket.durations.push(s.ms);
    byRoute[s.route] = bucket;
  }
  const alerts: string[] = [];
  const p95 = percentile(ms, 0.95);
  if (p95 !== null && p95 >= DEGRADED_P95_MS) {
    alerts.push(`tier0_p95_ms=${p95}`);
  }
  if (failures.length >= DEGRADED_FAILURES) {
    alerts.push(`tier0_failures=${failures.length}`);
  }
  return {
    windowMs: WINDOW_MS,
    sampleCount: samples.length,
    successCount: samples.length - failures.length,
    failureCount: failures.length,
    p50Ms: percentile(ms, 0.5),
    p95Ms: p95,
    p99Ms: percentile(ms, 0.99),
    worstMs: ms.length ? ms[ms.length - 1]! : null,
    byRoute: Object.fromEntries(
      Object.entries(byRoute).map(([route, v]) => {
        const sorted = [...v.durations].sort((a, b) => a - b);
        return [
          route,
          { count: v.count, failures: v.failures, p95Ms: percentile(sorted, 0.95) },
        ];
      }),
    ),
    degraded: alerts.length > 0,
    processUptimeMs: Date.now() - processStartedAtMs,
    alerts,
  };
}

/** Test-only. */
export function resetTier0ControlPlaneForTesting(): void {
  samples.length = 0;
  processStartedAtMs = Date.now();
}
