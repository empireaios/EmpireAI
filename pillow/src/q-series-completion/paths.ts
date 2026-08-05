/** PILLOW-QSCPT-001 — Q Series Completion (Q11-13). */
export const Q_SERIES_COMPLETION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_Q_SERIES_COMPLETION_SYSTEM.md" as const;
export const Q_SERIES_COMPLETION_ID = "q-series-completion" as const;
export const QSCPT_METADATA_VERSION = "QSCPT-001-v1" as const;
export const Q_SERIES_COMPLETION_REPORT_VERSION = "QSCPT-RPT-v1" as const;
export const QSCPT_MISSION_ID = "Q11-13" as const;
export const Q_SERIES_COMPLETION_RUNTIME_VERSION = "Q11-QSCPT-v1" as const;

export const Q_SERIES_COMPLETION_IDENTITY = {
  workerId: "wkr-q-series-completion-01",
  workerName: "Q Series Completion",
  workerType: "complete",
  department: "q_series_completion",
  factory: "q-series-completion",
  role: "role-complete-q-series",
  reportingLine: ["wkr-q-series-completion-01", "pillow"] as string[],
  skillProfile: [
    "skill-mission-completion-verification",
    "skill-workforce-capability-verification",
    "skill-runtime-integration-verification",
    "skill-governance-compliance-verification",
    "skill-certification-completion-verification",
    "skill-production-readiness-verification",
    "skill-completion-evidence-aggregation",
    "skill-final-completion-decision",
    "skill-q-series-completion-reporting",
  ],
  approvedTools: ["injected_evidence_only", "structured_reporting"],
  authorityLevel: "evidence_only_completion",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "verifying",
  "aggregating",
  "deciding",
  "reporting",
  "validating",
  "blocked",
  "standby",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "blocked", "standby", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "blocked"] as const;

export const COMPLETION_CLASSIFICATIONS = [
  "complete",
  "partially_complete",
  "failed",
  "missing",
  "blocked",
  "deferred",
] as const;

export const FINAL_COMPLETION_DECISIONS = ["complete", "incomplete", "withhold", "escalate", "defer"] as const;

export const INTEGRATION_TARGETS = [
  "q_series_certification",
  "production_certification_core",
  "shared_runtime_certification",
  "worker_readiness_audit",
  "pillow_command_audit",
  "business_factory_audit",
  "security_audit",
  "performance_audit",
  "recovery_audit",
  "executive_acceptance_pack",
  "grand_king_acceptance_gate",
  "post_launch_monitoring",
  "shared_runtime_core",
  "worker_registry",
  "pillow_orchestration_runtime",
  "executive_reporting_runtime",
  "audit_runtime",
  "monitoring_runtime",
  "recovery_runtime",
  "api_runtime",
] as const;

export const Q11_MISSION_INVENTORY = [
  { missionId: "Q11-01", depKey: "productionCertificationCore", label: "Production Certification Core" },
  { missionId: "Q11-02", depKey: "workerReadinessAudit", label: "Worker Readiness Audit" },
  { missionId: "Q11-03", depKey: "pillowCommandAudit", label: "Pillow Command Audit" },
  { missionId: "Q11-04", depKey: "businessFactoryAudit", label: "Business Factory Audit" },
  { missionId: "Q11-05", depKey: "securityAudit", label: "Security Audit" },
  { missionId: "Q11-06", depKey: "performanceAudit", label: "Performance Audit" },
  { missionId: "Q11-07", depKey: "recoveryAudit", label: "Recovery Audit" },
  {
    missionId: "Q11-08",
    depKey: "financialReadinessAudit",
    label: "Financial Readiness Audit (FINART)",
    optionalRecordMissing: true,
  },
  { missionId: "Q11-09", depKey: "executiveAcceptancePack", label: "Executive Acceptance Pack" },
  { missionId: "Q11-10", depKey: "grandKingAcceptanceGate", label: "Grand King Acceptance Gate" },
  { missionId: "Q11-11", depKey: "postLaunchMonitoring", label: "Post-Launch Monitoring" },
  { missionId: "Q11-12", depKey: "qSeriesCertification", label: "Q Series Certification" },
] as const;

export const QSCPT_CAPABILITIES = [
  "verify_mission_completion",
  "verify_workforce_capabilities",
  "verify_runtime_integration",
  "verify_governance_compliance",
  "verify_certification_completion",
  "verify_production_readiness",
  "aggregate_final_completion_evidence",
  "produce_final_completion_decision",
  "produce_q_series_completion_report",
  "complete_q_series",
  "consume_q1113_consumable_contract",
  "expose_q1201_consumable_contract",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_completion_history",
  "never_fabricate_completion_evidence",
  "never_mark_complete_when_unmet",
  "never_bypass_governance",
  "never_override_grand_king",
  "never_override_pillow",
  "never_implement_q1201_or_later",
  "deterministic_completion_behaviour",
  "structural_signal_only",
  "evidence_based_only",
  "final_q11_gate",
] as const;
