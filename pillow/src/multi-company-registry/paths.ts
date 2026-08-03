/** PILLOW-MCR-001 — Multi-Company Registry paths (X2-02). */

export const MULTI_COMPANY_REGISTRY_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MULTI_COMPANY_REGISTRY_SYSTEM.md";

export const MCR_METADATA_VERSION = "MCR-001-v1" as const;

export const MULTI_COMPANY_REGISTRY_ID = "multi-company-registry" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "registering",
  "updating",
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

export const COMPANY_CATEGORIES = [
  "commerce",
  "services",
  "digital",
  "marketplace",
  "holding",
  "experimental",
  "general",
] as const;

export const LIFECYCLE_STAGES = [
  "prospect",
  "forming",
  "launching",
  "operating",
  "scaling",
  "paused",
  "winding_down",
  "archived",
] as const;

export const COMPANY_OPERATIONAL_STATUSES = [
  "pending",
  "active",
  "inactive",
  "suspended",
  "failed",
] as const;

export const MCR_CAPABILITIES = [
  "company_registration",
  "company_profile_management",
  "company_identity_maintenance",
  "company_ownership_management",
  "company_lifecycle_tracking",
  "company_classification",
  "operational_status_tracking",
  "duplicate_detection",
  "registry_recommendations",
  "registry_validation",
  "registry_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
