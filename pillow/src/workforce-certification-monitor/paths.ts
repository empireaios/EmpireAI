/** PILLOW-WCM-001 — Workforce Certification Monitor (Q0-29). */
export const WORKFORCE_CERTIFICATION_MONITOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKFORCE_CERTIFICATION_MONITOR_SYSTEM.md" as const;
export const WORKFORCE_CERTIFICATION_MONITOR_ID = "workforce-certification-monitor" as const;
export const WCM_METADATA_VERSION = "WCM-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "certifying",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Certification statuses (Q0-29).
 * Architecture allows additional states via configuration without redesign.
 */
export const CERTIFICATION_STATUSES = [
  "certified",
  "provisionally_certified",
  "suspended",
  "decertified",
  "pending_review",
  "offline",
] as const;

/**
 * Certification checks (Q0-29).
 * Architecture allows additional checks via configuration without redesign.
 */
export const CERTIFICATION_CHECKS = [
  "registration",
  "reachability",
  "capability",
  "approved_tool_access",
  "runtime_health",
  "governance_compliance",
  "quality_standard_compliance",
  "self_critique_compliance",
  "dependency_health",
  "executive_readiness",
] as const;

export const RECOMMENDED_ACTIONS = [
  "assign_production_work",
  "limit_to_provisional_work",
  "suspend_assignment",
  "recertify_worker",
  "review_governance",
  "restore_reachability",
  "await_review",
] as const;

export const WCM_CAPABILITIES = [
  "continuously_inspect_registered_workers",
  "verify_worker_availability",
  "verify_worker_reachability",
  "verify_capability_registration",
  "verify_required_tool_access",
  "verify_governance_compliance",
  "verify_worker_quality_standard_compliance",
  "verify_worker_self_critique_compliance",
  "verify_required_runtime_dependencies",
  "detect_certification_failures",
  "produce_certification_reports",
  "produce_certification_records",
  "machine_readable_certification_output",
  "support_decertification",
  "support_recertification",
  "extensible_certification_checks",
  "extensible_certification_statuses",
  "preserve_auditability",
  "preserve_traceability",
  "workforce_certification_monitor_validation",
  "health_monitoring",
  "recovery_management",
] as const;
