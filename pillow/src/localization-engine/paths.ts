/** PILLOW-LOC-001 — Localization Engine paths (X4-03). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_LOCALIZATION_ENGINE_SYSTEM.md" as const;
export const LOCALIZATION_ENGINE_SYSTEM_PATH = SYSTEM_PATH;

export const LOC_METADATA_VERSION = "LOC-001-v1" as const;
export const LOCALIZATION_ENGINE_ID = "localization-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "localizing",
  "adapting",
  "detecting",
  "recommending",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const OPERATIONAL_STATES = [
  "disconnected",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const LOCALIZATION_CATEGORIES = [
  "product",
  "service",
  "storefront",
  "branding",
  "marketing",
  "customer_experience",
] as const;

export const LOC_CAPABILITIES = [
  "product_localization",
  "service_localization",
  "storefront_localization",
  "brand_localization",
  "marketing_content_localization",
  "customer_experience_localization",
  "regional_localization_rules",
  "localization_gap_detection",
  "localization_recommendations",
  "localization_records",
  "localization_validation",
  "localization_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
