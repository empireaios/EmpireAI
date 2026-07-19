/** PILLOW-CIE-001 — Customer Identity Engine paths (R4-01). */

export const CUSTOMER_IDENTITY_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CUSTOMER_IDENTITY_ENGINE_SYSTEM.md";

export const CIE_METADATA_VERSION = "CIE-001-v1" as const;

export const CUSTOMER_IDENTITY_ENGINE_ID = "customer-identity-engine" as const;

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

export const IDENTITY_STATUSES = [
  "active",
  "linked",
  "merged",
  "duplicate",
  "inactive",
  "pending",
] as const;

export const IDENTIFIER_TYPES = [
  "email",
  "phone",
  "marketplace",
  "communication",
  "external",
] as const;

export const CIE_CAPABILITIES = [
  "customer_identity_creation",
  "unified_profile_management",
  "cross_channel_linking",
  "duplicate_detection",
  "identity_merging",
  "identifier_maintenance",
  "identity_validation",
  "identity_resolution",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
