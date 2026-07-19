/** PILLOW-CTE-001 — Customer Timeline Engine paths (R4-03). */

export const CUSTOMER_TIMELINE_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CUSTOMER_TIMELINE_ENGINE_SYSTEM.md";

export const CTE_METADATA_VERSION = "CTE-001-v1" as const;

export const CUSTOMER_TIMELINE_ENGINE_ID = "customer-timeline-engine" as const;

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

export const EVENT_TYPES = [
  "interaction",
  "purchase",
  "support",
  "communication",
  "account_change",
  "milestone",
  "event",
] as const;

export const EVENT_SOURCES = [
  "crm",
  "identity",
  "marketplace",
  "support",
  "communication",
  "manual",
  "system",
] as const;

export const EVENT_STATUSES = [
  "recorded",
  "pending",
  "validated",
  "failed",
  "archived",
] as const;

export const CTE_CAPABILITIES = [
  "event_recording",
  "interaction_tracking",
  "purchase_recording",
  "support_activity_recording",
  "communication_history",
  "account_change_recording",
  "milestone_recording",
  "chronological_ordering",
  "timeline_search",
  "timeline_validation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
