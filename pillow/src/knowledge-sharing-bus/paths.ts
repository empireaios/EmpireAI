/** PILLOW-KSB-001 — Knowledge Sharing Bus (Q0-23). */
export const KNOWLEDGE_SHARING_BUS_SYSTEM_PATH =
  "docs/governance/EMPIREAI_KNOWLEDGE_SHARING_BUS_SYSTEM.md" as const;
export const KNOWLEDGE_SHARING_BUS_ID = "knowledge-sharing-bus" as const;
export const KSB_METADATA_VERSION = "KSB-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "classifying",
  "publishing",
  "sharing",
  "archiving",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default knowledge categories (Q0-23).
 * Architecture allows additional categories via configuration without redesign.
 */
export const KNOWLEDGE_CATEGORIES = [
  "lessons_learned",
  "best_practice",
  "business_knowledge",
  "operational_knowledge",
  "technical_knowledge",
  "market_intelligence",
  "customer_intelligence",
  "financial_knowledge",
  "executive_knowledge",
  "recovery_knowledge",
] as const;

export const PUBLICATION_STATUSES = [
  "draft",
  "validated",
  "published",
  "subscribed",
  "archived",
] as const;

export const KSB_CAPABILITIES = [
  "receive_knowledge_submissions",
  "validate_knowledge_records",
  "classify_knowledge",
  "categorize_knowledge",
  "version_knowledge",
  "publish_knowledge_to_workforce",
  "support_knowledge_subscriptions",
  "track_knowledge_usage",
  "archive_obsolete_knowledge",
  "produce_knowledge_records",
  "machine_readable_knowledge_output",
  "extensible_knowledge_categories",
  "preserve_auditability",
  "preserve_traceability",
  "knowledge_sharing_bus_validation",
  "health_monitoring",
  "recovery_management",
] as const;
