/**
 * G7-07 — Autonomous operations registry type schemas.
 */

export const AUTONOMOUS_OPERATIONS_REGISTRY_VERSION = "g7-07-v1" as const;

export const AUTONOMOUS_EXECUTION_STATUSES = [
  "waiting",
  "scheduled",
  "running",
  "paused",
  "blocked",
  "approval_pending",
  "completed",
  "cancelled",
  "failed",
  "recovered",
] as const;

export type AutonomousExecutionStatus = (typeof AUTONOMOUS_EXECUTION_STATUSES)[number];

export const AUTONOMY_LEVELS = [
  "manual_only",
  "recommendation_only",
  "approval_required",
  "semi_autonomous",
  "fully_autonomous",
  "emergency_stop",
] as const;

export type AutonomyLevel = (typeof AUTONOMY_LEVELS)[number];

export const AUTONOMOUS_DOMAIN_IDS = [
  "commerce",
  "automation",
  "workflow_scheduling",
  "product_synchronisation",
  "inventory_synchronisation",
  "analytics_collection",
  "financial_reconciliation",
  "health_monitoring",
  "optimization",
  "executive_reporting",
] as const;

export type AutonomousDomainId = (typeof AUTONOMOUS_DOMAIN_IDS)[number];

export const AUTONOMOUS_OPERATION_TYPES = [
  "commerce_execute",
  "automation_execute",
  "workflow_schedule",
  "product_sync",
  "inventory_sync",
  "analytics_collect",
  "financial_reconcile",
  "health_monitor",
  "optimization_apply",
  "executive_report",
] as const;

export type AutonomousOperationType = (typeof AUTONOMOUS_OPERATION_TYPES)[number];

export const AUTONOMOUS_HEALTH_STATUSES = ["healthy", "degraded", "critical", "unknown"] as const;

export type AutonomousHealthStatus = (typeof AUTONOMOUS_HEALTH_STATUSES)[number];
