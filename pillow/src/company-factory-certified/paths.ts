/** PILLOW-CFC-001 — Company Factory Certified paths (X1-15). */

export const COMPANY_FACTORY_CERTIFIED_SYSTEM_PATH =
  "docs/governance/EMPIREAI_COMPANY_FACTORY_CERTIFIED_SYSTEM.md";

export const CFC_METADATA_VERSION = "CFC-001-v1" as const;

export const COMPANY_FACTORY_CERTIFIED_ID = "company-factory-certified" as const;

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

export const CFC_CAPABILITIES = [
  "company_factory_validation",
  "opportunity_discovery_validation",
  "market_validation_certification",
  "business_model_validation",
  "brand_validation",
  "store_validation",
  "product_portfolio_validation",
  "launch_validation",
  "end_to_end_company_creation_validation",
  "certification_reporting",
  "certification_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const MODULE_PASS_STATUSES = ["pass", "fail", "skip", "unavailable"] as const;

export const CERTIFIED_MODULE_IDS = [
  "company-factory-framework",
  "business-opportunity-discovery",
  "market-validation-engine",
  "business-model-generator",
  "brand-creation-engine",
  "domain-digital-asset-planner",
  "store-generation-engine",
  "product-portfolio-builder",
  "pricing-strategy-engine",
  "launch-readiness-validator",
  "business-launch-orchestrator",
  "growth-initialization-engine",
  "launch-monitoring-engine",
  "first-revenue-optimizer",
] as const;
