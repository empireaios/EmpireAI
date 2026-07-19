/** PILLOW-CRA-001 — Creative Asset Manager paths (R5-11). */

export const CREATIVE_ASSET_MANAGER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CREATIVE_ASSET_MANAGER_SYSTEM.md";

export const CRA_METADATA_VERSION = "CRA-001-v1" as const;

export const CREATIVE_ASSET_MANAGER_ID = "creative-asset-manager" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "indexing",
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

export const ASSET_TYPES = [
  "image",
  "video",
  "document",
  "advertising_creative",
  "other",
] as const;

export const APPROVAL_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
] as const;

export const USAGE_STATUSES = [
  "unused",
  "in_use",
  "archived",
] as const;

export const CRA_CAPABILITIES = [
  "creative_asset_management",
  "image_management",
  "video_management",
  "document_management",
  "advertising_creative_management",
  "version_management",
  "approval_workflow",
  "tag_management",
  "usage_tracking",
  "asset_search",
  "asset_validation",
  "asset_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
