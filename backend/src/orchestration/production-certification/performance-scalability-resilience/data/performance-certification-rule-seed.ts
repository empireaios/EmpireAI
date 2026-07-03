/**
 * G6-06 — Performance certification rule seed (REG-CERTIFICATION-PERFORMANCE).
 */

import {
  CERTIFICATION_REGISTRY_VERSION,
  type CertificationRegistryRowBase,
} from "../../../../registry/types/certification-registry-types.js";

type RuleKind =
  | "api_performance"
  | "brain_performance"
  | "database_performance"
  | "queue_throughput"
  | "registry_lookup"
  | "plugin_performance"
  | "cockpit_performance"
  | "workflow_throughput"
  | "memory_usage"
  | "cpu_utilisation"
  | "horizontal_scalability"
  | "recovery_speed"
  | "recovery_success"
  | "failover_readiness"
  | "resilience";

function performanceRow(input: {
  id: string;
  name: string;
  ruleKind: RuleKind;
  performanceDomain: string;
  serviceId: string;
  benchmarkSignals?: string[];
  failureConditions?: string[];
  targetLatencyMs?: number;
  targetThroughput?: number;
  targetUtilisationPercent?: number;
  registryRef?: string;
}): CertificationRegistryRowBase {
  return {
    id: input.id,
    name: input.name,
    description: `Performance certification ${input.ruleKind} rule for ${input.performanceDomain}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: input.benchmarkSignals ?? [],
    capabilities: ["performance-validate"],
    configuration: {
      performanceCertificationRule: {
        schemaVersion: CERTIFICATION_REGISTRY_VERSION,
        ruleKind: input.ruleKind,
        performanceDomain: input.performanceDomain,
        serviceId: input.serviceId,
        benchmarkSignals: input.benchmarkSignals ?? [],
        failureConditions: input.failureConditions ?? [],
        targetLatencyMs: input.targetLatencyMs,
        targetThroughput: input.targetThroughput,
        targetUtilisationPercent: input.targetUtilisationPercent,
        registryRef: input.registryRef,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: CERTIFICATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via REG-CERTIFICATION-PERFORMANCE rows" },
  };
}

export const PERFORMANCE_CERTIFICATION_RULE_SEED_ROWS: CertificationRegistryRowBase[] = [
  performanceRow({
    id: "perf-rule-api-latency",
    name: "API latency certification",
    ruleKind: "api_performance",
    performanceDomain: "api_latency",
    serviceId: "api-gateway",
    benchmarkSignals: ["benchmark:api-latency"],
    failureConditions: ["slow_apis", "high_latency"],
    targetLatencyMs: 500,
  }),
  performanceRow({
    id: "perf-rule-brain-dispatch",
    name: "Brain dispatch latency certification",
    ruleKind: "brain_performance",
    performanceDomain: "brain_dispatch_latency",
    serviceId: "brain",
    benchmarkSignals: ["benchmark:brain-dispatch-latency"],
    failureConditions: ["slow_brain_dispatch", "high_latency"],
    targetLatencyMs: 200,
  }),
  performanceRow({
    id: "perf-rule-database",
    name: "Database performance certification",
    ruleKind: "database_performance",
    performanceDomain: "database_performance",
    serviceId: "database",
    benchmarkSignals: ["benchmark:database-query-latency"],
    failureConditions: ["database_bottlenecks"],
    targetLatencyMs: 100,
    registryRef: "REG-DEPLOYMENT-PROFILE",
  }),
  performanceRow({
    id: "perf-rule-queue-throughput",
    name: "Queue throughput certification",
    ruleKind: "queue_throughput",
    performanceDomain: "queue_throughput",
    serviceId: "job-queue",
    benchmarkSignals: ["benchmark:queue-throughput"],
    failureConditions: ["queue_congestion"],
    targetThroughput: 100,
  }),
  performanceRow({
    id: "perf-rule-registry-lookup",
    name: "Registry lookup performance certification",
    ruleKind: "registry_lookup",
    performanceDomain: "registry_lookup_performance",
    serviceId: "registry",
    benchmarkSignals: ["benchmark:registry-lookup-latency"],
    failureConditions: ["high_latency"],
    targetLatencyMs: 50,
    registryRef: "REG-DOCTRINE",
  }),
  performanceRow({
    id: "perf-rule-plugin-loading",
    name: "Plugin loading performance certification",
    ruleKind: "plugin_performance",
    performanceDomain: "plugin_loading_performance",
    serviceId: "plugin-runtime",
    benchmarkSignals: ["benchmark:plugin-load-latency"],
    failureConditions: ["plugin_bottlenecks"],
    targetLatencyMs: 300,
  }),
  performanceRow({
    id: "perf-rule-cockpit",
    name: "Cockpit responsiveness certification",
    ruleKind: "cockpit_performance",
    performanceDomain: "cockpit_responsiveness",
    serviceId: "cockpit",
    benchmarkSignals: ["benchmark:cockpit-response-latency"],
    failureConditions: ["high_latency"],
    targetLatencyMs: 400,
  }),
  performanceRow({
    id: "perf-rule-workflow-throughput",
    name: "Workflow throughput certification",
    ruleKind: "workflow_throughput",
    performanceDomain: "workflow_throughput",
    serviceId: "automation-workflow",
    benchmarkSignals: ["benchmark:workflow-throughput"],
    failureConditions: ["queue_congestion"],
    targetThroughput: 50,
    registryRef: "REG-AUTOMATION-WORKFLOW",
  }),
  performanceRow({
    id: "perf-rule-memory",
    name: "Memory usage certification",
    ruleKind: "memory_usage",
    performanceDomain: "memory_usage",
    serviceId: "platform-runtime",
    benchmarkSignals: ["benchmark:memory-utilisation"],
    failureConditions: ["memory_leaks", "resource_exhaustion"],
    targetUtilisationPercent: 85,
  }),
  performanceRow({
    id: "perf-rule-cpu",
    name: "CPU utilisation certification",
    ruleKind: "cpu_utilisation",
    performanceDomain: "cpu_utilisation",
    serviceId: "platform-runtime",
    benchmarkSignals: ["benchmark:cpu-utilisation"],
    failureConditions: ["resource_exhaustion"],
    targetUtilisationPercent: 80,
  }),
  performanceRow({
    id: "perf-rule-horizontal-scale",
    name: "Horizontal scalability certification",
    ruleKind: "horizontal_scalability",
    performanceDomain: "horizontal_scalability",
    serviceId: "deployment-scaler",
    benchmarkSignals: ["benchmark:horizontal-scale-ready"],
    failureConditions: ["scalability_limitations"],
    registryRef: "REG-DEPLOYMENT-PROFILE",
  }),
  performanceRow({
    id: "perf-rule-recovery-speed",
    name: "Recovery speed certification",
    ruleKind: "recovery_speed",
    performanceDomain: "recovery_speed",
    serviceId: "operational-recovery",
    benchmarkSignals: ["benchmark:recovery-time"],
    failureConditions: ["poor_recovery_time"],
    targetLatencyMs: 30000,
  }),
  performanceRow({
    id: "perf-rule-recovery-success",
    name: "Recovery success certification",
    ruleKind: "recovery_success",
    performanceDomain: "recovery_success",
    serviceId: "operational-recovery",
    benchmarkSignals: ["benchmark:recovery-success"],
    failureConditions: ["poor_recovery_time"],
  }),
  performanceRow({
    id: "perf-rule-failover",
    name: "Failover readiness certification",
    ruleKind: "failover_readiness",
    performanceDomain: "failover_readiness",
    serviceId: "failover-controller",
    benchmarkSignals: ["benchmark:failover-ready"],
    failureConditions: ["failed_failover"],
  }),
  performanceRow({
    id: "perf-rule-resilience",
    name: "Platform resilience certification",
    ruleKind: "resilience",
    performanceDomain: "platform_resilience",
    serviceId: "platform-resilience",
    benchmarkSignals: ["benchmark:recovery-success", "benchmark:failover-ready"],
    failureConditions: ["failed_failover", "poor_recovery_time", "resource_exhaustion"],
  }),
];
