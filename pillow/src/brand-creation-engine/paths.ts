/** PILLOW-BCE-001 — Brand Creation Engine paths (X1-05). */

export const BRAND_CREATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BRAND_CREATION_ENGINE_SYSTEM.md";

export const BCE_METADATA_VERSION = "BCE-001-v1" as const;

export const BRAND_CREATION_ENGINE_ID = "brand-creation-engine" as const;

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

export const BCE_CAPABILITIES = [
  "brand_creation",
  "company_name_generation",
  "brand_identity_generation",
  "brand_positioning_generation",
  "brand_messaging_generation",
  "brand_values_generation",
  "brand_voice_generation",
  "brand_colour_recommendation",
  "brand_typography_recommendation",
  "brand_guideline_generation",
  "brand_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
