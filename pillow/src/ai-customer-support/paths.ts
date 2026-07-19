/** PILLOW-ACS-001 — AI Customer Support paths (R4-08). */

export const AI_CUSTOMER_SUPPORT_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AI_CUSTOMER_SUPPORT_SYSTEM.md";

export const ACS_METADATA_VERSION = "ACS-001-v1" as const;

export const AI_CUSTOMER_SUPPORT_ID = "ai-customer-support" as const;

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

export const CUSTOMER_INTENTS = [
  "support_request",
  "order_inquiry",
  "account_issue",
  "billing_question",
  "general_enquiry",
  "escalation_required",
] as const;

export const ESCALATION_STATUSES = ["none", "pending", "escalated", "resolved"] as const;

export const RESOLUTION_STATUSES = ["open", "in_progress", "resolved", "failed"] as const;

export const ACS_CAPABILITIES = [
  "enquiry_reception",
  "intent_understanding",
  "context_retrieval",
  "crm_integration",
  "autonomous_response",
  "escalation",
  "live_chat_support",
  "email_support",
  "sms_support",
  "whatsapp_support",
  "support_summaries",
  "failure_detection",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
