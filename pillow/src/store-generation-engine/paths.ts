/** PILLOW-SGE-001 — Store Generation Engine paths (X1-07). */

export const STORE_GENERATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_STORE_GENERATION_ENGINE_SYSTEM.md";

export const SGE_METADATA_VERSION = "SGE-001-v1" as const;

export const STORE_GENERATION_ENGINE_ID = "store-generation-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "generating",
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

export const SGE_CAPABILITIES = [
  "storefront_generation",
  "website_structure_creation",
  "navigation_structure_creation",
  "homepage_layout_creation",
  "product_catalogue_structure_creation",
  "category_structure_creation",
  "company_information_page_creation",
  "legal_page_template_preparation",
  "deployment_package_preparation",
  "storefront_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const STOREFRONT_STATUSES = [
  "draft",
  "structured",
  "catalogue_ready",
  "package_prepared",
  "ready",
  "blocked",
] as const;

export const DEPLOYMENT_READINESS = [
  "not_ready",
  "partial",
  "ready_for_validation",
  "blocked",
] as const;
