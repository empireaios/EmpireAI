import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REQUIRED_PERFORMANCE_COMPONENT_KEYS, PERFORMANCE_AUDIT_SYSTEM_PATH } from "./paths.js";
import type { PerformanceAuditConfiguration } from "./configuration.js";
import type { PerformanceAuditDependencies } from "./integrations.js";
import type {
  BenchmarkResult,
  BenchmarkSummary,
  BottleneckRow,
  BottleneckSummary,
  GovernanceSummary,
  PerformanceComponentKey,
  PerformanceReadinessSummary,
  ResourceUtilisationSummary,
  SegmentPerformanceSummary,
  StabilityProbeRow,
  SustainedStabilitySummary,
} from "./types.js";

const BOUNDARY_LOCK_KEYS = [
  "neverFabricatePerformanceEvidence",
  "neverCertifyUntestedPerformance",
  "neverOptimizeOrModifyProductionSystems",
  "neverAssumeImplementation",
  "neverModifyPerformanceImplementations",
  "neverRepairFailedPerformanceComponents",
  "neverBypassPillowGovernance",
  "neverBypassGrandKingApproval",
  "neverOverrideApprovedArchitecture",
  "neverOverridePillow",
  "neverOverrideGrandKing",
  "neverImplementQ1107OrLater",
  "preserveCompleteTraceability",
  "preserveImmutableBenchmarkHistory",
  "preserveAuditHistory",
  "deterministicAuditBehaviour",
  "structuralSignalOnly",
  "evidenceBasedOnly",
  "maskSensitiveValues",
] as const;

function isRequiredComponentBound(componentId: string, deps: PerformanceAuditDependencies): boolean {
  switch (componentId) {
    case "worker-registry":
      return !!deps.workerRegistry;
    case "shared-runtime-core":
      return !!deps.sharedRuntimeCore;
    case "api-runtime":
      return !!deps.apiRuntime;
    default:
      return false;
  }
}

export function evaluateGovernanceSummary(
  root: string,
  config: PerformanceAuditConfiguration,
  deps: PerformanceAuditDependencies,
): GovernanceSummary {
  const selfPath = join(root, PERFORMANCE_AUDIT_SYSTEM_PATH);
  const selfDocPresent = existsSync(selfPath);
  const selfText = selfDocPresent ? readFileSync(selfPath, "utf8") : "";
  const containsExpectedLabel = selfText.includes("Performance Audit");
  const boundaryLocksHonoured = BOUNDARY_LOCK_KEYS.every(
    (key) => (config as unknown as Record<string, unknown>)[key] === true,
  );
  const requiredComponentsBoundCount = REQUIRED_PERFORMANCE_COMPONENT_KEYS.filter((key) =>
    isRequiredComponentBound(key, deps),
  ).length;
  const compliant = selfDocPresent && containsExpectedLabel && boundaryLocksHonoured;
  return {
    compliant,
    grandKingApprovalRequired: true,
    performanceAuditRequired: true,
    selfDocPresent,
    selfDocPath: PERFORMANCE_AUDIT_SYSTEM_PATH,
    boundaryLocksHonoured,
    requiredComponentsBoundCount,
    totalRequiredComponents: REQUIRED_PERFORMANCE_COMPONENT_KEYS.length,
    evidence: [
      `selfDocPresent=${selfDocPresent}`,
      `containsExpectedLabel=${containsExpectedLabel}`,
      `boundaryLocksHonoured=${boundaryLocksHonoured}`,
      `requiredComponentsBoundCount=${requiredComponentsBoundCount}/${REQUIRED_PERFORMANCE_COMPONENT_KEYS.length}`,
    ],
  };
}

export function evaluateBenchmarkSummary(matrix: BenchmarkResult[]): BenchmarkSummary {
  const passedCount = matrix.filter((r) => r.stabilityStatus === "Passed").length;
  const partialCount = matrix.filter((r) => r.stabilityStatus === "Partial").length;
  const failedCount = matrix.filter((r) => r.stabilityStatus === "Failed").length;
  const missingCount = matrix.filter((r) => r.stabilityStatus === "Missing").length;
  const measured = matrix.filter((r) => r.responseTime !== null);
  const throughputMeasured = matrix.filter((r) => r.throughput !== null);
  const averageResponseTimeMs =
    measured.length > 0
      ? Math.round((measured.reduce((sum, r) => sum + (r.responseTime ?? 0), 0) / measured.length) * 100) / 100
      : null;
  const averageThroughput =
    throughputMeasured.length > 0
      ? Math.round((throughputMeasured.reduce((sum, r) => sum + (r.throughput ?? 0), 0) / throughputMeasured.length) * 100) / 100
      : null;
  const averageErrorRate =
    matrix.length > 0 ? Math.round((matrix.reduce((sum, r) => sum + r.errorRate, 0) / matrix.length) * 10000) / 10000 : 0;
  return {
    totalBenchmarks: matrix.length,
    passedCount,
    partialCount,
    failedCount,
    missingCount,
    averageResponseTimeMs,
    averageThroughput,
    averageErrorRate,
    evidence: [
      `benchmarks: passed=${passedCount} partial=${partialCount} failed=${failedCount} missing=${missingCount} of ${matrix.length}`,
      `averageResponseTimeMs=${averageResponseTimeMs ?? "n/a"}`,
      `averageThroughput=${averageThroughput ?? "n/a"}`,
      `averageErrorRate=${averageErrorRate}`,
    ],
  };
}

const SEGMENT_MEMBERS: Record<SegmentPerformanceSummary["segment"], PerformanceComponentKey[]> = {
  worker: ["worker-registry"],
  factory: ["shared-runtime-core"],
  runtime: [
    "monitoring-runtime",
    "scheduling-runtime",
    "audit-runtime",
    "executive-reporting-runtime",
    "production-certification-core",
    "pillow-orchestration-runtime",
  ],
  api: ["api-runtime"],
  queue: ["queue-runtime"],
};

function summarizeSegment(segment: SegmentPerformanceSummary["segment"], matrix: BenchmarkResult[]): SegmentPerformanceSummary {
  const members = SEGMENT_MEMBERS[segment];
  const rows = matrix.filter((r) => members.includes(r.componentId as PerformanceComponentKey));
  const passedCount = rows.filter((r) => r.stabilityStatus === "Passed").length;
  const partialCount = rows.filter((r) => r.stabilityStatus === "Partial").length;
  const failedCount = rows.filter((r) => r.stabilityStatus === "Failed").length;
  const missingCount = rows.filter((r) => r.stabilityStatus === "Missing").length;
  return {
    segment,
    passedCount,
    partialCount,
    failedCount,
    missingCount,
    totalComponents: rows.length,
    evidence: [
      `${segment}: passed=${passedCount} partial=${partialCount} failed=${failedCount} missing=${missingCount} of ${rows.length}`,
    ],
  };
}

export function evaluateWorkerPerformanceSummary(matrix: BenchmarkResult[]): SegmentPerformanceSummary {
  return summarizeSegment("worker", matrix);
}

export function evaluateFactoryPerformanceSummary(matrix: BenchmarkResult[]): SegmentPerformanceSummary {
  return summarizeSegment("factory", matrix);
}

export function evaluateRuntimePerformanceSummary(matrix: BenchmarkResult[]): SegmentPerformanceSummary {
  return summarizeSegment("runtime", matrix);
}

export function evaluateApiPerformanceSummary(matrix: BenchmarkResult[]): SegmentPerformanceSummary {
  return summarizeSegment("api", matrix);
}

export function evaluateQueuePerformanceSummary(matrix: BenchmarkResult[]): SegmentPerformanceSummary {
  return summarizeSegment("queue", matrix);
}

/** Deterministic bottleneck detection — Failed/Missing stability, or measured evidence beyond configured thresholds. */
export function detectBottlenecks(matrix: BenchmarkResult[], config: PerformanceAuditConfiguration): BottleneckSummary {
  const rows: BottleneckRow[] = [];
  for (const row of matrix) {
    const reasons: string[] = [];
    if (row.stabilityStatus === "Missing") reasons.push("component not bound / untested");
    if (row.stabilityStatus === "Failed") reasons.push("benchmark probe failed or errored");
    if (row.errorRate > config.errorRateThreshold) reasons.push(`errorRate ${row.errorRate} exceeds threshold ${config.errorRateThreshold}`);
    if (row.responseTime !== null && row.responseTime > config.responseTimeThresholdMs) {
      reasons.push(`responseTime ${row.responseTime}ms exceeds threshold ${config.responseTimeThresholdMs}ms`);
    }
    if (reasons.length > 0) {
      rows.push({
        componentId: row.componentId,
        componentType: row.componentType,
        reason: reasons.join("; "),
        responseTime: row.responseTime,
        errorRate: row.errorRate,
        stabilityStatus: row.stabilityStatus,
        evidence: row.supportingEvidence,
      });
    }
  }
  return {
    computedAt: new Date().toISOString(),
    totalBottlenecks: rows.length,
    rows,
    evidence: rows.map((r) => `${r.componentId}: ${r.reason}`),
  };
}

export function buildResourceUtilisationSummary(
  measured: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    cpuUserMs: number | null;
    cpuSystemMs: number | null;
    evidence: string[];
  },
  matrix: BenchmarkResult[],
): ResourceUtilisationSummary {
  return {
    computedAt: new Date().toISOString(),
    heapUsedMb: measured.heapUsedMb,
    heapTotalMb: measured.heapTotalMb,
    rssMb: measured.rssMb,
    cpuUserMs: measured.cpuUserMs,
    cpuSystemMs: measured.cpuSystemMs,
    rows: matrix.map((row) => ({
      componentId: row.componentId,
      memoryUsageMb: row.memoryUsage,
      cpuUsagePercent: row.cpuUsage,
      evidence: [`${row.componentId}: memoryUsage=${row.memoryUsage ?? "n/a"} cpuUsage=${row.cpuUsage ?? "n/a"}`],
    })),
    evidence: measured.evidence,
  };
}

export function buildSustainedStabilitySummary(
  rows: StabilityProbeRow[],
  repeats: number,
): SustainedStabilitySummary {
  const hasFailed = rows.some((r) => r.stabilityStatus === "Failed");
  const hasMissing = rows.some((r) => r.stabilityStatus === "Missing");
  const allPassed = rows.length > 0 && rows.every((r) => r.stabilityStatus === "Passed");
  const overallStabilityStatus = hasMissing ? ("Missing" as const) : hasFailed ? ("Failed" as const) : allPassed ? ("Passed" as const) : ("Partial" as const);
  return {
    computedAt: new Date().toISOString(),
    repeats,
    rows,
    overallStabilityStatus,
    evidence: rows.map((r) => `${r.componentId}: ${r.stabilityLabel} (mean=${r.meanMs ?? "n/a"}ms variance=${r.varianceMs ?? "n/a"}ms)`),
  };
}

const READINESS_SCORE_BY_CLASSIFICATION: Record<BenchmarkResult["performanceClassification"], number> = {
  certified: 1,
  partially_certified: 0.5,
  deferred: 0.25,
  blocked: 0,
  failed: 0,
  missing: 0,
};

export function evaluatePerformanceReadinessSummary(matrix: BenchmarkResult[]): PerformanceReadinessSummary {
  const certifiedCount = matrix.filter((r) => r.performanceClassification === "certified").length;
  const partiallyCertifiedCount = matrix.filter((r) => r.performanceClassification === "partially_certified").length;
  const failedCount = matrix.filter((r) => r.performanceClassification === "failed").length;
  const missingCount = matrix.filter((r) => r.performanceClassification === "missing").length;
  const blockedCount = matrix.filter((r) => r.performanceClassification === "blocked").length;
  const deferredCount = matrix.filter((r) => r.performanceClassification === "deferred").length;

  const overallReadinessScore =
    matrix.length === 0
      ? 0
      : Math.round(
          (matrix.reduce((sum, r) => sum + READINESS_SCORE_BY_CLASSIFICATION[r.performanceClassification], 0) /
            matrix.length) *
            100,
        ) / 100;

  const allCertified = matrix.length > 0 && matrix.every((r) => r.performanceClassification === "certified");

  return {
    computedAt: new Date().toISOString(),
    totalComponents: matrix.length,
    certifiedCount,
    partiallyCertifiedCount,
    failedCount,
    missingCount,
    blockedCount,
    deferredCount,
    overallReadinessScore,
    allCertified,
    notes: allCertified
      ? ["All catalogued performance components observed certified"]
      : matrix.length === 0
        ? ["No performance components discovered — no performance handles injected"]
        : matrix
            .filter((r) => r.performanceClassification !== "certified")
            .map((r) => `${r.componentId} is ${r.performanceClassification}`),
    evidence: matrix.map((r) => `${r.componentId}:${r.performanceClassification}`),
  };
}
