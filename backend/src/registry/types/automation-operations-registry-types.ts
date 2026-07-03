/**
 * G7-03 — Automation operation registry type schemas.
 */

export const AUTOMATION_OPERATIONS_REGISTRY_VERSION = "g7-03-v1" as const;

export const AUTOMATION_OPERATION_STATES = [
  "ready",
  "waiting",
  "scheduled",
  "executing",
  "paused",
  "approval_pending",
  "recovering",
  "completed",
  "cancelled",
  "failed",
  "blocked",
] as const;

export type AutomationOperationState = (typeof AUTOMATION_OPERATION_STATES)[number];

export const AUTOMATION_HEALTH_STATUSES = [
  "healthy",
  "degraded",
  "unhealthy",
  "unknown",
] as const;

export type AutomationHealthStatus = (typeof AUTOMATION_HEALTH_STATUSES)[number];

export const AUTOMATION_OPERATION_DOMAIN_IDS = [
  "trigger_engine",
  "workflow_scheduler",
  "workflow_orchestrator",
  "execution_broker",
  "approval_router",
  "recovery_engine",
  "automation_centre",
  "outcome_learning",
  "plugin_execution",
  "executive_monitoring",
] as const;

export type AutomationOperationDomainId = (typeof AUTOMATION_OPERATION_DOMAIN_IDS)[number];
