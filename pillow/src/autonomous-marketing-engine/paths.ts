/** PILLOW-AME-001 — Autonomous Marketing Engine paths (R5-19). */

export const AUTONOMOUS_MARKETING_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AUTONOMOUS_MARKETING_ENGINE_SYSTEM.md";

export const AME_METADATA_VERSION = "AME-001-v1" as const;

export const AUTONOMOUS_MARKETING_ENGINE_ID = "autonomous-marketing-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
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

export const OPTIMIZATION_CATEGORIES = [
  "budget",
  "audience",
  "scheduling",
  "creative",
  "channel_allocation",
  "performance_response",
  "general",
] as const;

export const EXECUTION_STATUSES = [
  "pending",
  "recommended",
  "approved",
  "executed_structural",
  "blocked",
  "failed",
] as const;

export const AME_CAPABILITIES = [
  "campaign_performance_monitoring",
  "optimization_recommendation",
  "budget_optimization",
  "audience_optimization",
  "scheduling_optimization",
  "creative_optimization",
  "channel_allocation_optimization",
  "performance_change_response",
  "approved_workflow_execution",
  "autonomous_marketing_validation",
  "autonomous_marketing_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
