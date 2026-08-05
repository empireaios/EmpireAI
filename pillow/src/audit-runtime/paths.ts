/** PILLOW-AUDRT-001 — Audit Runtime (Q10-13). */
export const AUDIT_RUNTIME_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AUDIT_RUNTIME_SYSTEM.md" as const;
export const AUDIT_RUNTIME_ID = "audit-runtime" as const;
export const AUDRT_METADATA_VERSION = "AUDRT-001-v1" as const;
export const AUDRT_REPORT_VERSION = "AUDRT-RPT-v1" as const;
export const AUDRT_RUNTIME_VERSION = "Q10-AUDRT-v1" as const;
export const AUDRT_MISSION_ID = "Q10-13" as const;

/** Fixed seed clock for deterministic seed record timestamps. */
export const AUDRT_SEED_CLOCK_UTC = "2026-08-01T00:00:00.000Z" as const;

export const AUDIT_RUNTIME_IDENTITY = {
  workerId: "wkr-audit-runtime-01",
  workerName: "Audit Runtime",
  workerType: "coordinator",
  department: "runtime",
  factory: "pillow-audit",
  role: "role-coordinator-audit-runtime",
  reportingLine: ["wkr-audit-runtime-01", "pillow"] as string[],
  skillProfile: [
    "skill-audit-event-recording",
    "skill-worker-action-recording",
    "skill-mission-lifecycle-recording",
    "skill-approval-recording",
    "skill-recovery-recording",
    "skill-scheduling-recording",
    "skill-evidence-capture",
    "skill-integrity-verification",
    "skill-audit-query",
    "skill-audit-reporting",
    "skill-audit-traceability",
    "skill-governance-enforcement",
  ],
  approvedTools: [
    "shared_runtime_core",
    "pillow_orchestration_runtime",
    "mission_runtime",
    "queue_runtime",
    "memory_runtime",
    "api_runtime",
    "tool_runtime",
    "communication_runtime",
    "approval_runtime",
    "monitoring_runtime",
    "recovery_runtime",
    "scheduling_runtime",
    "executive_reporting_runtime",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const AUDIT_CATEGORIES = [
  "runtime_event",
  "worker_action",
  "factory_activity",
  "api_activity",
  "queue_activity",
  "mission_lifecycle",
  "approval_decision",
  "recovery_event",
  "scheduling_activity",
  "evidence_attachment",
  "custom_extension",
] as const;

export const INTEGRITY_STATUSES = [
  "verified",
  "pending",
  "failed",
  "tampered_suspected",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "recording",
  "querying",
  "verifying",
  "reporting",
  "failed",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "unavailable"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

/** All prior Q10 runtimes + executive_reporting_runtime. */
export const INTEGRATION_TARGETS = [
  "shared_runtime_core",
  "pillow_orchestration_runtime",
  "mission_runtime",
  "queue_runtime",
  "memory_runtime",
  "api_runtime",
  "tool_runtime",
  "communication_runtime",
  "approval_runtime",
  "monitoring_runtime",
  "recovery_runtime",
  "scheduling_runtime",
  "executive_reporting_runtime",
] as const;

export const AUDRT_CAPABILITIES = [
  "record_runtime_events",
  "record_worker_actions",
  "record_mission_lifecycle",
  "record_approval_decisions",
  "record_recovery_events",
  "record_scheduling_activity",
  "attach_evidence_references",
  "query_audit_records",
  "verify_integrity",
  "export_audit_records",
  "produce_audit_runtime_reports",
  "preserve_complete_traceability",
  "preserve_immutable_audit_history",
  "preserve_audit_history",
  "never_fabricate_audit_evidence",
  "never_delete_audit_records",
  "never_execute_business_logic",
  "never_modify_operational_data",
  "never_bypass_pillow_governance",
  "never_bypass_grand_king_approval",
  "submit_through_executive_reporting_runtime",
  "integrate_shared_runtime_core",
  "integrate_pillow_orchestration_runtime",
  "integrate_mission_runtime",
  "integrate_queue_runtime",
  "integrate_memory_runtime",
  "integrate_api_runtime",
  "integrate_tool_runtime",
  "integrate_communication_runtime",
  "integrate_approval_runtime",
  "integrate_monitoring_runtime",
  "integrate_recovery_runtime",
  "integrate_scheduling_runtime",
  "integrate_executive_reporting_runtime",
  "q1014_consumable_contract",
] as const;
