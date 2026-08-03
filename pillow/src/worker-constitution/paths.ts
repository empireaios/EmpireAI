/** PILLOW-WCT-001 — Worker Constitution (Q1-01). */
export const WORKER_CONSTITUTION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKER_CONSTITUTION_SYSTEM.md" as const;
export const WORKER_CONSTITUTION_ID = "worker-constitution" as const;
export const WCT_METADATA_VERSION = "WCT-001-v1" as const;
export const CONSTITUTION_VERSION = "WCT-CONST-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "defining",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const WORKER_LIFECYCLE_STAGES = [
  "registered",
  "initialized",
  "active",
  "suspended",
  "retired",
] as const;

export const COMPLIANCE_DECISIONS = [
  "compliant",
  "partially_compliant",
  "non_compliant",
] as const;

/**
 * Mandatory constitutional rules (Q1-01).
 * Architecture allows additional rules via configuration without redesign.
 */
export const CONSTITUTIONAL_RULES = [
  "governed_by_pillow",
  "follow_executive_instructions",
  "never_bypass_pillow",
  "never_execute_outside_authority",
  "report_all_work",
  "preserve_audit_history",
  "preserve_traceability",
  "follow_worker_quality_standard",
  "follow_worker_self_critique_protocol",
  "participate_peer_review_when_required",
  "use_approved_tools_only",
  "escalate_beyond_authority",
  "remain_certifiable",
] as const;

export const WCT_CAPABILITIES = [
  "define_worker_identity",
  "define_worker_lifecycle",
  "define_worker_responsibilities",
  "define_worker_authority",
  "define_worker_limitations",
  "define_mandatory_communication_behaviour",
  "define_mandatory_reporting_behaviour",
  "define_mandatory_quality_requirements",
  "define_mandatory_governance_requirements",
  "define_mandatory_approval_behaviour",
  "define_mandatory_escalation_behaviour",
  "define_mandatory_auditability",
  "define_mandatory_traceability",
  "define_mandatory_pillow_compliance",
  "produce_machine_readable_constitution",
  "inherit_constitution_to_worker",
  "validate_constitutional_compliance",
  "extensible_constitutional_rules",
  "preserve_auditability",
  "preserve_traceability",
  "worker_constitution_validation",
  "health_monitoring",
  "recovery_management",
] as const;
