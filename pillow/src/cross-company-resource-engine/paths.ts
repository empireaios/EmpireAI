/** PILLOW-CCRE-001 — Cross-Company Resource Engine paths (X2-11). */

export const CROSS_COMPANY_RESOURCE_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CROSS_COMPANY_RESOURCE_ENGINE_SYSTEM.md";

export const CCRE_METADATA_VERSION = "CCRE-001-v1" as const;

export const CROSS_COMPANY_RESOURCE_ENGINE_ID = "cross-company-resource-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "registering",
  "allocating",
  "optimizing",
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

export const RESOURCE_CATEGORIES = [
  "asset",
  "ai_capability",
  "operational_service",
  "infrastructure",
] as const;

export const ALLOCATION_STATUSES = [
  "available",
  "allocated",
  "shared",
  "idle",
  "conflict",
  "reserved",
] as const;

export const CCRE_CAPABILITIES = [
  "enterprise_resource_registration",
  "shared_asset_management",
  "shared_ai_capability_management",
  "shared_operational_service_management",
  "shared_infrastructure_management",
  "cross_company_resource_allocation",
  "idle_resource_detection",
  "resource_conflict_detection",
  "resource_optimization_recommendations",
  "resource_validation",
  "resource_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
