/**
 * G7-04 — Executive decision registry type schemas.
 */

export const EXECUTIVE_DECISION_REGISTRY_VERSION = "g7-04-v1" as const;

export const EXECUTIVE_DOMAIN_IDS = [
  "commerce",
  "automation",
  "identity",
  "authorizations",
  "business_engines",
  "executive_ai",
  "infrastructure",
  "production_certification",
  "live_operations",
  "incidents",
  "recoveries",
  "approvals",
  "learning",
  "financial_health",
] as const;

export type ExecutiveDomainId = (typeof EXECUTIVE_DOMAIN_IDS)[number];

export const EXECUTIVE_DECISION_TYPES = [
  "approve",
  "reject",
  "pause",
  "resume",
  "cancel",
  "restart",
  "retry",
  "rollback",
  "escalate",
  "acknowledge",
  "review",
  "delegate",
] as const;

export type ExecutiveDecisionType = (typeof EXECUTIVE_DECISION_TYPES)[number];

export const EXECUTIVE_DECISION_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "executing",
  "completed",
  "cancelled",
  "escalated",
] as const;

export type ExecutiveDecisionStatus = (typeof EXECUTIVE_DECISION_STATUSES)[number];

export const EXECUTIVE_PRIORITIES = ["low", "medium", "high", "critical"] as const;

export type ExecutivePriority = (typeof EXECUTIVE_PRIORITIES)[number];
