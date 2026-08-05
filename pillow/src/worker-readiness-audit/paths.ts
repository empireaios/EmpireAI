/** PILLOW-WRART-001 — Worker Readiness Audit (Q11-02). Second Q11 acceptance gate. */
export const WORKER_READINESS_AUDIT_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKER_READINESS_AUDIT_SYSTEM.md" as const;
export const WORKER_READINESS_AUDIT_ID = "worker-readiness-audit" as const;
export const WRART_METADATA_VERSION = "WRART-001-v1" as const;
export const WORKER_READINESS_AUDIT_REPORT_VERSION = "WRART-RPT-v1" as const;
export const WRART_MISSION_ID = "Q11-02" as const;
export const WORKER_READINESS_AUDIT_RUNTIME_VERSION = "Q11-WRART-v1" as const;

export const WORKER_READINESS_AUDIT_IDENTITY = {
  workerId: "wkr-worker-readiness-audit-01",
  workerName: "Worker Readiness Audit",
  workerType: "auditor",
  department: "worker_readiness_audit",
  factory: "pillow-worker-readiness-audit",
  role: "role-auditor-worker-readiness-audit",
  reportingLine: ["wkr-worker-readiness-audit-01", "pillow"] as string[],
  skillProfile: [
    "skill-worker-discovery",
    "skill-worker-registration-verification",
    "skill-worker-reachability-verification",
    "skill-worker-configuration-verification",
    "skill-worker-governance-verification",
    "skill-worker-permission-verification",
    "skill-worker-runtime-connectivity-verification",
    "skill-worker-operational-capability-verification",
    "skill-worker-readiness-classification",
    "skill-worker-readiness-reporting",
  ],
  approvedTools: ["repository_evidence_scanner", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "discovering_workers",
  "verifying_registration",
  "verifying_reachability",
  "verifying_configuration",
  "verifying_governance",
  "verifying_permissions",
  "verifying_runtime_connectivity",
  "verifying_operational_capability",
  "classifying_readiness",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Per-dimension structural check outcome — derived strictly from observed evidence. */
export const CHECK_STATUSES = ["Passed", "Partial", "Failed", "Missing"] as const;

/** Per-worker readiness classification. */
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
  "readiness_assessed",
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

/** Worker Registry WORKER_STATES catalog — duplicated read-only for reachability evidence. */
export const REACHABLE_WORKER_STATES = ["active", "busy", "idle"] as const;
export const PENDING_WORKER_STATES = ["registered"] as const;
export const UNREACHABLE_WORKER_STATES = ["suspended", "retired", "disabled", "offline"] as const;

/** Worker Registry CERTIFICATION_STATUSES catalog — duplicated read-only for governance evidence. */
export const GOVERNED_CERTIFICATION_STATUS = "certified" as const;
export const PARTIAL_CERTIFICATION_STATUS = "pending" as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "production_certification_core",
  "shared_runtime_core",
  "pillow_orchestration_runtime",
  "monitoring_runtime",
  "audit_runtime",
  "executive_reporting_runtime",
  "worker_lifecycle",
] as const;

export const WRART_CAPABILITIES = [
  "discover_registered_workers",
  "verify_worker_registration",
  "verify_worker_reachability",
  "verify_worker_configuration",
  "verify_worker_governance",
  "verify_worker_permissions",
  "verify_worker_runtime_connectivity",
  "verify_worker_operational_capability",
  "classify_worker_readiness",
  "produce_worker_readiness_audit_reports",
  "submit_reports_through_executive_reporting_runtime",
  "expose_q1103_consumable_contract",
  "consume_q1102_consumable_contract",
  "preserve_complete_traceability",
  "preserve_immutable_audit_history",
  "preserve_audit_history",
  "never_fabricate_audit_evidence",
  "never_certify_missing_workers",
  "never_certify_unreachable_workers",
  "never_assume_implementation",
  "never_modify_worker_implementations",
  "never_repair_failed_workers",
  "never_bypass_pillow_governance",
  "never_bypass_grand_king_approval",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_implement_q1103_or_later",
  "integrate_worker_registry",
  "integrate_production_certification_core",
  "integrate_shared_runtime_core",
  "integrate_pillow_orchestration_runtime",
  "integrate_monitoring_runtime",
  "integrate_audit_runtime",
  "integrate_executive_reporting_runtime",
  "integrate_worker_lifecycle",
  "deterministic_audit_behaviour",
  "structural_signal_only",
  "evidence_based_only",
  "health_monitoring",
  "recovery_management",
  "second_q11_gate",
] as const;
