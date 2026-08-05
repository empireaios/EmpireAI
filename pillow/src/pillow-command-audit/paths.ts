/** PILLOW-PCART-001 — Pillow Command Audit (Q11-03). Third Q11 acceptance gate. */
export const PILLOW_COMMAND_AUDIT_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PILLOW_COMMAND_AUDIT_SYSTEM.md" as const;
export const PILLOW_COMMAND_AUDIT_ID = "pillow-command-audit" as const;
export const PCART_METADATA_VERSION = "PCART-001-v1" as const;
export const PILLOW_COMMAND_AUDIT_REPORT_VERSION = "PCART-RPT-v1" as const;
export const PCART_MISSION_ID = "Q11-03" as const;
export const PILLOW_COMMAND_AUDIT_RUNTIME_VERSION = "Q11-PCART-v1" as const;

export const PILLOW_COMMAND_AUDIT_IDENTITY = {
  workerId: "wkr-pillow-command-audit-01",
  workerName: "Pillow Command Audit",
  workerType: "auditor",
  department: "pillow_command_audit",
  factory: "pillow-command-audit",
  role: "role-auditor-pillow-command-audit",
  reportingLine: ["wkr-pillow-command-audit-01", "pillow"] as string[],
  skillProfile: [
    "skill-worker-discovery",
    "skill-worker-assignment-verification",
    "skill-command-dispatch-verification",
    "skill-worker-communication-verification",
    "skill-supervision-capability-verification",
    "skill-progress-tracking-verification",
    "skill-result-collection-verification",
    "skill-worker-governance-verification",
    "skill-command-readiness-classification",
    "skill-pillow-command-audit-reporting",
  ],
  approvedTools: ["repository_evidence_scanner", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "discovering_workers",
  "verifying_assignment",
  "verifying_command_dispatch",
  "verifying_communication",
  "verifying_supervision",
  "verifying_progress",
  "verifying_result_collection",
  "verifying_governance",
  "classifying_command_readiness",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Per-dimension structural check outcome — derived strictly from observed evidence. */
export const CHECK_STATUSES = ["Passed", "Partial", "Failed", "Missing"] as const;

/** Per-worker command readiness classification. */
export const READINESS_CLASSIFICATIONS = [
  "Ready",
  "Partially Ready",
  "Failed",
  "Missing",
  "Blocked",
  "Deferred",
] as const;

/** Overall audit decision. */
export const READINESS_DECISIONS = [
  "Ready",
  "Conditionally_Ready",
  "Not_Ready",
  "Failed",
  "Deferred",
] as const;

export const AUDIT_STATUSES = [
  "draft",
  "workers_discovered",
  "evidence_collected",
  "command_readiness_assessed",
  "ready",
  "conditionally_ready",
  "not_ready",
  "failed",
  "deferred",
  "submitted",
  "rejected",
  "unknown",
] as const;

/** Shared Runtime Core FACTORY_KEYS catalog — duplicated read-only for discovery evidence. */
export const FACTORY_KEYS = [
  "workforce-os",
  "workforce",
  "empire-builder-factory",
  "commerce-factory",
  "media-factory",
  "digital-products-factory",
  "enterprise-platform-factory",
  "local-business-factory",
  "affiliate-factory",
  "capital-factory",
] as const;

/** Worker Registry CERTIFICATION_STATUSES catalog — duplicated read-only for governance evidence. */
export const GOVERNED_CERTIFICATION_STATUS = "certified" as const;
export const PARTIAL_CERTIFICATION_STATUS = "pending" as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_readiness_audit",
  "production_certification_core",
  "pillow_orchestration_runtime",
  "communication_runtime",
  "mission_runtime",
  "monitoring_runtime",
  "audit_runtime",
  "executive_reporting_runtime",
] as const;

export const PCART_CAPABILITIES = [
  "discover_registered_workers",
  "verify_worker_assignment",
  "verify_command_dispatch",
  "verify_worker_communication",
  "verify_supervision_capability",
  "verify_progress_tracking",
  "verify_result_collection",
  "verify_worker_governance",
  "classify_command_readiness",
  "produce_pillow_command_audit_reports",
  "submit_reports_through_executive_reporting_runtime",
  "expose_q1104_consumable_contract",
  "consume_q1103_consumable_contract",
  "preserve_complete_traceability",
  "preserve_immutable_audit_history",
  "preserve_audit_history",
  "never_fabricate_audit_evidence",
  "never_certify_unverified_command_capability",
  "never_assume_implementation",
  "never_modify_worker_implementations",
  "never_repair_failed_workers",
  "never_bypass_pillow_governance",
  "never_bypass_grand_king_approval",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_implement_q1104_or_later",
  "integrate_worker_registry",
  "integrate_worker_readiness_audit",
  "integrate_production_certification_core",
  "integrate_pillow_orchestration_runtime",
  "integrate_communication_runtime",
  "integrate_mission_runtime",
  "integrate_monitoring_runtime",
  "integrate_audit_runtime",
  "integrate_executive_reporting_runtime",
  "deterministic_audit_behaviour",
  "structural_signal_only",
  "evidence_based_only",
  "health_monitoring",
  "recovery_management",
  "third_q11_gate",
] as const;
