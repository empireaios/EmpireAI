import { PERFORMANCE_COMPONENT_KEYS, PERFORMANCE_COMPONENT_PROBES } from "./paths.js";
import { handleFor } from "./performance-discovery.js";
import { safeCall, timeConcurrentProbes, timeSafeProbe } from "./evidence-collector.js";
import type { PerformanceAuditConfiguration } from "./configuration.js";
import type { PerformanceAuditDependencies } from "./integrations.js";
import type { PerformanceComponentKey, ScalabilityResult, StabilityProbeRow } from "./types.js";

/**
 * Raw, measured evidence for a single component's workload benchmark —
 * `responseTime` is a real `Date.now()` delta around a safe, non-mutating
 * structural probe method. Never fabricated: a missing handle or a
 * throwing probe yields `null`/error evidence rather than an invented
 * number.
 */
export type RawBenchmarkEvidence = {
  componentKey: PerformanceComponentKey;
  bound: boolean;
  probeMethod: string;
  responseTime: number | null;
  errorRate: number;
  errorDetail: string | null;
};

/**
 * Executes ONE real, timed structural probe against the component's
 * injected handle. The probe method is drawn from the fixed
 * `PERFORMANCE_COMPONENT_PROBES` catalog (`listWorkers`, `getCatalog`,
 * `getDashboard`, `checkHealth`, `getState`, `query`,
 * `getCertificationResults`) — every one is a safe, read-only,
 * non-mutating accessor. It NEVER invokes business-logic methods
 * (`invokeWorker`, `invokeWorkflow`, `submitWorkerReport`, …) as part of
 * benchmarking; those would mutate production state.
 */
export function executeWorkloadBenchmarkForComponent(
  componentKey: PerformanceComponentKey,
  deps: PerformanceAuditDependencies,
): RawBenchmarkEvidence {
  const handle = handleFor(componentKey, deps);
  const probeMethod = PERFORMANCE_COMPONENT_PROBES[componentKey];
  if (handle == null) {
    return {
      componentKey,
      bound: false,
      probeMethod,
      responseTime: null,
      errorRate: 1,
      errorDetail: `no ${componentKey} handle injected; none invented`,
    };
  }
  const probe = timeSafeProbe(handle, probeMethod);
  if (probe.ok) {
    return { componentKey, bound: true, probeMethod, responseTime: probe.elapsedMs, errorRate: 0, errorDetail: null };
  }
  if (probeMethod !== "getState") {
    const fallback = timeSafeProbe(handle, "getState");
    if (fallback.ok) {
      return {
        componentKey,
        bound: true,
        probeMethod: "getState",
        responseTime: fallback.elapsedMs,
        errorRate: 0,
        errorDetail: null,
      };
    }
  }
  return {
    componentKey,
    bound: true,
    probeMethod,
    responseTime: probe.elapsedMs,
    errorRate: 1,
    errorDetail: probe.error,
  };
}

/** Executes the full catalog of workload benchmarks — one real timed probe per catalogued component. */
export function executeWorkloadBenchmarks(deps: PerformanceAuditDependencies): RawBenchmarkEvidence[] {
  return PERFORMANCE_COMPONENT_KEYS.map((key) => executeWorkloadBenchmarkForComponent(key, deps));
}

/** Response-time measurement is simply the workload benchmark's measured `Date.now()` delta, exposed narrowly. */
export function measureResponseTimes(
  deps: PerformanceAuditDependencies,
): Array<{ componentId: string; responseTime: number | null; evidence: string }> {
  return executeWorkloadBenchmarks(deps).map((row) => ({
    componentId: row.componentKey,
    responseTime: row.responseTime,
    evidence: row.bound
      ? `${row.componentKey}: measured ${row.probeMethod}() in ${row.responseTime ?? "n/a"}ms`
      : `${row.componentKey}: ${row.errorDetail}`,
  }));
}

/**
 * Measures throughput by issuing `concurrency` concurrent invocations of
 * the same safe probe (`Promise.all`) and dividing successful completions
 * by real elapsed wall-clock seconds. Never invented — a missing handle
 * yields `throughput: null`.
 */
export async function measureThroughput(
  deps: PerformanceAuditDependencies,
  config: PerformanceAuditConfiguration,
): Promise<Array<{ componentId: string; throughput: number | null; concurrency: number; evidence: string }>> {
  const results: Array<{ componentId: string; throughput: number | null; concurrency: number; evidence: string }> = [];
  for (const componentKey of PERFORMANCE_COMPONENT_KEYS) {
    const handle = handleFor(componentKey, deps);
    const probeMethod = PERFORMANCE_COMPONENT_PROBES[componentKey];
    if (handle == null) {
      results.push({
        componentId: componentKey,
        throughput: null,
        concurrency: config.scalabilityConcurrency,
        evidence: `${componentKey}: no handle injected — throughput not measured`,
      });
      continue;
    }
    const { elapsedMs, successCount, failureCount } = await timeConcurrentProbes(
      handle,
      probeMethod,
      config.scalabilityConcurrency,
    );
    const throughput = elapsedMs > 0 ? Math.round((successCount / (elapsedMs / 1000)) * 100) / 100 : successCount;
    results.push({
      componentId: componentKey,
      throughput,
      concurrency: config.scalabilityConcurrency,
      evidence: `${componentKey}: ${successCount}/${successCount + failureCount} ${probeMethod}() calls succeeded across ${elapsedMs}ms (${throughput ?? "n/a"} ops/sec)`,
    });
  }
  return results;
}

/**
 * Measures real process resource utilisation via `process.memoryUsage()`
 * and `process.cpuUsage()` deltas taken around the workload benchmark
 * batch — genuine measured signal, never invented. CPU accounting is
 * structural/optional per component: only the aggregate process delta is
 * measured (Node does not expose reliable per-call CPU attribution).
 */
export async function measureResourceUtilisation(deps: PerformanceAuditDependencies): Promise<{
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  cpuUserMs: number | null;
  cpuSystemMs: number | null;
  evidence: string[];
}> {
  const memBefore = process.memoryUsage();
  const cpuBefore = process.cpuUsage();
  executeWorkloadBenchmarks(deps);
  const memAfter = process.memoryUsage();
  const cpuAfter = process.cpuUsage(cpuBefore);
  const toMb = (bytes: number) => Math.round((bytes / (1024 * 1024)) * 100) / 100;
  return {
    heapUsedMb: toMb(memAfter.heapUsed),
    heapTotalMb: toMb(memAfter.heapTotal),
    rssMb: toMb(memAfter.rss),
    cpuUserMs: Math.round(cpuAfter.user / 100) / 10,
    cpuSystemMs: Math.round(cpuAfter.system / 100) / 10,
    evidence: [
      `heapUsed before=${toMb(memBefore.heapUsed)}MB after=${toMb(memAfter.heapUsed)}MB`,
      `rss=${toMb(memAfter.rss)}MB`,
      `cpu user=${Math.round(cpuAfter.user / 100) / 10}ms system=${Math.round(cpuAfter.system / 100) / 10}ms (measured via process.cpuUsage() delta around the benchmark batch)`,
    ],
  };
}

/**
 * Concurrent structural execution testing — `Promise.all` of N safe reads
 * against each bound component's probe method. Measures real elapsed
 * time; never executes business logic that mutates production.
 */
export async function measureScalability(
  deps: PerformanceAuditDependencies,
  config: PerformanceAuditConfiguration,
): Promise<ScalabilityResult[]> {
  const rows: ScalabilityResult[] = [];
  for (const componentKey of PERFORMANCE_COMPONENT_KEYS) {
    const handle = handleFor(componentKey, deps);
    const probeMethod = PERFORMANCE_COMPONENT_PROBES[componentKey];
    if (handle == null) {
      rows.push({
        componentId: componentKey,
        concurrency: config.scalabilityConcurrency,
        elapsedMs: 0,
        throughput: null,
        successCount: 0,
        failureCount: config.scalabilityConcurrency,
        evidence: [`${componentKey}: no handle injected — scalability not measured`],
      });
      continue;
    }
    const { elapsedMs, successCount, failureCount } = await timeConcurrentProbes(
      handle,
      probeMethod,
      config.scalabilityConcurrency,
    );
    const throughput = elapsedMs > 0 ? Math.round((successCount / (elapsedMs / 1000)) * 100) / 100 : successCount;
    rows.push({
      componentId: componentKey,
      concurrency: config.scalabilityConcurrency,
      elapsedMs,
      throughput,
      successCount,
      failureCount,
      evidence: [
        `${componentKey}: ${successCount}/${config.scalabilityConcurrency} concurrent ${probeMethod}() probes succeeded in ${elapsedMs}ms`,
      ],
    });
  }
  return rows;
}

/**
 * Repeats the workload benchmark probe `config.stabilityProbeRepeats`
 * times per component and computes real sample mean/variance — a
 * deterministic sustained-stability signal derived strictly from
 * measured timings, never inferred or invented.
 */
export function verifySustainedStability(
  deps: PerformanceAuditDependencies,
  config: PerformanceAuditConfiguration,
): StabilityProbeRow[] {
  return PERFORMANCE_COMPONENT_KEYS.map((componentKey) => {
    const handle = handleFor(componentKey, deps);
    const probeMethod = PERFORMANCE_COMPONENT_PROBES[componentKey];
    if (handle == null) {
      return {
        componentId: componentKey,
        samples: [],
        meanMs: null,
        varianceMs: null,
        errorCount: config.stabilityProbeRepeats,
        stabilityStatus: "Missing" as const,
        stabilityLabel: "unknown" as const,
        evidence: [`${componentKey}: no handle injected — stability not measured`],
      };
    }
    const samples: number[] = [];
    let errorCount = 0;
    for (let i = 0; i < config.stabilityProbeRepeats; i += 1) {
      const probe = timeSafeProbe(handle, probeMethod);
      if (probe.ok && probe.elapsedMs !== null) samples.push(probe.elapsedMs);
      else errorCount += 1;
    }
    if (samples.length === 0) {
      return {
        componentId: componentKey,
        samples,
        meanMs: null,
        varianceMs: null,
        errorCount,
        stabilityStatus: "Failed" as const,
        stabilityLabel: "unstable" as const,
        evidence: [`${componentKey}: all ${config.stabilityProbeRepeats} repeated probes failed`],
      };
    }
    const meanMs = samples.reduce((sum, v) => sum + v, 0) / samples.length;
    const varianceMs = samples.reduce((sum, v) => sum + (v - meanMs) ** 2, 0) / samples.length;
    const stable = errorCount === 0 && varianceMs <= config.stabilityVarianceThresholdMs;
    const partiallyStable = errorCount === 0 && !stable;
    const stabilityStatus = stable ? ("Passed" as const) : partiallyStable ? ("Partial" as const) : ("Failed" as const);
    const stabilityLabel = stable ? ("stable" as const) : partiallyStable ? ("degraded" as const) : ("unstable" as const);
    return {
      componentId: componentKey,
      samples,
      meanMs: Math.round(meanMs * 100) / 100,
      varianceMs: Math.round(varianceMs * 100) / 100,
      errorCount,
      stabilityStatus,
      stabilityLabel,
      evidence: [
        `${componentKey}: ${samples.length}/${config.stabilityProbeRepeats} repeated ${probeMethod}() probes succeeded, mean=${Math.round(meanMs * 100) / 100}ms variance=${Math.round(varianceMs * 100) / 100}ms (threshold=${config.stabilityVarianceThresholdMs}ms)`,
      ],
    };
  });
}

export function safeGetState(handle: { getState?: () => unknown } | null | undefined): unknown {
  return safeCall(() => handle?.getState?.());
}
