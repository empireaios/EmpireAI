/** PILLOW-BNI-001 — Bottleneck Intelligence paths (X3-10). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_BOTTLENECK_INTELLIGENCE_SYSTEM.md" as const;
export const BOTTLENECK_INTELLIGENCE_SYSTEM_PATH = SYSTEM_PATH;

export const BNI_METADATA_VERSION = "BNI-001-v1" as const;
export const BOTTLENECK_INTELLIGENCE_ID = "bottleneck-intelligence" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "analyzing",
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

export const BOTTLENECK_CATEGORIES = [
  "operational",
  "infrastructure",
  "supplier",
  "marketing",
  "financial",
  "workforce",
  "throughput",
] as const;

export const BNI_CAPABILITIES = [
  "operational_bottleneck_monitoring",
  "infrastructure_bottleneck_monitoring",
  "supplier_bottleneck_monitoring",
  "marketing_bottleneck_monitoring",
  "financial_bottleneck_monitoring",
  "workforce_bottleneck_monitoring",
  "throughput_constraint_detection",
  "bottleneck_impact_ranking",
  "bottleneck_resolution_recommendations",
  "bottleneck_records",
  "bottleneck_validation",
  "bottleneck_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
