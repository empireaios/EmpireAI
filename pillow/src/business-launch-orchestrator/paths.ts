/** PILLOW-BLO-001 — Business Launch Orchestrator paths (X1-11). */

export const BUSINESS_LAUNCH_ORCHESTRATOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BUSINESS_LAUNCH_ORCHESTRATOR_SYSTEM.md";

export const BLO_METADATA_VERSION = "BLO-001-v1" as const;

export const BUSINESS_LAUNCH_ORCHESTRATOR_ID = "business-launch-orchestrator" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "launching",
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

export const BLO_CAPABILITIES = [
  "business_launch_orchestration",
  "launch_workflow_execution",
  "launch_stage_management",
  "launch_dependency_coordination",
  "launch_progress_tracking",
  "launch_failure_detection",
  "launch_recovery_coordination",
  "launch_report_generation",
  "launch_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const LAUNCH_STAGES = [
  "prerequisites_check",
  "brand_alignment",
  "digital_assets_ready",
  "storefront_activation",
  "pricing_activation",
  "go_live",
  "completed",
  "failed",
] as const;

export const LAUNCH_STATUSES = [
  "pending",
  "in_progress",
  "blocked",
  "recovering",
  "completed",
  "failed",
] as const;

export const RECOVERY_STATUSES = [
  "not_required",
  "pending",
  "in_progress",
  "recovered",
  "exhausted",
] as const;
