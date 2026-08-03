/** PILLOW-WQS-001 — Worker Quality Standard (Q0-27). */
export const WORKER_QUALITY_STANDARD_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKER_QUALITY_STANDARD_SYSTEM.md" as const;
export const WORKER_QUALITY_STANDARD_ID = "worker-quality-standard" as const;
export const WQS_METADATA_VERSION = "WQS-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "validating",
  "scoring",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Mandatory quality standards (Q0-27).
 * Architecture allows additional standards via configuration without redesign.
 */
export const QUALITY_STANDARDS = [
  "structured_reasoning",
  "self_validation",
  "confidence_scoring",
  "evidence_tracking",
  "assumption_recording",
  "limitation_reporting",
  "traceability",
  "governance_compliance",
  "standard_reporting",
] as const;

export const QUALITY_DECISIONS = [
  "compliant",
  "partially_compliant",
  "non_compliant",
] as const;

export const WQS_CAPABILITIES = [
  "require_structured_reasoning",
  "require_confidence_scoring",
  "require_supporting_evidence",
  "detect_uncertainty",
  "identify_assumptions",
  "identify_limitations",
  "validate_worker_output",
  "produce_completion_reports",
  "enforce_governance_compliance",
  "produce_quality_records",
  "machine_readable_quality_output",
  "extensible_quality_standards",
  "preserve_auditability",
  "preserve_traceability",
  "worker_quality_standard_validation",
  "health_monitoring",
  "recovery_management",
] as const;
