/** PILLOW-PTC-001 — Portfolio Certified paths (X2-21). */

export const PORTFOLIO_CERTIFIED_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PORTFOLIO_CERTIFIED_SYSTEM.md";

export const SYSTEM_PATH = PORTFOLIO_CERTIFIED_SYSTEM_PATH;

export const PTC_METADATA_VERSION = "PTC-001-v1" as const;

export const PORTFOLIO_CERTIFIED_ID = "portfolio-certified" as const;

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

export const PTC_CAPABILITIES = [
  "portfolio_framework_validation",
  "company_registry_validation",
  "portfolio_analytics_validation",
  "knowledge_sharing_validation",
  "capital_distribution_validation",
  "executive_governance_validation",
  "portfolio_risk_validation",
  "portfolio_balance_validation",
  "business_health_validation",
  "portfolio_intelligence_certified_validation",
  "resource_sharing_validation",
  "customer_intelligence_validation",
  "supplier_intelligence_validation",
  "forecast_validation",
  "acquisition_validation",
  "portfolio_optimization_validation",
  "lifecycle_validation",
  "expansion_validation",
  "enterprise_valuation_validation",
  "autonomous_portfolio_board_validation",
  "cross_module_integration_validation",
  "end_to_end_enterprise_portfolio_validation",
  "certification_reporting",
  "certification_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const MODULE_PASS_STATUSES = ["pass", "fail", "skip", "unavailable"] as const;

/** X2-01 through X2-20 programme modules. */
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
  "portfolio-intelligence-certified",
  "cross-company-resource-engine",
  "shared-customer-intelligence",
  "shared-supplier-intelligence",
  "portfolio-forecast-engine",
  "acquisition-evaluation-engine",
  "portfolio-optimization-engine",
  "company-lifecycle-manager",
  "portfolio-expansion-planner",
  "enterprise-value-engine",
  "autonomous-portfolio-board",
] as const;

export const MODULE_MISSIONS: Record<(typeof CERTIFIED_MODULE_IDS)[number], string> = {
  "enterprise-portfolio-framework": "X2-01",
  "multi-company-registry": "X2-02",
  "portfolio-performance-engine": "X2-03",
  "cross-business-knowledge-engine": "X2-04",
  "capital-distribution-engine": "X2-05",
  "executive-portfolio-dashboard": "X2-06",
  "portfolio-risk-engine": "X2-07",
  "portfolio-balance-engine": "X2-08",
  "business-health-ranking": "X2-09",
  "portfolio-intelligence-certified": "X2-10",
  "cross-company-resource-engine": "X2-11",
  "shared-customer-intelligence": "X2-12",
  "shared-supplier-intelligence": "X2-13",
  "portfolio-forecast-engine": "X2-14",
  "acquisition-evaluation-engine": "X2-15",
  "portfolio-optimization-engine": "X2-16",
  "company-lifecycle-manager": "X2-17",
  "portfolio-expansion-planner": "X2-18",
  "enterprise-value-engine": "X2-19",
  "autonomous-portfolio-board": "X2-20",
};
