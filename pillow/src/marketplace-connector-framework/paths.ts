/** PILLOW-MCF-001 — Marketplace Connector Framework paths (R1-01). */

export const MARKETPLACE_CONNECTOR_FRAMEWORK_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MARKETPLACE_CONNECTOR_FRAMEWORK_SYSTEM.md";

export const CONNECTOR_METADATA_VERSION = "MCF-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "registering",
  "active",
  "suspended",
  "shutting_down",
  "stopped",
  "failed",
] as const;

export const CONNECTOR_STATES = [
  "registered",
  "initialized",
  "active",
  "suspended",
  "shutdown",
  "failed",
] as const;

export const CONNECTOR_TYPES = ["marketplace", "supplier", "template"] as const;

export const AUTHENTICATION_METHODS = [
  "oauth2",
  "api_key",
  "hmac",
  "webhook_secret",
  "bearer",
  "none",
] as const;

export const FRAMEWORK_CAPABILITIES = [
  "connector_registration",
  "connector_initialization",
  "connector_activation",
  "connector_suspension",
  "connector_shutdown",
  "api_request_routing",
  "authentication_handling",
  "webhook_handling",
  "error_normalization",
  "response_normalization",
  "health_monitoring",
  "recovery_handling",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
