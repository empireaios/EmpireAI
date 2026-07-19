/** PILLOW-MEE-001 — Marketing Experiment Engine paths (R5-17). */

export const MARKETING_EXPERIMENT_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MARKETING_EXPERIMENT_ENGINE_SYSTEM.md";

export const MEE_METADATA_VERSION = "MEE-001-v1" as const;

export const MARKETING_EXPERIMENT_ENGINE_ID = "marketing-experiment-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "experimenting",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const OPERATIONAL_STATES = [
  "registered",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const EXPERIMENT_STATUSES = [
  "draft",
  "running",
  "analyzing",
  "completed",
  "archived",
  "failed",
] as const;

export const EXPERIMENT_TYPES = ["ab_test", "multivariate"] as const;

export const MEE_CAPABILITIES = [
  "experiment_creation",
  "ab_test_management",
  "multivariate_test_management",
  "audience_assignment",
  "performance_measurement",
  "variant_comparison",
  "statistical_significance_detection",
  "winning_variant_recommendation",
  "experiment_archival",
  "experiment_validation",
  "experiment_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
