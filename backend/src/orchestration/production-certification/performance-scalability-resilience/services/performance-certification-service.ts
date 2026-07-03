/**
 * G6-06 — Performance certification service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { PerformanceOverview, PerformanceScanResult } from "../contracts/performance-certification-types.js";
import { PERFORMANCE_SCALABILITY_RESILIENCE_CERTIFICATION_VERSION } from "../contracts/performance-certification-types.js";
import { recordPerformanceEklsObservation } from "../ekls/performance-ekls-integration.js";
import { validatePerformancePillowGovernance } from "../governance/performance-pillow-governance.js";
import { runPerformancePluginValidators } from "../plugins/performance-plugin-host.js";
import {
  listPerformanceDomains,
  resolvePerformanceCertificationRules,
} from "../registry/performance-registry-resolver.js";
import {
  computeExecutivePerformanceScore,
  derivePerformanceStatus,
} from "./executive-performance-score-engine.js";
import {
  analysePerformanceRisks,
  deriveResilienceStatus,
  deriveScalabilityStatus,
  validateApiPerformance,
  validateBrainPerformance,
  validateCockpitPerformance,
  validateDatabasePerformance,
  validateFailoverReadiness,
  validatePluginPerformance,
  validateQueueThroughput,
  validateRecoveryPerformance,
  validateResilience,
  validateScalability,
} from "../validation/performance-certification-validator.js";

let lastScan: PerformanceScanResult | undefined;

export function getPerformanceOverview(context: RegistryLoaderContext = {}): PerformanceOverview {
  const rules = resolvePerformanceCertificationRules(context);
  return {
    frameworkVersion: PERFORMANCE_SCALABILITY_RESILIENCE_CERTIFICATION_VERSION,
    ruleCount: rules.length,
    performanceDomainCount: listPerformanceDomains(context).length,
    lastScanId: lastScan?.scanId,
    lastStatus: lastScan?.status,
    generatedAt: new Date().toISOString(),
  };
}

export function getLastPerformanceScan(): PerformanceScanResult | undefined {
  return lastScan;
}

export function runPerformanceScan(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): PerformanceScanResult {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const governance = validatePerformancePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "performance_scan",
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const blocked: PerformanceScanResult = {
      scanId: randomUUID(),
      correlationId: randomUUID(),
      status: "blocked",
      performanceScore: 0,
      bottlenecks: [{
        bottleneckId: "pillow-blocked",
        ruleId: "pillow-governance",
        ruleKind: "governance",
        performanceDomain: "performance_scalability_resilience",
        serviceId: "platform",
        severity: "critical",
        message: governance.reason,
      }],
      warnings: [],
      benchmarks: [],
      trends: [],
      riskRegister: [],
      executiveRecommendations: ["Resolve Pillow governance rejection"],
      scalabilityStatus: { horizontalScaleReady: false, workflowThroughputReady: false, queueThroughputReady: false },
      resilienceStatus: { failoverReady: false, recoverySuccess: false, recoverySpeedAcceptable: false },
      scannedAt: new Date().toISOString(),
      discoverySource: "REG-CERTIFICATION-PERFORMANCE",
    };
    lastScan = blocked;
    return blocked;
  }

  const rules = resolvePerformanceCertificationRules(context);

  const api = validateApiPerformance(rules, context);
  const brain = validateBrainPerformance(rules, context);
  const database = validateDatabasePerformance(rules, context);
  const queue = validateQueueThroughput(rules, context);
  const cockpit = validateCockpitPerformance(rules, context);
  const plugin = validatePluginPerformance(rules, context);
  const scalability = validateScalability(rules, context);
  const resilience = validateResilience(rules, context);
  const failover = validateFailoverReadiness(rules, context);
  const recovery = validateRecoveryPerformance(rules, context);
  const pluginFindings = runPerformancePluginValidators({ workspaceId: input.workspaceId });

  const bottlenecks = [
    ...api.bottlenecks, ...brain.bottlenecks, ...database.bottlenecks, ...queue.bottlenecks,
    ...cockpit.bottlenecks, ...plugin.bottlenecks, ...scalability.bottlenecks, ...resilience.bottlenecks,
    ...failover.bottlenecks, ...recovery.bottlenecks,
    ...pluginFindings.filter((f) => f.severity === "critical" || f.severity === "high"),
  ];
  const warnings = [
    ...api.warnings, ...brain.warnings, ...database.warnings, ...queue.warnings,
    ...cockpit.warnings, ...plugin.warnings, ...scalability.warnings, ...resilience.warnings,
    ...failover.warnings, ...recovery.warnings,
    ...pluginFindings.filter((f) => f.severity !== "critical" && f.severity !== "high"),
  ];
  const benchmarks = [
    ...api.benchmarks, ...brain.benchmarks, ...database.benchmarks, ...queue.benchmarks,
    ...cockpit.benchmarks, ...plugin.benchmarks, ...scalability.benchmarks, ...resilience.benchmarks,
    ...failover.benchmarks, ...recovery.benchmarks,
  ];
  const trends = [
    ...api.trends, ...brain.trends, ...database.trends, ...queue.trends,
    ...cockpit.trends, ...plugin.trends, ...scalability.trends, ...resilience.trends,
    ...failover.trends, ...recovery.trends,
  ];

  const status = derivePerformanceStatus({ bottlenecks, warnings, pillowBlocked: false });
  const benchmarksWithinTarget = benchmarks.filter((b) => b.withinTarget).length;
  const performanceScore = computeExecutivePerformanceScore({
    bottlenecks,
    warnings,
    benchmarksWithinTarget,
    benchmarksTotal: benchmarks.length,
  });
  const scalabilityStatus = deriveScalabilityStatus(benchmarks);
  const resilienceStatus = deriveResilienceStatus(benchmarks);
  const { riskRegister, executiveRecommendations } = analysePerformanceRisks({ bottlenecks, warnings });

  const scanId = randomUUID();
  const result: PerformanceScanResult = {
    scanId,
    correlationId: randomUUID(),
    status,
    performanceScore,
    bottlenecks,
    warnings,
    benchmarks,
    trends,
    riskRegister,
    executiveRecommendations,
    scalabilityStatus,
    resilienceStatus,
    scannedAt: new Date().toISOString(),
    discoverySource: "REG-CERTIFICATION-PERFORMANCE",
  };

  lastScan = result;

  const eklsBase = {
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    scanId,
    pillowGovernance: true as const,
  };

  recordPerformanceEklsObservation({
    ...eklsBase,
    kind: "performance_scan_completed",
    summary: `Performance scan ${status} score=${performanceScore}`,
    signalValue: performanceScore,
  });

  for (const bottleneck of bottlenecks) {
    recordPerformanceEklsObservation({
      ...eklsBase,
      kind: "performance_failure",
      summary: bottleneck.message,
    });
  }

  for (const warning of warnings) {
    recordPerformanceEklsObservation({
      ...eklsBase,
      kind: "performance_warning",
      summary: warning.message,
    });
  }

  if (bottlenecks.length === 0) {
    recordPerformanceEklsObservation({
      ...eklsBase,
      kind: "performance_recovered",
      summary: "Performance recovery validated",
    });
  }

  if (status === "pass" || status === "pass_with_conditions") {
    recordPerformanceEklsObservation({
      ...eklsBase,
      kind: "performance_certified",
      summary: `Performance certified with status ${status}`,
      signalValue: performanceScore,
    });
  }

  return result;
}

export function resetPerformanceStateForTests(): void {
  lastScan = undefined;
}
