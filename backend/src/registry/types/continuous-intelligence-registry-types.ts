/**
 * G7-06 — Continuous intelligence registry type schemas.
 */

export const CONTINUOUS_INTELLIGENCE_REGISTRY_VERSION = "g7-06-v1" as const;

export const OPTIMIZATION_STATUSES = [
  "detected",
  "analysing",
  "recommended",
  "approved",
  "scheduled",
  "executing",
  "completed",
  "cancelled",
  "rejected",
] as const;

export type OptimizationStatus = (typeof OPTIMIZATION_STATUSES)[number];

export const OPTIMIZATION_DOMAIN_IDS = [
  "commerce",
  "automation",
  "financial_operations",
  "identity",
  "infrastructure",
  "performance",
  "business_engines",
  "executive_ai",
  "cockpit",
  "production_workspace",
  "providers",
  "workflows",
] as const;

export type OptimizationDomainId = (typeof OPTIMIZATION_DOMAIN_IDS)[number];

export const OPTIMIZATION_TYPES = [
  "performance_optimization",
  "cost_optimization",
  "automation_optimization",
  "workflow_optimization",
  "commerce_optimization",
  "financial_optimization",
  "provider_optimization",
  "resource_optimization",
  "risk_reduction",
  "revenue_opportunity",
  "future_optimization_type",
] as const;

export type OptimizationType = (typeof OPTIMIZATION_TYPES)[number];

export const OPTIMIZATION_PRIORITIES = ["low", "medium", "high", "critical"] as const;

export type OptimizationPriority = (typeof OPTIMIZATION_PRIORITIES)[number];
