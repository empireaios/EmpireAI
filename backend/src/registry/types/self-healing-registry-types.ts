/**
 * G7-08 — Self-healing registry type schemas.
 */

export const SELF_HEALING_REGISTRY_VERSION = "g7-08-v1" as const;

export const HEALTH_STATES = [
  "healthy",
  "degraded",
  "recovering",
  "healing",
  "stable",
  "blocked",
  "critical",
  "failed",
  "unknown",
] as const;

export type HealthState = (typeof HEALTH_STATES)[number];

export const SELF_HEALING_DOMAIN_IDS = [
  "commerce",
  "business_automation",
  "identity",
  "production_workspace",
  "infrastructure",
  "brain",
  "registry",
  "pillow",
  "ekls",
  "cockpit",
  "business_engines",
  "provider_connections",
] as const;

export type SelfHealingDomainId = (typeof SELF_HEALING_DOMAIN_IDS)[number];

export const HEALING_ACTIONS = [
  "restart",
  "retry",
  "rollback",
  "reconnect",
  "revalidate",
  "resynchronise",
  "reload",
  "reconfigure",
  "escalate",
  "manual_intervention",
  "future_healing_action",
] as const;

export type HealingAction = (typeof HEALING_ACTIONS)[number];

export const HEALING_EXECUTION_STATUSES = [
  "waiting",
  "recommended",
  "approval_pending",
  "executing",
  "completed",
  "failed",
  "cancelled",
  "paused",
] as const;

export type HealingExecutionStatus = (typeof HEALING_EXECUTION_STATUSES)[number];
