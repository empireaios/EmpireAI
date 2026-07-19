/** PILLOW-TME-001 — Ticket Management Engine paths (R4-09). */

export const TICKET_MANAGEMENT_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_TICKET_MANAGEMENT_ENGINE_SYSTEM.md";

export const TME_METADATA_VERSION = "TME-001-v1" as const;

export const TICKET_MANAGEMENT_ENGINE_ID = "ticket-management-engine" as const;

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

export const TICKET_CATEGORIES = [
  "technical",
  "billing",
  "account",
  "shipping",
  "general",
  "escalation",
] as const;

export const TICKET_PRIORITIES = ["low", "medium", "high", "critical"] as const;

export const TICKET_STATUSES = [
  "open",
  "assigned",
  "in_progress",
  "pending",
  "resolved",
  "closed",
  "failed",
] as const;

export const RESOLUTION_STATUSES = ["unresolved", "in_progress", "resolved", "failed"] as const;

export const TME_CAPABILITIES = [
  "ticket_creation",
  "category_classification",
  "priority_assignment",
  "ownership_assignment",
  "lifecycle_tracking",
  "customer_linking",
  "conversation_linking",
  "timeline_linking",
  "overdue_detection",
  "stalled_detection",
  "failure_detection",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
