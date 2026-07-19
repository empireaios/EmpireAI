/** PILLOW-CRM-001 — CRM Foundation paths (R4-02). */

export const CRM_FOUNDATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CRM_FOUNDATION_SYSTEM.md";

export const CRM_METADATA_VERSION = "CRM-001-v1" as const;

export const CRM_FOUNDATION_ID = "crm-foundation" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "processing",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const ENGINE_STATES = [
  "registered",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const LIFECYCLE_STATUSES = [
  "prospect",
  "active",
  "inactive",
  "churned",
  "suspended",
] as const;

export const CRM_CAPABILITIES = [
  "customer_profile_management",
  "customer_account_management",
  "contact_information_management",
  "customer_ownership_management",
  "lifecycle_status_management",
  "customer_tagging",
  "customer_notes",
  "custom_attributes",
  "customer_search",
  "crm_validation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
