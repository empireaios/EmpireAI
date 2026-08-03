/** PILLOW-LI-001 — Language Intelligence paths (X4-04). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_LANGUAGE_INTELLIGENCE_SYSTEM.md" as const;
export const LANGUAGE_INTELLIGENCE_SYSTEM_PATH = SYSTEM_PATH;

export const LI_METADATA_VERSION = "LI-001-v1" as const;
export const LANGUAGE_INTELLIGENCE_ID = "language-intelligence" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "detecting",
  "translating",
  "validating",
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

export const TRANSLATION_CATEGORIES = [
  "customer_facing",
  "operational",
  "ai_workforce",
  "terminology",
] as const;

export const SUPPORTED_LANGUAGE_STATUSES = [
  "supported",
  "partial",
  "unsupported",
  "recommended",
] as const;

export const LI_CAPABILITIES = [
  "language_preference_detection",
  "supported_language_management",
  "customer_facing_translation",
  "operational_content_translation",
  "ai_workforce_translation",
  "terminology_consistency",
  "translation_quality_detection",
  "unsupported_language_detection",
  "language_recommendations",
  "language_intelligence_records",
  "language_validation",
  "language_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const DEFAULT_SUPPORTED_LANGUAGES = [
  "en",
  "es",
  "fr",
  "de",
  "pt",
  "ja",
  "ko",
  "zh",
  "ar",
  "hi",
] as const;
