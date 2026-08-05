import type { RawBenchmarkEvidence } from "./benchmark-runner.js";
import type { PerformanceAuditConfiguration } from "./configuration.js";
import { PERFORMANCE_COMPONENT_TYPES } from "./paths.js";
import type {
  BenchmarkResult,
  CheckStatus,
  PerformanceComponentKey,
  PerformanceClassification,
} from "./types.js";

let benchmarkSeq = 0;

export function nextBenchmarkId() {
  benchmarkSeq += 1;
  return `perfart-bench-${String(benchmarkSeq).padStart(4, "0")}`;
}

export function resetBenchmarkSequenceForTesting() {
  benchmarkSeq = 0;
}

/**
 * Deterministic classifier from measured evidence only — never certifies
 * untested performance.
 *   handle not bound -> missing / Missing
 *   probe threw (errorRate > errorRateThreshold) -> failed / Failed
 *   responseTime within configured threshold and no error -> certified / Passed
 *   otherwise (bound, measured, but slower than threshold) -> partially_certified / Partial
 * `blocked` and `deferred` are applied by the caller from explicit prior
 * contract/gate evidence or explicit deferral input — never inferred here.
 */
export function classifyBenchmarkStatus(
  evidence: RawBenchmarkEvidence,
  config: PerformanceAuditConfiguration,
): { stabilityStatus: CheckStatus; performanceClassification: PerformanceClassification } {
  if (!evidence.bound) {
    return { stabilityStatus: "Missing", performanceClassification: "missing" };
  }
  if (evidence.errorRate > config.errorRateThreshold || evidence.responseTime === null) {
    return { stabilityStatus: "Failed", performanceClassification: "failed" };
  }
  if (evidence.responseTime <= config.responseTimeThresholdMs) {
    return { stabilityStatus: "Passed", performanceClassification: "certified" };
  }
  return { stabilityStatus: "Partial", performanceClassification: "partially_certified" };
}

export function buildBenchmarkResult(
  evidence: RawBenchmarkEvidence,
  config: PerformanceAuditConfiguration,
  extras: {
    testScenario: string;
    throughput: number | null;
    latency: number | null;
    cpuUsage: number | null;
    memoryUsage: number | null;
    extraEvidence?: string[];
  },
): BenchmarkResult {
  const { stabilityStatus, performanceClassification } = classifyBenchmarkStatus(evidence, config);
  const componentKey = evidence.componentKey as PerformanceComponentKey;
  const notes = [
    evidence.bound ? "discovered=true" : "discovered=false",
    evidence.bound
      ? `measured ${evidence.probeMethod}() responseTime=${evidence.responseTime ?? "n/a"}ms (threshold=${config.responseTimeThresholdMs}ms)`
      : (evidence.errorDetail ?? "no handle injected; none invented"),
    evidence.errorDetail && evidence.bound ? `error=${evidence.errorDetail}` : null,
    ...(extras.extraEvidence ?? []),
  ].filter((n): n is string => !!n);

  return {
    benchmarkId: nextBenchmarkId(),
    componentId: componentKey,
    componentType: PERFORMANCE_COMPONENT_TYPES[componentKey],
    testScenario: extras.testScenario,
    responseTime: evidence.responseTime,
    throughput: extras.throughput,
    latency: extras.latency,
    cpuUsage: extras.cpuUsage,
    memoryUsage: extras.memoryUsage,
    errorRate: evidence.errorRate,
    stabilityStatus,
    performanceClassification,
    supportingEvidence: notes.map((n) => `${componentKey}: ${n}`),
    auditReference: `component:${componentKey}`,
    auditTimestamp: new Date().toISOString(),
  };
}
