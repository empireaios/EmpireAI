/** PILLOW-DAP-001 — Domain & Digital Asset Planner paths (X1-06). */

export const DOMAIN_DIGITAL_ASSET_PLANNER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_DOMAIN_DIGITAL_ASSET_PLANNER_SYSTEM.md";

export const DAP_METADATA_VERSION = "DAP-001-v1" as const;

export const DOMAIN_DIGITAL_ASSET_PLANNER_ID = "domain-digital-asset-planner" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "planning",
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

export const DAP_CAPABILITIES = [
  "digital_asset_planning",
  "company_domain_planning",
  "domain_alternative_planning",
  "social_media_handle_planning",
  "email_domain_planning",
  "brand_asset_structure_planning",
  "website_architecture_planning",
  "digital_identity_consistency_planning",
  "naming_conflict_detection",
  "digital_asset_recommendation",
  "digital_asset_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
