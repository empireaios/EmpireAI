/** PILLOW-RECART-001 — Recovery Audit (Q11-07). Seventh Q11 acceptance gate. */
export const RECOVERY_AUDIT_SYSTEM_PATH =
  "docs/governance/EMPIREAI_RECOVERY_AUDIT_SYSTEM.md" as const;
export const RECOVERY_AUDIT_ID = "recovery-audit" as const;
export const RECART_METADATA_VERSION = "RECART-001-v1" as const;
export const RECOVERY_AUDIT_REPORT_VERSION = "RECART-RPT-v1" as const;
export const RECART_MISSION_ID = "Q11-07" as const;
export const RECOVERY_AUDIT_RUNTIME_VERSION = "Q11-RECART-v1" as const;

export const RECOVERY_AUDIT_IDENTITY = {
  workerId: "wkr-recovery-audit-01",
  workerName: "Recovery Audit",
  workerType: "auditor",
  department: "recovery_audit",
  factory: "recovery-audit",
  role: "role-auditor-recovery-audit",
  reportingLine: ["wkr-recovery-audit-01", "pillow"] as string[],
  skillProfile: [
    "skill-recovery-component-discovery",
    "skill-failure-detection-verification",
    "skill-automatic-recovery-verification",
    "skill-manual-recovery-verification",
    "skill-rollback-capability-verification",
    "skill-workflow-restart-verification",
    "skill-checkpoint-restoration-verification",
    "skill-recovery-escalation-verification",
    "skill-enterprise-resilience-verification",
    "skill-recovery-readiness-classification",
    "skill-recovery-audit-reporting",
  ],
  approvedTools: ["repository_evidence_scanner", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "discovering_recovery_components",
  "verifying_failure_detection",
  "verifying_automatic_recovery",
  "verifying_manual_recovery",
  "verifying_rollback_capability",
  "verifying_workflow_restart",
  "verifying_checkpoint_restoration",
  "verifying_recovery_escalation",
  "verifying_enterprise_resilience",
  "classifying_recovery_readiness",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Per-check structural outcome — derived strictly from capability-presence evidence. */
export const CHECK_STATUSES = ["Passed", "Partial", "Failed", "Missing"] as const;

/** Per-component recovery readiness classification. */
export const READINESS_CLASSIFICATIONS = [
  "certified",
  "partially_certified",
  "failed",
  "missing",
  "blocked",
  "deferred",
] as const;

/** Overall audit decision. */
export const READINESS_DECISIONS = ["certify", "withhold", "escalate", "defer"] as const;

export const AUDIT_STATUSES = [
  "draft",
  "recovery_components_discovered",
  "evidence_collected",
  "recovery_readiness_assessed",
  "certified",
  "partially_certified",
  "failed",
  "missing",
  "blocked",
  "deferred",
  "submitted",
  "rejected",
  "unknown",
] as const;

/**
 * Evidence-backed recovery component catalog. Discovery walks this fixed,
 * read-only key list and checks binding presence on injected dependencies
 * only — targets are never invented beyond this catalog.
 */
export const RECOVERY_COMPONENT_KEYS = [
  "recovery-runtime",
  "monitoring-runtime",
  "queue-runtime",
  "mission-runtime",
  "audit-runtime",
  "executive-reporting-runtime",
  "production-certification-core",
  "pillow-orchestration-runtime",
  "worker-registry",
  "shared-runtime-core",
] as const;

export const OPTIONAL_RECOVERY_COMPONENT_KEYS = [
  "worker-recovery-system",
  "recovery-manager",
  "rollback-manager",
] as const;

export const ALL_RECOVERY_COMPONENT_KEYS = [
  ...RECOVERY_COMPONENT_KEYS,
  ...OPTIONAL_RECOVERY_COMPONENT_KEYS,
] as const;

export const RECOVERY_COMPONENT_LABELS: Record<(typeof ALL_RECOVERY_COMPONENT_KEYS)[number], string> = {
  "recovery-runtime": "Recovery Runtime",
  "monitoring-runtime": "Monitoring Runtime",
  "queue-runtime": "Queue Runtime",
  "mission-runtime": "Mission Runtime",
  "audit-runtime": "Audit Runtime",
  "executive-reporting-runtime": "Executive Reporting Runtime",
  "production-certification-core": "Production Certification Core",
  "pillow-orchestration-runtime": "Pillow Orchestration Runtime",
  "worker-registry": "Worker Registry",
  "shared-runtime-core": "Shared Runtime Core",
  "worker-recovery-system": "Worker Recovery System",
  "recovery-manager": "Recovery Manager",
  "rollback-manager": "Rollback Manager",
};

export const RECOVERY_COMPONENT_TYPES: Record<(typeof ALL_RECOVERY_COMPONENT_KEYS)[number], string> = {
  "recovery-runtime": "primary_recovery_capability",
  "monitoring-runtime": "failure_detection_signal",
  "queue-runtime": "queue_recovery_integration",
  "mission-runtime": "mission_checkpoint_recovery",
  "audit-runtime": "recovery_audit_trail",
  "executive-reporting-runtime": "recovery_reporting",
  "production-certification-core": "certification_signal",
  "pillow-orchestration-runtime": "workflow_resume_structural",
  "worker-registry": "worker_recovery_inventory",
  "shared-runtime-core": "runtime_resilience_signal",
  "worker-recovery-system": "worker_recovery_system",
  "recovery-manager": "recovery_manager",
  "rollback-manager": "rollback_manager",
};

/** Safe structural probe methods — presence-checked via typeof only; NEVER invoked if mutating. */
export const RECOVERY_COMPONENT_PROBES: Record<(typeof ALL_RECOVERY_COMPONENT_KEYS)[number], string[]> = {
  "recovery-runtime": ["detectFailure", "restoreState", "restartJob", "resumeWorkflow", "rollback", "getState"],
  "monitoring-runtime": ["getDashboard", "getState"],
  "queue-runtime": ["getState"],
  "mission-runtime": ["getState", "resume", "recover", "getCheckpoints"],
  "audit-runtime": ["query", "getState"],
  "executive-reporting-runtime": ["getState", "submitWorkerReport"],
  "production-certification-core": ["getCertificationResults", "getState"],
  "pillow-orchestration-runtime": ["getState", "invokeWorkflow"],
  "worker-registry": ["listWorkers", "getState"],
  "shared-runtime-core": ["getCatalog", "getState"],
  "worker-recovery-system": ["getState", "recoverWorker"],
  "recovery-manager": ["getState", "manageRecovery"],
  "rollback-manager": ["getState", "rollback"],
};

export const REQUIRED_RECOVERY_COMPONENT_KEYS = [
  "recovery-runtime",
  "monitoring-runtime",
  "worker-registry",
] as const;

export const INTEGRATION_TARGETS = [
  "performance_audit",
  "production_certification_core",
  "recovery_runtime",
  "monitoring_runtime",
  "queue_runtime",
  "mission_runtime",
  "audit_runtime",
  "executive_reporting_runtime",
  "shared_runtime_core",
  "worker_registry",
  "pillow_orchestration_runtime",
] as const;

export const RECART_CAPABILITIES = [
  "discover_recovery_components",
  "verify_failure_detection",
  "verify_automatic_recovery",
  "verify_manual_recovery",
  "verify_rollback_capability",
  "verify_workflow_restart",
  "verify_checkpoint_restoration",
  "verify_recovery_escalation",
  "verify_enterprise_resilience",
  "classify_recovery_readiness",
  "produce_recovery_audit_reports",
  "submit_reports_through_executive_reporting_runtime",
  "expose_q1108_consumable_contract",
  "consume_q1107_consumable_contract",
  "preserve_complete_traceability",
  "preserve_immutable_recovery_history",
  "preserve_audit_history",
  "never_fabricate_recovery_evidence",
  "never_certify_untested_recovery",
  "never_mutate_production_via_recovery_calls",
  "never_assume_implementation",
  "never_repair_failed_recovery_components",
  "never_bypass_pillow_governance",
  "never_bypass_grand_king_approval",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_implement_q1108_or_later",
  "integrate_performance_audit",
  "integrate_production_certification_core",
  "integrate_recovery_runtime",
  "integrate_monitoring_runtime",
  "integrate_queue_runtime",
  "integrate_mission_runtime",
  "integrate_audit_runtime",
  "integrate_executive_reporting_runtime",
  "integrate_shared_runtime_core",
  "integrate_worker_registry",
  "integrate_pillow_orchestration_runtime",
  "deterministic_audit_behaviour",
  "structural_signal_only",
  "evidence_based_only",
  "health_monitoring",
  "recovery_management",
  "seventh_q11_gate",
] as const;
