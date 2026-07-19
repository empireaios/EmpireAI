/** PILLOW-CCO-001 — Cross-Channel Orchestrator paths (R5-18). */

export const CROSS_CHANNEL_ORCHESTRATOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CROSS_CHANNEL_ORCHESTRATOR_SYSTEM.md";

export const CCO_METADATA_VERSION = "CCO-001-v1" as const;

export const CROSS_CHANNEL_ORCHESTRATOR_ID = "cross-channel-orchestrator" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "orchestrating",
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
  "seo",
  "cross_channel",
] as const;

export const SYNC_STATUSES = [
  "pending",
  "synchronized",
  "partial",
  "conflicted",
  "failed",
] as const;

export const CCO_CAPABILITIES = [
  "campaign_coordination",
  "execution_synchronization",
  "schedule_synchronization",
  "journey_coordination",
  "channel_coordination",
  "budget_coordination",
  "asset_coordination",
  "experiment_coordination",
  "channel_conflict_detection",
  "orchestration_validation",
  "orchestration_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
