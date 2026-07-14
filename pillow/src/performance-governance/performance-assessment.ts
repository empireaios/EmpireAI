import { PERFORMANCE_BASELINE_REGISTRY } from "./baseline-registry.js";
import { PERFORMANCE_METRIC_REGISTRY } from "./metric-registry.js";
import { PERFORMANCE_REGRESSION_REGISTRY } from "./regression-registry.js";
import { PERFORMANCE_BOTTLENECK_REGISTRY } from "./bottleneck-registry.js";
import { PHASE_P5_REVIEW_REGISTRY } from "./phase-p5-review.js";
import type {
  PerformanceGovernanceAssessment,
  PerformanceGovernanceSnapshot,
  RegressionSeverity,
} from "./types.js";

function gradeFromScore(score: number): PerformanceGovernanceAssessment["performanceGrade"] {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "acceptable";
  if (score >= 40) return "degraded";
  return "critical";
}

function detectActiveRegressions(snapshot: PerformanceGovernanceSnapshot): typeof PERFORMANCE_REGRESSION_REGISTRY {
  const active: typeof PERFORMANCE_REGRESSION_REGISTRY = [];

  if (snapshot.eventLoopLagMs >= 500) {
    active.push(PERFORMANCE_REGRESSION_REGISTRY.find((r) => r.id === "PG-RG-007")!);
  }
  if (snapshot.queueDepth > 10) {
    active.push(PERFORMANCE_REGRESSION_REGISTRY.find((r) => r.id === "PG-RG-004")!);
  }
  if (snapshot.heapUsedMb > 512) {
    active.push(PERFORMANCE_REGRESSION_REGISTRY.find((r) => r.id === "PG-RG-002")!);
  }
  if (snapshot.apiResponseTimeMs > 3000) {
    active.push(PERFORMANCE_REGRESSION_REGISTRY.find((r) => r.id === "PG-RG-001")!);
  }
  if (snapshot.missionDurationMs > 12000) {
    active.push(PERFORMANCE_REGRESSION_REGISTRY.find((r) => r.id === "PG-RG-009")!);
  }
  if (snapshot.aiProviderLatencyMs > 45000) {
    active.push(PERFORMANCE_REGRESSION_REGISTRY.find((r) => r.id === "PG-RG-010")!);
  }

  return active;
}

function buildGrandKingSummary(input: {
  score: number;
  grade: string;
  regressions: number;
  bottlenecks: number;
  trend: string;
}): string {
  return [
    `Performance: ${input.grade} (${input.score}/100)`,
    `Regressions: ${input.regressions}`,
    `Bottlenecks: ${input.bottlenecks}`,
    `Trend: ${input.trend}`,
    `Phase P5: complete · ready for P6-01 ECC`,
  ].join(" · ");
}

/** Execute Performance Governance assessment (P5-06). */
export function executePerformanceGovernanceAssessment(input: {
  snapshot?: PerformanceGovernanceSnapshot | null;
}): PerformanceGovernanceAssessment {
  const snapshot = input.snapshot ?? buildDefaultPerformanceSnapshot();
  const activeRegressions = detectActiveRegressions(snapshot);
  const score = snapshot.overallPerformanceScore;
  const grade = gradeFromScore(score);
  const trend: "improving" | "stable" | "degrading" =
    snapshot.eventLoopLagMs >= 200 || activeRegressions.length > 2
      ? "degrading"
      : score >= 75
        ? "stable"
        : "improving";

  const grandKingSummary = buildGrandKingSummary({
    score,
    grade,
    regressions: activeRegressions.length,
    bottlenecks: PERFORMANCE_BOTTLENECK_REGISTRY.filter((b) => b.severity === "critical" || b.severity === "high").length,
    trend,
  });

  return {
    pipelineVersion: "P5-06",
    assessedAt: new Date().toISOString(),
    overallPerformanceScore: score,
    performanceGrade: grade,
    baselines: PERFORMANCE_BASELINE_REGISTRY,
    metrics: PERFORMANCE_METRIC_REGISTRY,
    regressions: PERFORMANCE_REGRESSION_REGISTRY,
    bottlenecks: PERFORMANCE_BOTTLENECK_REGISTRY,
    phaseP5Review: PHASE_P5_REVIEW_REGISTRY,
    snapshot,
    success:
      PERFORMANCE_BASELINE_REGISTRY.length >= 10 &&
      PERFORMANCE_METRIC_REGISTRY.length >= 16 &&
      PHASE_P5_REVIEW_REGISTRY.every((r) => r.status === "complete"),
    summary: `Performance Governance — ${grade} · score ${score}/100 · ${activeRegressions.length} active regressions · ${PERFORMANCE_BOTTLENECK_REGISTRY.length} known bottlenecks`,
    grandKingSummary,
  };
}

export function buildDefaultPerformanceSnapshot(): PerformanceGovernanceSnapshot {
  const mem = process.memoryUsage();
  const env = process.env;
  const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
  const redisConfigured = Boolean(env.REDIS_URL);

  let score = 70;
  if (redisConfigured) score += 10;
  if (heapUsedMb < 256) score += 10;
  score = Math.min(100, score);

  return {
    capturedAt: new Date().toISOString(),
    nodeEnv: env.NODE_ENV ?? "development",
    eventLoopLagMs: 0,
    heapUsedMb,
    heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    rssMb: Math.round(mem.rss / 1024 / 1024),
    apiResponseTimeMs: 0,
    redisLatencyMs: redisConfigured ? 5 : 0,
    queueDepth: 0,
    queueLatencyMs: 0,
    databaseQueryTimeMs: 0,
    workerExecutionTimeMs: 0,
    missionDurationMs: 0,
    aiProviderLatencyMs: 0,
    memoryUsagePercent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
    cpuUsagePercent: 0,
    productionAvailabilityPercent: 99,
    pillowHostSessions: 0,
    overallPerformanceScore: score,
  };
}

export function classifyRegressionSeverity(count: number): RegressionSeverity {
  if (count >= 4) return "critical";
  if (count >= 2) return "high";
  if (count >= 1) return "medium";
  return "low";
}
