/** PILLOW-CBK-001 — Cross-Business Knowledge Engine paths (X2-04). */

export const CROSS_BUSINESS_KNOWLEDGE_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CROSS_BUSINESS_KNOWLEDGE_ENGINE_SYSTEM.md";

export const CBK_METADATA_VERSION = "CBK-001-v1" as const;

export const CROSS_BUSINESS_KNOWLEDGE_ENGINE_ID = "cross-business-knowledge-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "collecting",
  "classifying",
  "sharing",
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

export const KNOWLEDGE_CATEGORIES = [
  "operational_practice",
  "successful_practice",
  "failed_practice",
  "process_improvement",
  "customer_insight",
  "growth_tactic",
  "general",
] as const;

export const DISTRIBUTION_STATUSES = [
  "local",
  "pending_share",
  "shared",
  "restricted",
  "archived",
] as const;

export const CBK_CAPABILITIES = [
  "operational_knowledge_collection",
  "successful_practice_collection",
  "failed_practice_collection",
  "reusable_knowledge_identification",
  "cross_company_knowledge_sharing",
  "duplicate_learning_detection",
  "enterprise_knowledge_assets",
  "knowledge_usefulness_ranking",
  "knowledge_recommendations",
  "knowledge_validation",
  "knowledge_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
