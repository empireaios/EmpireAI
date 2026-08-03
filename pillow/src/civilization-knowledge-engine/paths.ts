/** PILLOW-CKE-001 — Civilization Knowledge Engine (X5-16). */
export const CIVILIZATION_KNOWLEDGE_ENGINE_SYSTEM_PATH = "docs/governance/EMPIREAI_CIVILIZATION_KNOWLEDGE_ENGINE_SYSTEM.md" as const;
export const CIVILIZATION_KNOWLEDGE_ENGINE_ID = "civilization-knowledge-engine" as const;
export const CKE_METADATA_VERSION = "CKE-001-v1" as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "monitoring", "acquiring", "analyzing", "ranking", "recommending", "failed"] as const;
export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const IMPACT_LEVELS = ["limited", "material", "significant", "transformational"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const CKE_CAPABILITIES = [
  "industry_monitoring",
  "technology_monitoring",
  "scientific_development_monitoring",
  "economic_development_monitoring",
  "regulatory_development_monitoring",
  "business_innovation_monitoring",
  "emerging_strategic_knowledge_identification",
  "strategic_relevance_ranking",
  "strategic_knowledge_recommendations",
  "knowledge_metadata_generation",
  "knowledge_validation",
  "health_monitoring",
  "recovery_management",
] as const;
