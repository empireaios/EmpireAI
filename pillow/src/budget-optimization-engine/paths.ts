/** PILLOW-BOE-001 — Budget Optimization Engine paths (R5-13). */

export const BUDGET_OPTIMIZATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BUDGET_OPTIMIZATION_ENGINE_SYSTEM.md";

export const BOE_METADATA_VERSION = "BOE-001-v1" as const;

export const BUDGET_OPTIMIZATION_ENGINE_ID = "budget-optimization-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "optimizing",
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

export const MARKETING_CHANNELS = [
  "meta_ads",
  "google_ads",
  "tiktok_ads",
  "youtube_ads",
  "cross_channel",
] as const;

export const BOE_CAPABILITIES = [
  "campaign_budget_management",
  "channel_budget_allocation",
  "dynamic_budget_reallocation",
  "spend_monitoring",
  "utilization_monitoring",
  "inefficiency_detection",
  "overspend_detection",
  "budget_efficiency_calculation",
  "budget_adjustment_recommendations",
  "budget_validation",
  "budget_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
