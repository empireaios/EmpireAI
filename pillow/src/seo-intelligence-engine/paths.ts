/** PILLOW-SIE-001 — SEO Intelligence Engine paths (R5-06). */

export const SEO_INTELLIGENCE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SEO_INTELLIGENCE_SYSTEM.md";

export const SIE_METADATA_VERSION = "SIE-001-v1" as const;

export const SEO_INTELLIGENCE_ENGINE_ID = "seo-intelligence-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "analyzing",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const OPERATIONAL_STATES = [
  "registered",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const SIE_CAPABILITIES = [
  "seo_project_management",
  "page_analysis",
  "keyword_management",
  "keyword_ranking_tracking",
  "seo_issue_detection",
  "technical_seo_analysis",
  "metadata_optimization",
  "internal_linking_recommendations",
  "seo_recommendation_generation",
  "organic_performance_monitoring",
  "seo_validation",
  "seo_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const SEO_ISSUE_SEVERITIES = ["low", "medium", "high", "critical"] as const;
