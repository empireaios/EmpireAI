/** PILLOW-CSE-001 — Customer Sentiment Engine paths (R4-10). */

export const CUSTOMER_SENTIMENT_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CUSTOMER_SENTIMENT_ENGINE_SYSTEM.md";

export const CSE_METADATA_VERSION = "CSE-001-v1" as const;

export const CUSTOMER_SENTIMENT_ENGINE_ID = "customer-sentiment-engine" as const;

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

export const COMMUNICATION_CHANNELS = ["live_chat", "email", "sms", "whatsapp"] as const;

export const SENTIMENT_CATEGORIES = [
  "positive",
  "neutral",
  "negative",
  "frustrated",
  "satisfied",
  "escalation_risk",
] as const;

export const ALERT_STATUSES = ["none", "pending", "active", "resolved"] as const;

export const CSE_CAPABILITIES = [
  "message_analysis",
  "conversation_analysis",
  "satisfaction_detection",
  "frustration_detection",
  "escalation_risk_detection",
  "positive_experience_detection",
  "trend_tracking",
  "score_calculation",
  "alert_generation",
  "failure_detection",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
