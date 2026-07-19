/** PILLOW-RIE-001 — Returns Intelligence paths (R4-13). */

export const RETURNS_INTELLIGENCE_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_RETURNS_INTELLIGENCE_SYSTEM.md";

export const RIE_METADATA_VERSION = "RIE-001-v1" as const;

export const RETURNS_INTELLIGENCE_ENGINE_ID = "returns-intelligence-engine" as const;

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

export const RETURN_REASONS = [
  "defective",
  "wrong_item",
  "not_as_described",
  "changed_mind",
  "damaged_in_transit",
  "other",
] as const;

export const RECOMMENDED_ACTIONS = [
  "approve",
  "deny",
  "manual_review",
  "request_evidence",
  "escalate",
] as const;

export const RIE_CAPABILITIES = [
  "return_request_analysis",
  "eligibility_evaluation",
  "history_analysis",
  "abnormal_detection",
  "repeat_pattern_detection",
  "decision_recommendation",
  "lifecycle_tracking",
  "communication_coordination",
  "insight_generation",
  "failure_detection",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
