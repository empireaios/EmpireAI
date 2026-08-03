/** PILLOW-PIC-001 — Portfolio Intelligence Certified paths (X2-10). */

export const PORTFOLIO_INTELLIGENCE_CERTIFIED_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PORTFOLIO_INTELLIGENCE_CERTIFIED_SYSTEM.md";

export const PIC_METADATA_VERSION = "PIC-001-v1" as const;

export const PORTFOLIO_INTELLIGENCE_CERTIFIED_ID =
  "portfolio-intelligence-certified" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "certifying",
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

export const PIC_CAPABILITIES = [
  "portfolio_framework_validation",
  "company_registry_validation",
  "portfolio_analytics_validation",
  "knowledge_sharing_validation",
  "capital_distribution_validation",
  "executive_dashboard_validation",
  "portfolio_risk_validation",
  "portfolio_balance_validation",
  "business_health_validation",
  "end_to_end_enterprise_portfolio_validation",
  "certification_reporting",
  "certification_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const MODULE_PASS_STATUSES = ["pass", "fail", "skip", "unavailable"] as const;

export const CERTIFIED_MODULE_IDS = [
  "enterprise-portfolio-framework",
  "multi-company-registry",
  "portfolio-performance-engine",
  "cross-business-knowledge-engine",
  "capital-distribution-engine",
  "executive-portfolio-dashboard",
  "portfolio-risk-engine",
  "portfolio-balance-engine",
  "business-health-ranking",
] as const;
