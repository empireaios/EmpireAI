/** PILLOW-CAM-001 — Campaign Manager paths (R5-07). */

export const CAMPAIGN_MANAGER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CAMPAIGN_MANAGER_SYSTEM.md";

export const CAM_METADATA_VERSION = "CAM-001-v1" as const;

export const CAMPAIGN_MANAGER_ID = "campaign-manager" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "coordinating",
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

export const CAMPAIGN_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "scheduled",
  "running",
  "paused",
  "completed",
  "failed",
  "cancelled",
] as const;

export const EXECUTION_STATUSES = [
  "not_started",
  "queued",
  "executing",
  "partial",
  "succeeded",
  "failed",
] as const;

export const MARKETING_CHANNELS = [
  "meta",
  "google",
  "tiktok",
  "youtube",
  "seo",
] as const;

export const CAMPAIGN_OBJECTIVES = [
  "awareness",
  "traffic",
  "engagement",
  "leads",
  "conversions",
  "retention",
] as const;

export const CAM_CAPABILITIES = [
  "campaign_creation",
  "campaign_lifecycle_management",
  "campaign_objective_management",
  "campaign_scheduling",
  "campaign_status_management",
  "cross_channel_coordination",
  "campaign_execution_tracking",
  "campaign_failure_detection",
  "campaign_approvals",
  "campaign_validation",
  "campaign_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
