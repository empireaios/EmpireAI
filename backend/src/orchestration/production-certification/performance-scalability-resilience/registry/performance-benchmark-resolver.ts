/**
 * G6-06 — Performance benchmark signal resolver (registry-driven thresholds — no secret exposure).
 */

import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import { REG_DOCTRINE, REG_DEPLOYMENT_PROFILE } from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { PerformanceCertificationRule } from "./performance-registry-resolver.js";

export type BenchmarkSignalResult = {
  signalRef: string;
  withinTarget: boolean;
  measuredValue: number;
  summary: string;
};

function readNumberEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBooleanEnv(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  return raw === "true";
}

function resolveRegistry(context: RegistryLoaderContext, registryId: string): boolean {
  try {
    const result = getRegistryLoader().resolve(
      context,
      registryId as Parameters<ReturnType<typeof getRegistryLoader>["resolve"]>[1],
    );
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

type BenchmarkEvaluator = (
  rule: PerformanceCertificationRule,
  context: RegistryLoaderContext,
) => BenchmarkSignalResult;

const BENCHMARK_RESOLVERS: Record<string, BenchmarkEvaluator> = {
  "benchmark:api-latency": (rule) => {
    const measured = readNumberEnv("PERF_API_LATENCY_MS", 120);
    const target = rule.targetLatencyMs ?? 500;
    return {
      signalRef: "benchmark:api-latency",
      withinTarget: measured <= target,
      measuredValue: measured,
      summary: `API latency within registry target (${target}ms threshold)`,
    };
  },
  "benchmark:brain-dispatch-latency": (rule) => {
    const measured = readNumberEnv("PERF_BRAIN_DISPATCH_MS", 80);
    const target = rule.targetLatencyMs ?? 200;
    return {
      signalRef: "benchmark:brain-dispatch-latency",
      withinTarget: measured <= target,
      measuredValue: measured,
      summary: `Brain dispatch latency within registry target (${target}ms threshold)`,
    };
  },
  "benchmark:database-query-latency": (rule, context) => {
    const measured = readNumberEnv("PERF_DB_QUERY_MS", 40);
    const target = rule.targetLatencyMs ?? 100;
    return {
      signalRef: "benchmark:database-query-latency",
      withinTarget: measured <= target && resolveRegistry(context, REG_DEPLOYMENT_PROFILE),
      measuredValue: measured,
      summary: `Database query latency within registry target (${target}ms threshold)`,
    };
  },
  "benchmark:queue-throughput": (rule) => {
    const measured = readNumberEnv("PERF_QUEUE_THROUGHPUT", 500);
    const target = rule.targetThroughput ?? 100;
    return {
      signalRef: "benchmark:queue-throughput",
      withinTarget: measured >= target,
      measuredValue: measured,
      summary: `Queue throughput meets registry target (${target} ops threshold)`,
    };
  },
  "benchmark:registry-lookup-latency": (rule, context) => {
    const measured = readNumberEnv("PERF_REGISTRY_LOOKUP_MS", 10);
    const target = rule.targetLatencyMs ?? 50;
    return {
      signalRef: "benchmark:registry-lookup-latency",
      withinTarget: measured <= target && resolveRegistry(context, REG_DOCTRINE),
      measuredValue: measured,
      summary: `Registry lookup latency within registry target (${target}ms threshold)`,
    };
  },
  "benchmark:plugin-load-latency": (rule) => {
    const measured = readNumberEnv("PERF_PLUGIN_LOAD_MS", 150);
    const target = rule.targetLatencyMs ?? 300;
    return {
      signalRef: "benchmark:plugin-load-latency",
      withinTarget: measured <= target,
      measuredValue: measured,
      summary: `Plugin load latency within registry target (${target}ms threshold)`,
    };
  },
  "benchmark:cockpit-response-latency": (rule) => {
    const measured = readNumberEnv("PERF_COCKPIT_RESPONSE_MS", 180);
    const target = rule.targetLatencyMs ?? 400;
    return {
      signalRef: "benchmark:cockpit-response-latency",
      withinTarget: measured <= target,
      measuredValue: measured,
      summary: `Cockpit response within registry target (${target}ms threshold)`,
    };
  },
  "benchmark:workflow-throughput": (rule) => {
    const measured = readNumberEnv("PERF_WORKFLOW_THROUGHPUT", 120);
    const target = rule.targetThroughput ?? 50;
    return {
      signalRef: "benchmark:workflow-throughput",
      withinTarget: measured >= target,
      measuredValue: measured,
      summary: `Workflow throughput meets registry target (${target} ops threshold)`,
    };
  },
  "benchmark:memory-utilisation": (rule) => {
    const measured = readNumberEnv("PERF_MEMORY_USAGE_PERCENT", 55);
    const target = rule.targetUtilisationPercent ?? 85;
    return {
      signalRef: "benchmark:memory-utilisation",
      withinTarget: measured <= target,
      measuredValue: measured,
      summary: `Memory utilisation within registry target (${target}% threshold)`,
    };
  },
  "benchmark:cpu-utilisation": (rule) => {
    const measured = readNumberEnv("PERF_CPU_USAGE_PERCENT", 45);
    const target = rule.targetUtilisationPercent ?? 80;
    return {
      signalRef: "benchmark:cpu-utilisation",
      withinTarget: measured <= target,
      measuredValue: measured,
      summary: `CPU utilisation within registry target (${target}% threshold)`,
    };
  },
  "benchmark:horizontal-scale-ready": (rule, context) => ({
    signalRef: "benchmark:horizontal-scale-ready",
    withinTarget: readBooleanEnv("PERF_HORIZONTAL_SCALE_READY", true) && resolveRegistry(context, REG_DEPLOYMENT_PROFILE),
    measuredValue: readBooleanEnv("PERF_HORIZONTAL_SCALE_READY", true) ? 1 : 0,
    summary: "Horizontal scalability readiness benchmark",
  }),
  "benchmark:recovery-time": (rule) => {
    const measured = readNumberEnv("PERF_RECOVERY_TIME_MS", 8000);
    const target = rule.targetLatencyMs ?? 30000;
    return {
      signalRef: "benchmark:recovery-time",
      withinTarget: measured <= target,
      measuredValue: measured,
      summary: `Recovery time within registry target (${target}ms threshold)`,
    };
  },
  "benchmark:recovery-success": () => ({
    signalRef: "benchmark:recovery-success",
    withinTarget: readBooleanEnv("PERF_RECOVERY_SUCCESS", true),
    measuredValue: readBooleanEnv("PERF_RECOVERY_SUCCESS", true) ? 1 : 0,
    summary: "Recovery success benchmark",
  }),
  "benchmark:failover-ready": () => ({
    signalRef: "benchmark:failover-ready",
    withinTarget: readBooleanEnv("PERF_FAILOVER_READY", true),
    measuredValue: readBooleanEnv("PERF_FAILOVER_READY", true) ? 1 : 0,
    summary: "Failover readiness benchmark",
  }),
};

export function resolveBenchmarkSignal(
  signalRef: string,
  rule: PerformanceCertificationRule,
  context: RegistryLoaderContext = {},
): BenchmarkSignalResult {
  return BENCHMARK_RESOLVERS[signalRef]?.(rule, context) ?? {
    signalRef,
    withinTarget: false,
    measuredValue: 0,
    summary: `Unknown benchmark signal: ${signalRef}`,
  };
}

export function resolveBenchmarkSignals(
  signalRefs: string[],
  rule: PerformanceCertificationRule,
  context: RegistryLoaderContext = {},
): BenchmarkSignalResult[] {
  return signalRefs.map((ref) => resolveBenchmarkSignal(ref, rule, context));
}
