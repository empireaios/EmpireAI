/** PILLOW-PCFCT-001 — Programme Certification Factory (Q13-06). Final Q Series mission. */



export const PROGRAMME_CERTIFICATION_FACTORY_SYSTEM_PATH =

  "docs/governance/EMPIREAI_PROGRAMME_CERTIFICATION_FACTORY_SYSTEM.md" as const;



export const PROGRAMME_CERTIFICATION_FACTORY_ID = "programme-certification-factory" as const;



export const PCFCT_METADATA_VERSION = "PCFCT-001-v1" as const;



export const PROGRAMME_CERTIFICATION_FACTORY_REPORT_VERSION = "PCFCT-RPT-v1" as const;



export const PCFCT_MISSION_ID = "Q13-06" as const;



export const PROGRAMME_CERTIFICATION_FACTORY_RUNTIME_VERSION = "Q13-PCFCT-v1" as const;



export const PROGRAMME_CERTIFICATION_FACTORY_IDENTITY = {

  workerId: "wkr-programme-certification-factory-01",

  workerName: "Programme Certification Factory",

  workerType: "programme_certification",

  department: "programme_certification_factory",

  factory: "programme-certification-factory",

  role: "role-pcfct",

  reportingLine: ["wkr-programme-certification-factory-01", "pillow"] as string[],

  skillProfile: [

    "skill-programme-discovery",

    "skill-repository-audit",

    "skill-mission-classification",

    "skill-gap-analysis",

    "skill-programme-certification",

    "skill-constitutional-completion",

    "skill-q1306-contract-consumption",

    "skill-pillow-governance-integration",

  ],

  approvedTools: ["structured_reporting"],

  authorityLevel: "programme_certification_only",

} as const;



export const ENGINE_STATUSES = [

  "idle",

  "connecting",

  "connected",

  "active",

  "discovering",

  "auditing",

  "classifying",

  "certifying",

  "reporting",

  "validating",

  "blocked",

  "standby",

  "failed",

] as const;



export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "blocked", "standby", "failed"] as const;



export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;



export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "blocked"] as const;



export const MISSION_CLASSIFICATIONS = [

  "Completed",

  "Partially Implemented",

  "Missing",

  "Broken/Deviating",

  "Duplicate",

  "Intentionally Deferred",

] as const;



export const CERTIFICATION_STATUSES = [

  "certified",

  "certified_with_exceptions",

  "intentionally_deferred",

  "withheld",

  "failed",

] as const;



export const CONSTITUTIONAL_PROGRAMME_CODES = ["G", "P", "E", "K", "T", "R", "X", "Q"] as const;



export const INTEGRATION_TARGETS = [

  "implementation_recovery_planner",

  "cursor_specification_generator",

  "mission_planning_engine",

  "repository_intelligence_engine",

  "implementation_specification_engine",

  "q_series_certification",

  "q_series_completion",

  "production_certification_core",

  "empire_knowledge_engine",

  "audit_runtime",

  "executive_reporting_runtime",

  "pillow_orchestration_runtime",

] as const;



export const PCFCT_CAPABILITIES = [

  "discover_approved_programmes",

  "audit_programme_repository",

  "compare_against_roadmap_evidence",

  "classify_missions",

  "produce_programme_gap_analysis",

  "generate_completion_recommendations",

  "verify_completion_after_corrections",

  "certify_programme",

  "produce_programme_certification_report",

  "produce_final_repository_constitutional_certification",

  "consume_q1306_contract",

  "expose_q_series_constitutional_completion_contract",

  "submit_reports_through_executive_reporting_runtime",

  "preserve_certification_history",

  "never_fabricate_findings",

  "never_auto_modify_production",

  "never_certify_from_claims_alone",

  "never_implement_q1307_or_later",

  "never_implement_future_programme",

  "never_bypass_governance",

  "programme_certification_only",

] as const;



/** Fixed constitutional programme catalog — do not invent missions. */

export const CONSTITUTIONAL_PROGRAMME_CATALOG = [

  {

    programmeName: "G Series",

    code: "G" as const,

    evidenceRoot: "docs/audits/g-phase/",

    certificationDoc: "docs/audits/g-phase/G_PHASE_CERTIFICATION.md",

  },

  {

    programmeName: "P Series",

    code: "P" as const,

    evidenceRoot: "docs/audits/p-phase/",

    certificationDoc: "docs/audits/p-phase/P_PHASE_CERTIFICATION.md",

  },

  {

    programmeName: "E Series",

    code: "E" as const,

    evidenceRoot: "docs/audits/e-phase/",

    certificationDoc: "docs/audits/e-phase/E_PHASE_CERTIFICATION.md",

  },

  {

    programmeName: "K Series",

    code: "K" as const,

    evidenceRoot: null,

    certificationDoc: null,

    intentionallyDeferred: true,

  },

  {

    programmeName: "T Series",

    code: "T" as const,

    evidenceRoot: "docs/audits/t-phase/",

    certificationDoc: "docs/audits/t-phase/T_PHASE_CERTIFICATION.md",

  },

  {

    programmeName: "R Series",

    code: "R" as const,

    evidenceRoot: "docs/audits/r-phase/",

    certificationDoc: "docs/audits/r-phase/R_PHASE_CERTIFICATION.md",

  },

  {

    programmeName: "X Series",

    code: "X" as const,

    evidenceRoot: "docs/audits/x-phase/",

    certificationDoc: "docs/audits/x-phase/X_PHASE_CERTIFICATION.md",

  },

  {

    programmeName: "Q Series",

    code: "Q" as const,

    evidenceRoot: "docs/audits/pillow/",

    certificationDoc: null,

    qSeriesScan: true,

  },

] as const;


