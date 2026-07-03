/**
 * G7-09 — Operational intelligence registry domain types.
 */

export const OPERATIONAL_INTELLIGENCE_REGISTRY_VERSION = "g7-09-v1" as const;

export const INTELLIGENCE_DOMAIN_IDS = [
  "commerce",
  "automation",
  "finance",
  "infrastructure",
  "identity",
  "providers",
  "marketplace",
  "storefront",
  "supplier",
  "advertising",
  "customer_behaviour",
  "business_health",
  "operational_health",
  "executive_kpis",
  "learning_trends",
] as const;

export type IntelligenceDomainId = (typeof INTELLIGENCE_DOMAIN_IDS)[number];

export const INSIGHT_TYPES = [
  "trend",
  "warning",
  "opportunity",
  "risk",
  "prediction",
  "recommendation",
  "anomaly",
  "optimization",
  "executive_summary",
  "strategic_signal",
  "future_insight",
] as const;

export type InsightType = (typeof INSIGHT_TYPES)[number];

export const INSIGHT_SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;
export type InsightSeverity = (typeof INSIGHT_SEVERITIES)[number];

export const INSIGHT_PRIORITIES = ["low", "medium", "high", "critical", "strategic"] as const;
export type InsightPriority = (typeof INSIGHT_PRIORITIES)[number];

export const EXECUTIVE_KPI_IDS = [
  "revenue",
  "net_profit",
  "automation_success",
  "commerce_success",
  "provider_health",
  "operational_health",
  "system_health",
  "recovery_rate",
  "approval_rate",
  "growth_rate",
  "learning_velocity",
  "optimization_roi",
  "empire_health_score",
] as const;

export type ExecutiveKpiId = (typeof EXECUTIVE_KPI_IDS)[number];
