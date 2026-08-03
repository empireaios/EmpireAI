/** PILLOW-LRV-001 — Launch Readiness Validator paths (X1-10). */

export const LAUNCH_READINESS_VALIDATOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_LAUNCH_READINESS_VALIDATOR_SYSTEM.md";

export const LRV_METADATA_VERSION = "LRV-001-v1" as const;

export const LAUNCH_READINESS_VALIDATOR_ID = "launch-readiness-validator" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "validating",
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

export const LRV_CAPABILITIES = [
  "launch_readiness_validation",
  "business_configuration_validation",
  "brand_readiness_validation",
  "digital_asset_readiness_validation",
  "storefront_readiness_validation",
  "product_portfolio_readiness_validation",
  "pricing_readiness_validation",
  "launch_blocker_detection",
  "launch_readiness_scoring",
  "launch_recommendation_generation",
  "launch_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
