/** PILLOW-CLM-001 — Company Lifecycle Manager paths (X2-17). */

export const COMPANY_LIFECYCLE_MANAGER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_COMPANY_LIFECYCLE_MANAGER_SYSTEM.md";

export const CLM_METADATA_VERSION = "CLM-001-v1" as const;

export const COMPANY_LIFECYCLE_MANAGER_ID = "company-lifecycle-manager" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "assessing",
  "transitioning",
  "recommending",
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

export const CLM_CAPABILITIES = [
  "company_lifecycle_stage_management",
  "company_maturity_tracking",
  "lifecycle_transition_detection",
  "company_launch_management",
  "company_growth_management",
  "mature_business_management",
  "company_retirement_management",
  "lifecycle_recommendations",
  "lifecycle_analytics",
  "lifecycle_validation",
  "lifecycle_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const LIFECYCLE_STAGES = [
  "launch",
  "growth",
  "mature",
  "retirement",
] as const;

export const LIFECYCLE_STATUSES = [
  "stable",
  "transition_pending",
  "transition_recommended",
  "retired",
  "attention_required",
] as const;
