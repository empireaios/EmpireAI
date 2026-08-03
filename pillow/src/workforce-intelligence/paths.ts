/** PILLOW-WFI-001 — Workforce Intelligence paths (X3-08). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKFORCE_INTELLIGENCE_SYSTEM.md" as const;
export const WORKFORCE_INTELLIGENCE_SYSTEM_PATH = SYSTEM_PATH;

export const WFI_METADATA_VERSION = "WFI-001-v1" as const;
export const WORKFORCE_INTELLIGENCE_ID = "workforce-intelligence" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "analyzing",
  "detecting",
  "recommending",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const OPERATIONAL_STATES = [
  "disconnected",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const WFI_CAPABILITIES = [
  "workforce_capacity_monitoring",
  "agent_utilization_monitoring",
  "workload_distribution_monitoring",
  "execution_throughput_monitoring",
  "task_completion_monitoring",
  "workforce_efficiency_monitoring",
  "workforce_bottleneck_detection",
  "underutilized_agent_detection",
  "workforce_optimization_recommendations",
  "workforce_records",
  "workforce_validation",
  "workforce_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
