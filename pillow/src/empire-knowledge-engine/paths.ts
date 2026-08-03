/** PILLOW-ENK-001 — Empire Knowledge Engine paths (X5-02). */
export const EMPIRE_KNOWLEDGE_ENGINE_SYSTEM_PATH = "docs/governance/EMPIREAI_EMPIRE_KNOWLEDGE_ENGINE_SYSTEM.md" as const;
export const EMPIRE_KNOWLEDGE_ENGINE_ID = "empire-knowledge-engine" as const;
export const EKE_METADATA_VERSION = "ENK-001-v1" as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "capturing", "sharing", "mapping", "analyzing", "recommending", "failed"] as const;
export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const KNOWLEDGE_CATEGORIES = ["business_strategy", "operational_pattern", "customer_insight", "supplier_intelligence", "product_learning", "business_activity"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const EKE_CAPABILITIES = [
  "cross_enterprise_knowledge_graph", "enterprise_knowledge_capture", "validated_knowledge_sharing",
  "knowledge_relationship_mapping", "reusable_business_knowledge_detection", "duplicated_knowledge_detection",
  "knowledge_gap_detection", "enterprise_knowledge_recommendations", "knowledge_metadata_generation",
  "knowledge_validation", "health_monitoring", "recovery",
] as const;
