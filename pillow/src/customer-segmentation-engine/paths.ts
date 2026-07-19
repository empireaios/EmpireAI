/** PILLOW-CSEG-001 — Customer Segmentation Engine paths (R4-16). */

export const CUSTOMER_SEGMENTATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CUSTOMER_SEGMENTATION_ENGINE_SYSTEM.md";

export const CSEG_METADATA_VERSION = "CSEG-001-v1" as const;

export const CUSTOMER_SEGMENTATION_ENGINE_ID = "customer-segmentation-engine" as const;

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

export const SEGMENT_TYPES = [
  "demographics",
  "purchasing",
  "value",
  "loyalty",
  "sentiment",
  "risk",
  "behaviour",
  "composite",
] as const;

export const VALUE_TIERS = ["standard", "high", "premium", "declining"] as const;
export const RISK_TIERS = ["low", "medium", "high", "critical"] as const;
export const BEHAVIOUR_PROFILES = [
  "new_customer",
  "occasional_buyer",
  "frequent_buyer",
  "loyal_advocate",
  "at_risk",
  "dormant",
] as const;

export const CSEG_CAPABILITIES = [
  "segment_creation",
  "automatic_assignment",
  "demographic_segmentation",
  "behaviour_segmentation",
  "value_segmentation",
  "loyalty_segmentation",
  "sentiment_segmentation",
  "risk_segmentation",
  "change_detection",
  "failure_detection",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
