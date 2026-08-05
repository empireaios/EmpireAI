/** PILLOW-PCCRT-001 — Production Certification Core (Q11-01). First Q11 acceptance gate. */
export const PRODUCTION_CERTIFICATION_CORE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PRODUCTION_CERTIFICATION_CORE_SYSTEM.md" as const;
export const PRODUCTION_CERTIFICATION_CORE_ID = "production-certification-core" as const;
export const PCCRT_METADATA_VERSION = "PCCRT-001-v1" as const;
export const PRODUCTION_CERTIFICATION_CORE_REPORT_VERSION = "PCCRT-RPT-v1" as const;
export const PCCRT_MISSION_ID = "Q11-01" as const;
export const PRODUCTION_CERTIFICATION_CORE_RUNTIME_VERSION = "Q11-PCCRT-v1" as const;

export const PRODUCTION_CERTIFICATION_CORE_IDENTITY = {
  workerId: "wkr-production-certification-core-01",
  workerName: "Production Certification Core",
  workerType: "certifier",
  department: "certification",
  factory: "pillow-production-certification-core",
  role: "role-certifier-production-certification-core",
  reportingLine: ["wkr-production-certification-core-01", "pillow"] as string[],
  skillProfile: [
    "skill-certification-programme-registration",
    "skill-factory-discovery",
    "skill-worker-discovery",
    "skill-runtime-discovery",
    "skill-certification-requirement-registration",
    "skill-certification-execution-coordination",
    "skill-certification-evidence-aggregation",
    "skill-production-readiness-scoring",
    "skill-certification-status-tracking",
    "skill-production-certification-reporting",
  ],
  approvedTools: ["repository_evidence_scanner", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "registering_programmes",
  "discovering_factories",
  "discovering_workers",
  "discovering_runtimes",
  "collecting_evidence",
  "assessing_readiness",
  "certifying",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Per-component certification statuses — derived strictly from observed evidence. */
export const CERTIFICATION_STATUSES = [
  "Certified",
  "Partially Certified",
  "Failed Certification",
  "Blocked",
  "Deferred",
  "Registered",
  "Discovered",
  "Pending",
] as const;

export const CERTIFICATION_DECISIONS = [
  "Certified",
  "Conditionally_Certified",
  "Not_Certified",
  "Failed",
  "Deferred",
] as const;

export const AUDIT_STATUSES = [
  "draft",
  "programmes_registered",
  "evidence_collected",
  "readiness_assessed",
  "certified",
  "conditionally_certified",
  "not_certified",
  "failed",
  "deferred",
  "submitted",
  "rejected",
  "unknown",
] as const;

/** Certification component types recognised across the whole certification core. */
export const COMPONENT_TYPES = [
  "factory",
  "worker",
  "runtime",
  "governance",
  "reporting",
  "integration",
  "programme",
  "custom_extension",
] as const;

/**
 * Thin Q10-01..Q10-13 runtime reference list — only ids/names/dependency keys
 * needed for discovery + probing. The full per-runtime evidence catalog is
 * owned by shared-runtime-certification (Q10-14); this module never
 * duplicates that authority, it only discovers structural presence.
 */
export const Q10_RUNTIME_IDS = [
  { missionId: "Q10-01", runtimeName: "shared-runtime-core", dependencyKey: "sharedRuntimeCore" },
  {
    missionId: "Q10-02",
    runtimeName: "pillow-orchestration-runtime",
    dependencyKey: "pillowOrchestrationRuntime",
  },
  { missionId: "Q10-03", runtimeName: "mission-runtime", dependencyKey: "missionRuntime" },
  { missionId: "Q10-04", runtimeName: "queue-runtime", dependencyKey: "queueRuntime" },
  { missionId: "Q10-05", runtimeName: "memory-runtime", dependencyKey: "memoryRuntime" },
  { missionId: "Q10-06", runtimeName: "api-runtime", dependencyKey: "apiRuntime" },
  { missionId: "Q10-07", runtimeName: "tool-runtime", dependencyKey: "toolRuntime" },
  { missionId: "Q10-08", runtimeName: "communication-runtime", dependencyKey: "communicationRuntime" },
  { missionId: "Q10-09", runtimeName: "approval-runtime", dependencyKey: "approvalRuntime" },
  { missionId: "Q10-10", runtimeName: "monitoring-runtime", dependencyKey: "monitoringRuntime" },
  { missionId: "Q10-11", runtimeName: "recovery-runtime", dependencyKey: "recoveryRuntime" },
  { missionId: "Q10-12", runtimeName: "scheduling-runtime", dependencyKey: "schedulingRuntime" },
  { missionId: "Q10-13", runtimeName: "audit-runtime", dependencyKey: "auditRuntime" },
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

/**
 * Fixed catalog of Q11 certification programme slots. New programmes can be
 * registered by extending this array — the manager never redesigns its
 * evaluation pipeline to support additional programmes.
 */
export const PROGRAMME_CATALOG = [
  {
    programmeId: "workforce_certification",
    programmeName: "Workforce Certification",
    componentType: "worker",
    description: "Certifies discovered workers from the Worker Registry against structural evidence.",
    requiredEvidenceRefs: ["workerRegistry.listWorkers()"],
  },
  {
    programmeId: "runtime_certification",
    programmeName: "Runtime Certification",
    componentType: "runtime",
    description: "Certifies the Q10-01..Q10-13 Shared Runtime pipeline from discovery and probe evidence.",
    requiredEvidenceRefs: ["pillow/src/<runtime>/engine.ts", "Q10 runtime probe handles"],
  },
  {
    programmeId: "factory_certification",
    programmeName: "Factory Certification",
    componentType: "factory",
    description: "Certifies discovered factories against the Shared Runtime Core FACTORY_KEYS catalog.",
    requiredEvidenceRefs: ["sharedRuntimeCore.listFactories()", "pillow/src/shared-runtime-core/paths.ts"],
  },
  {
    programmeId: "governance_certification",
    programmeName: "Governance Certification",
    componentType: "governance",
    description: "Certifies governance document presence and boundary-lock compliance.",
    requiredEvidenceRefs: [PRODUCTION_CERTIFICATION_CORE_SYSTEM_PATH],
  },
  {
    programmeId: "reporting_certification",
    programmeName: "Reporting Certification",
    componentType: "reporting",
    description: "Certifies Executive Reporting Runtime availability and report submission capability.",
    requiredEvidenceRefs: ["executiveReportingRuntime.submitWorkerReport()"],
  },
  {
    programmeId: "integration_certification",
    programmeName: "Integration Certification",
    componentType: "integration",
    description: "Certifies integration wiring across injected dependencies.",
    requiredEvidenceRefs: ["integration handshake evidence"],
  },
  {
    programmeId: "security_certification",
    programmeName: "Security Certification",
    componentType: "governance",
    description: "Certifies boundary-lock and credential-masking compliance.",
    requiredEvidenceRefs: ["configuration boundary locks"],
  },
  {
    programmeId: "performance_certification",
    programmeName: "Performance Certification",
    componentType: "runtime",
    description: "Certifies Monitoring Runtime availability and reachability for performance signal.",
    requiredEvidenceRefs: ["monitoringRuntime probe"],
  },
  {
    programmeId: "recovery_certification",
    programmeName: "Recovery Certification",
    componentType: "runtime",
    description: "Certifies Recovery Runtime / Worker Recovery System availability.",
    requiredEvidenceRefs: ["recoveryRuntime probe", "workerRecoverySystem"],
  },
  {
    programmeId: "financial_readiness_certification",
    programmeName: "Financial Readiness Certification",
    componentType: "integration",
    description: "Certifies presence of capital/financial worker bridges as structural readiness evidence.",
    requiredEvidenceRefs: [
      "backend/src/orchestration/pillow-host/financial-reporting-worker-bridge.ts",
      "backend/src/orchestration/pillow-host/capital-risk-worker-bridge.ts",
      "backend/src/orchestration/pillow-host/investment-planning-worker-bridge.ts",
    ],
  },
  {
    programmeId: "executive_certification",
    programmeName: "Executive Certification",
    componentType: "governance",
    description: "Certifies Executive readiness from the bootstrap executive briefing.",
    requiredEvidenceRefs: ["bootstrap.executiveReady", "bootstrap.executiveBriefing"],
  },
  {
    programmeId: "custom_extension",
    programmeName: "Custom Extension",
    componentType: "custom_extension",
    description: "Reserved extension slot for future certification programmes without redesign.",
    requiredEvidenceRefs: [],
  },
] as const;

export const INTEGRATION_TARGETS = [
  "shared-runtime-core",
  "shared-runtime-certification",
  "shared-runtime-core-factories",
  "worker_registry",
  "worker_lifecycle",
  "audit_runtime",
  "monitoring_runtime",
  "approval_runtime",
  "recovery_runtime",
  "executive_reporting_runtime",
  "worker_recovery_system",
] as const;

export const PCCRT_CAPABILITIES = [
  "register_certification_programmes",
  "discover_factories",
  "discover_workers",
  "discover_runtimes",
  "register_certification_requirements",
  "coordinate_certification_execution",
  "aggregate_certification_evidence",
  "calculate_production_readiness",
  "track_certification_status",
  "produce_production_certification_reports",
  "submit_reports_through_executive_reporting_runtime",
  "expose_q1102_consumable_contract",
  "consume_q1101_consumable_contract",
  "preserve_complete_traceability",
  "preserve_immutable_certification_history",
  "preserve_certification_history",
  "preserve_audit_history",
  "never_fabricate_certification_evidence",
  "never_certify_missing_capabilities",
  "never_assume_implementation",
  "never_implement_missing_capabilities",
  "never_modify_production_logic",
  "never_replace_individual_audit_programmes",
  "never_bypass_pillow_governance",
  "never_bypass_grand_king_approval",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_implement_q1102_or_later",
  "integrate_shared_runtime_certification",
  "integrate_shared_runtime_core",
  "integrate_worker_registry",
  "integrate_audit_runtime",
  "integrate_monitoring_runtime",
  "integrate_approval_runtime",
  "integrate_executive_reporting_runtime",
  "integrate_worker_lifecycle",
  "integrate_worker_recovery_system",
  "deterministic_certification",
  "structural_signal_only",
  "evidence_based_only",
  "health_monitoring",
  "recovery_management",
  "first_q11_gate",
] as const;
