/**
 * G6-06 — Performance, scalability & resilience validators.
 */

import type {
  PerformanceBenchmarkEntry,
  PerformanceBottleneck,
  PerformanceRiskEntry,
  PerformanceTrendEntry,
  ResilienceStatusSummary,
  ScalabilityStatusSummary,
} from "../contracts/performance-certification-types.js";
import type { PerformanceCertificationRule } from "../registry/performance-registry-resolver.js";
import { resolveBenchmarkSignals } from "../registry/performance-benchmark-resolver.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

function toBottleneck(
  rule: PerformanceCertificationRule,
  message: string,
  severity: PerformanceBottleneck["severity"],
  suffix: string,
): PerformanceBottleneck {
  return {
    bottleneckId: `perf-${suffix}-${rule.ruleId}`,
    ruleId: rule.ruleId,
    ruleKind: rule.ruleKind,
    performanceDomain: rule.performanceDomain,
    serviceId: rule.serviceId,
    severity,
    message,
    recommendation: `Resolve performance certification for ${rule.performanceDomain}`,
  };
}

const FAILURE_HANDLERS: Record<string, (rule: PerformanceCertificationRule) => PerformanceBottleneck | undefined> = {
  slow_apis: (rule) => process.env.PERF_API_SLOW === "true" ? toBottleneck(rule, "Slow APIs detected", "critical", "api") : undefined,
  slow_brain_dispatch: (rule) => process.env.PERF_BRAIN_SLOW === "true" ? toBottleneck(rule, "Slow Brain dispatch detected", "critical", "brain") : undefined,
  queue_congestion: (rule) => process.env.PERF_QUEUE_CONGESTION === "true" ? toBottleneck(rule, "Queue congestion detected", "critical", "queue") : undefined,
  database_bottlenecks: (rule) => process.env.PERF_DB_BOTTLENECK === "true" ? toBottleneck(rule, "Database bottleneck detected", "critical", "db") : undefined,
  plugin_bottlenecks: (rule) => process.env.PERF_PLUGIN_BOTTLENECK === "true" ? toBottleneck(rule, "Plugin bottleneck detected", "high", "plugin") : undefined,
  memory_leaks: (rule) => process.env.PERF_MEMORY_LEAK === "true" ? toBottleneck(rule, "Memory leak indicators detected", "critical", "memory") : undefined,
  resource_exhaustion: (rule) => process.env.PERF_RESOURCE_EXHAUSTION === "true" ? toBottleneck(rule, "Resource exhaustion detected", "critical", "resource") : undefined,
  high_latency: (rule) => process.env.PERF_HIGH_LATENCY === "true" ? toBottleneck(rule, "High latency detected", "high", "latency") : undefined,
  poor_recovery_time: (rule) => process.env.PERF_POOR_RECOVERY === "true" ? toBottleneck(rule, "Poor recovery time detected", "critical", "recovery") : undefined,
  failed_failover: (rule) => process.env.PERF_FAILOVER_FAILED === "true" ? toBottleneck(rule, "Failover readiness failed", "critical", "failover") : undefined,
  scalability_limitations: (rule) => process.env.PERF_SCALABILITY_LIMIT === "true" ? toBottleneck(rule, "Scalability limitations detected", "high", "scale") : undefined,
};

export function validatePerformanceRules(
  rules: PerformanceCertificationRule[],
  context: RegistryLoaderContext,
): {
  bottlenecks: PerformanceBottleneck[];
  warnings: PerformanceBottleneck[];
  benchmarks: PerformanceBenchmarkEntry[];
  trends: PerformanceTrendEntry[];
} {
  const bottlenecks: PerformanceBottleneck[] = [];
  const warnings: PerformanceBottleneck[] = [];
  const benchmarks: PerformanceBenchmarkEntry[] = [];
  const trends: PerformanceTrendEntry[] = [];

  for (const rule of rules) {
    const signals = resolveBenchmarkSignals(rule.benchmarkSignals, rule, context);
    for (const signal of signals) {
      benchmarks.push({
        benchmarkId: `${rule.ruleId}:${signal.signalRef}`,
        performanceDomain: rule.performanceDomain,
        signalRef: signal.signalRef,
        withinTarget: signal.withinTarget,
        summary: signal.summary,
      });
      trends.push({
        trendId: `trend-${rule.ruleId}:${signal.signalRef}`,
        performanceDomain: rule.performanceDomain,
        direction: signal.withinTarget ? "stable" : "degrading",
        summary: signal.withinTarget ? "Benchmark within registry target" : "Benchmark exceeding registry target",
      });
    }

    const failed = signals.filter((s) => !s.withinTarget);
    if (failed.length > 0) {
      const finding = toBottleneck(
        rule,
        `Performance certification failed for ${rule.serviceId}: ${failed.map((s) => s.signalRef).join(", ")}`,
        failed.length === signals.length ? "critical" : "high",
        "benchmark",
      );
      if (finding.severity === "critical") bottlenecks.push(finding);
      else warnings.push(finding);
    }

    if (rule.registryRef) {
      try {
        const result = getRegistryLoader().resolve(
          context,
          rule.registryRef as Parameters<ReturnType<typeof getRegistryLoader>["resolve"]>[1],
        );
        if (!result.meta.wired) {
          warnings.push(toBottleneck(rule, `Registry ${rule.registryRef} not fully wired`, "medium", "registry"));
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        bottlenecks.push(toBottleneck(rule, `Registry failure: ${reason}`, "critical", "registry-fail"));
      }
    }

    for (const condition of rule.failureConditions) {
      const finding = FAILURE_HANDLERS[condition]?.(rule);
      if (!finding) continue;
      if (finding.severity === "critical") bottlenecks.push(finding);
      else warnings.push(finding);
    }
  }

  return { bottlenecks, warnings, benchmarks, trends };
}

export const validateApiPerformance = (rules: PerformanceCertificationRule[], ctx: RegistryLoaderContext) =>
  validatePerformanceRules(rules.filter((r) => r.ruleKind === "api_performance"), ctx);

export const validateDatabasePerformance = (rules: PerformanceCertificationRule[], ctx: RegistryLoaderContext) =>
  validatePerformanceRules(rules.filter((r) => r.ruleKind === "database_performance"), ctx);

export const validateQueueThroughput = (rules: PerformanceCertificationRule[], ctx: RegistryLoaderContext) =>
  validatePerformanceRules(rules.filter((r) => r.ruleKind === "queue_throughput"), ctx);

export const validateBrainPerformance = (rules: PerformanceCertificationRule[], ctx: RegistryLoaderContext) =>
  validatePerformanceRules(rules.filter((r) => r.ruleKind === "brain_performance"), ctx);

export const validateCockpitPerformance = (rules: PerformanceCertificationRule[], ctx: RegistryLoaderContext) =>
  validatePerformanceRules(rules.filter((r) => r.ruleKind === "cockpit_performance"), ctx);

export const validatePluginPerformance = (rules: PerformanceCertificationRule[], ctx: RegistryLoaderContext) =>
  validatePerformanceRules(rules.filter((r) => r.ruleKind === "plugin_performance"), ctx);

export const validateResilience = (rules: PerformanceCertificationRule[], ctx: RegistryLoaderContext) =>
  validatePerformanceRules(rules.filter((r) => r.ruleKind === "resilience"), ctx);

export const validateFailoverReadiness = (rules: PerformanceCertificationRule[], ctx: RegistryLoaderContext) =>
  validatePerformanceRules(rules.filter((r) => r.ruleKind === "failover_readiness"), ctx);

export const validateRecoveryPerformance = (rules: PerformanceCertificationRule[], ctx: RegistryLoaderContext) =>
  validatePerformanceRules(
    rules.filter((r) => r.ruleKind === "recovery_speed" || r.ruleKind === "recovery_success"),
    ctx,
  );

export const validateScalability = (rules: PerformanceCertificationRule[], ctx: RegistryLoaderContext) =>
  validatePerformanceRules(
    rules.filter((r) =>
      r.ruleKind === "horizontal_scalability" ||
      r.ruleKind === "workflow_throughput" ||
      r.ruleKind === "queue_throughput" ||
      r.ruleKind === "cpu_utilisation" ||
      r.ruleKind === "memory_usage",
    ),
    ctx,
  );

export function deriveScalabilityStatus(benchmarks: PerformanceBenchmarkEntry[]): ScalabilityStatusSummary {
  const within = (ref: string) => benchmarks.some((b) => b.signalRef === ref && b.withinTarget);
  return {
    horizontalScaleReady: within("benchmark:horizontal-scale-ready"),
    workflowThroughputReady: within("benchmark:workflow-throughput"),
    queueThroughputReady: within("benchmark:queue-throughput"),
  };
}

export function deriveResilienceStatus(benchmarks: PerformanceBenchmarkEntry[]): ResilienceStatusSummary {
  const within = (ref: string) => benchmarks.some((b) => b.signalRef === ref && b.withinTarget);
  return {
    failoverReady: within("benchmark:failover-ready"),
    recoverySuccess: within("benchmark:recovery-success"),
    recoverySpeedAcceptable: within("benchmark:recovery-time"),
  };
}

export function analysePerformanceRisks(input: {
  bottlenecks: PerformanceBottleneck[];
  warnings: PerformanceBottleneck[];
}): { riskRegister: PerformanceRiskEntry[]; executiveRecommendations: string[] } {
  const all = [...input.bottlenecks, ...input.warnings];
  const riskRegister = all
    .filter((f) => f.severity === "critical" || f.severity === "high" || f.severity === "medium")
    .map((finding) => ({
      riskId: `risk-${finding.bottleneckId}`,
      ruleId: finding.ruleId,
      performanceDomain: finding.performanceDomain,
      severity: finding.severity,
      summary: finding.message,
      mitigation: finding.recommendation,
    }));

  const recommendations = new Set<string>();
  if (input.bottlenecks.some((b) => b.ruleKind === "api_performance")) {
    recommendations.add("Optimise API latency before production load increase");
  }
  if (input.bottlenecks.some((b) => b.ruleKind === "database_performance")) {
    recommendations.add("Address database bottlenecks and query performance");
  }
  if (input.bottlenecks.some((b) => b.ruleKind === "failover_readiness" || b.ruleKind === "recovery_speed")) {
    recommendations.add("Improve failover and recovery readiness");
  }
  if (input.bottlenecks.length === 0 && input.warnings.length === 0) {
    recommendations.add("Performance, scalability and resilience certified — proceed with Grand King readiness");
  } else if (recommendations.size === 0) {
    recommendations.add("Review performance bottlenecks and warnings before peak load");
  }

  return { riskRegister, executiveRecommendations: [...recommendations] };
}
