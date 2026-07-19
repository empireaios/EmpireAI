/** PILLOW-RME-001 — Review Management Engine paths (R4-11). */

export const REVIEW_MANAGEMENT_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_REVIEW_MANAGEMENT_ENGINE_SYSTEM.md";

export const RME_METADATA_VERSION = "RME-001-v1" as const;

export const REVIEW_MANAGEMENT_ENGINE_ID = "review-management-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "processing",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const ENGINE_STATES = [
  "registered",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const MARKETPLACE_CHANNELS = [
  "amazon",
  "ebay",
  "shopify",
  "google",
  "direct",
  "other",
] as const;

export const REVIEW_SENTIMENTS = ["positive", "neutral", "negative"] as const;

export const REVIEW_STATUSES = [
  "pending",
  "collected",
  "imported",
  "classified",
  "validated",
  "failed",
] as const;

export const ALERT_STATUSES = ["none", "pending", "active", "resolved"] as const;

export const RME_CAPABILITIES = [
  "review_collection",
  "marketplace_import",
  "rating_recording",
  "comment_recording",
  "sentiment_classification",
  "negative_detection",
  "positive_detection",
  "trend_tracking",
  "reputation_alerts",
  "failure_detection",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
