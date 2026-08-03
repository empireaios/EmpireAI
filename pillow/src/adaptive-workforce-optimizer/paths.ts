/** PILLOW-AWO-001 — Adaptive Workforce Optimizer (Q0-17). */
export const ADAPTIVE_WORKFORCE_OPTIMIZER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ADAPTIVE_WORKFORCE_OPTIMIZER_SYSTEM.md" as const;
export const ADAPTIVE_WORKFORCE_OPTIMIZER_ID = "adaptive-workforce-optimizer" as const;
export const AWO_METADATA_VERSION = "AWO-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "analysing",
  "detecting",
  "recommending",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default optimization targets (Q0-17).
 * Architecture allows additional targets via configuration without redesign.
 */
export const OPTIMIZATION_TARGETS = [
  "worker_assignment",
  "worker_utilization",
  "worker_performance",
  "collaboration",
  "routing",
  "queue_efficiency",
  "throughput",
  "accuracy",
  "reliability",
  "operational_cost",
] as const;

export const OPTIMIZATION_SCOPES = [
  "workforce",
  "department",
  "worker",
  "routing",
  "collaboration",
  "capability",
] as const;

export const AWO_CAPABILITIES = [
  "analyse_workforce_performance",
  "analyse_worker_utilization",
  "analyse_routing_efficiency",
  "analyse_collaboration_effectiveness",
  "detect_bottlenecks",
  "detect_underutilized_workers",
  "detect_overloaded_workers",
  "recommend_workforce_improvements",
  "recommend_routing_improvements",
  "recommend_collaboration_improvements",
  "recommend_capability_improvements",
  "produce_optimization_records",
  "machine_readable_optimization_output",
  "extensible_optimization_targets",
  "preserve_auditability",
  "preserve_traceability",
  "adaptive_workforce_optimizer_validation",
  "health_monitoring",
  "recovery_management",
] as const;
