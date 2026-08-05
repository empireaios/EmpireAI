/** PILLOW-GKAGT-001 — Grand King Acceptance Gate (Q11-10). Final Q11 acceptance gate. */

export const GRAND_KING_ACCEPTANCE_GATE_SYSTEM_PATH =

  "docs/governance/EMPIREAI_GRAND_KING_ACCEPTANCE_GATE_SYSTEM.md" as const;

export const GRAND_KING_ACCEPTANCE_GATE_ID = "grand-king-acceptance-gate" as const;

export const GKAGT_METADATA_VERSION = "GKAGT-001-v1" as const;

export const GRAND_KING_ACCEPTANCE_GATE_REPORT_VERSION = "GKAGT-RPT-v1" as const;

export const GKAGT_MISSION_ID = "Q11-10" as const;

export const GRAND_KING_ACCEPTANCE_GATE_RUNTIME_VERSION = "Q11-GKAGT-v1" as const;



export const GRAND_KING_ACCEPTANCE_GATE_IDENTITY = {

  workerId: "wkr-grand-king-acceptance-gate-01",

  workerName: "Grand King Acceptance Gate",

  workerType: "auditor",

  department: "grand_king_acceptance_gate",

  factory: "grand-king-acceptance-gate",

  role: "role-auditor-grand-king-acceptance-gate",

  reportingLine: ["wkr-grand-king-acceptance-gate-01", "pillow"] as string[],

  skillProfile: [

    "skill-executive-acceptance-pack-consumption",

    "skill-prerequisite-certification-verification",

    "skill-production-readiness-presentation",

    "skill-grand-king-decision-recording",

    "skill-deployment-authorisation-gating",

    "skill-immutable-approval-history",

    "skill-grand-king-acceptance-reporting",

  ],

  approvedTools: ["repository_evidence_scanner", "structured_reporting"],

  authorityLevel: "constitutional_approval_evidence_only",

} as const;



export const ENGINE_STATUSES = [

  "idle",

  "connecting",

  "active",

  "collecting_pack",

  "verifying_prerequisites",

  "presenting_readiness",

  "awaiting_decision",

  "recording_decision",

  "generating_authorisation",

  "reporting",

  "validating",

  "failed",

] as const;



export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;



export const GRAND_KING_DECISIONS = ["approve", "reject", "defer", "pending"] as const;

export const DEPLOYMENT_AUTHORISATION_STATUSES = ["authorised", "blocked", "revoked", "pending"] as const;

export const RE_REVIEW_STATUSES = ["not_required", "requested", "in_progress", "completed"] as const;



export const CERTIFICATION_STATUSES = [

  "certified",

  "partially_certified",

  "failed",

  "missing",

  "blocked",

  "deferred",

] as const;



export const AUDIT_STATUSES = [

  "draft",

  "evidence_collected",

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



export const INTEGRATION_TARGETS = [

  "executive_acceptance_pack",

  "production_certification_core",

  "shared_runtime_certification",

  "executive_reporting_runtime",

  "approval_runtime",

  "audit_runtime",

  "monitoring_runtime",

] as const;



export const GKAGT_CAPABILITIES = [

  "collect_executive_acceptance_pack",

  "verify_prerequisite_certifications",

  "present_production_readiness",

  "record_grand_king_decision",

  "prevent_deployment_without_approval",

  "generate_deployment_authorisation",

  "request_re_review",

  "produce_grand_king_acceptance_report",

  "consume_q1110_consumable_contract",

  "expose_q1201_consumable_contract",

  "submit_reports_through_executive_reporting_runtime",

  "preserve_immutable_approval_history",

  "never_fabricate_approval_evidence",

  "never_bypass_grand_king_approval",

  "never_authorise_without_approval",

  "never_override_failed_certifications",

  "never_implement_q1201_or_later",

  "deterministic_gate_behaviour",

  "structural_signal_only",

  "evidence_based_only",

  "health_monitoring",

  "final_q11_gate",

] as const;

