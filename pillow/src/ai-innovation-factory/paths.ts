/** PILLOW-AIFRT-001 — AI Innovation Factory (Q12-01). */

export const AI_INNOVATION_FACTORY_SYSTEM_PATH =

  "docs/governance/EMPIREAI_AI_INNOVATION_FACTORY_SYSTEM.md" as const;

export const AI_INNOVATION_FACTORY_ID = "ai-innovation-factory" as const;

export const AIFRT_METADATA_VERSION = "AIFRT-001-v1" as const;

export const AI_INNOVATION_FACTORY_REPORT_VERSION = "AIFRT-RPT-v1" as const;

export const AIFRT_MISSION_ID = "Q12-01" as const;

export const AI_INNOVATION_FACTORY_RUNTIME_VERSION = "Q12-AIFRT-v1" as const;



export const AI_INNOVATION_FACTORY_IDENTITY = {

  workerId: "wkr-ai-innovation-factory-01",

  workerName: "AI Innovation Factory",

  workerType: "research",

  department: "ai_innovation_factory",

  factory: "ai-innovation-factory",

  role: "role-research-innovate",

  reportingLine: ["wkr-ai-innovation-factory-01", "pillow"] as string[],

  skillProfile: [

    "skill-emerging-ai-research",

    "skill-model-api-tracking",

    "skill-business-opportunity-discovery",

    "skill-architecture-improvement-evaluation",

    "skill-operational-improvement-analysis",

    "skill-innovation-prioritisation",

    "skill-implementation-recommendation",

    "skill-innovation-history-preservation",

    "skill-pillow-governance-integration",

    "skill-ai-innovation-reporting",

  ],

  approvedTools: ["injected_evidence_only", "structured_research_catalog", "structured_reporting"],

  authorityLevel: "research_recommend_only",

} as const;



export const ENGINE_STATUSES = [

  "idle",

  "connecting",

  "active",

  "researching",

  "evaluating",

  "prioritising",

  "reporting",

  "validating",

  "blocked",

  "standby",

  "failed",

] as const;



export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "blocked", "standby", "failed"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "blocked"] as const;



export const INNOVATION_CATEGORIES = [

  "ai_model",

  "framework",

  "api",

  "architecture",

  "operations",

  "cost_optimisation",

  "business_opportunity",

  "research",

] as const;



export const APPROVAL_STATUSES = ["pending", "recommended", "deferred", "rejected", "approved"] as const;

export const PRIORITY_LEVELS = ["critical", "high", "medium", "low"] as const;



export const INTEGRATION_TARGETS = [

  "q_series_completion",

  "grand_king_acceptance_gate",

  "shared_runtime_core",

  "worker_registry",

  "pillow_orchestration_runtime",

  "monitoring_runtime",

  "audit_runtime",

  "executive_reporting_runtime",

] as const;



/** Seeded research catalog — evidence refs only; never invent external web claims. */

export const RESEARCH_CATALOG = [

  {

    catalogId: "rc-ai-model-001",

    category: "ai_model" as const,

    name: "Structured LLM routing",

    description: "Evaluate multi-model routing for cost/latency trade-offs within Pillow runtime",

    evidenceRef: "config/ai-innovation-factory.config.json",

    expectedBenefit: "Reduced inference cost with maintained quality",

    estimatedCost: "medium",

    estimatedRisk: "low",

  },

  {

    catalogId: "rc-framework-001",

    category: "framework" as const,

    name: "Runtime bridge standardisation",

    description: "Consolidate pillow-host bridge patterns for Q-series modules",

    evidenceRef: "backend/src/orchestration/pillow-host/",

    expectedBenefit: "Faster mission onboarding and reduced wiring errors",

    estimatedCost: "medium",

    estimatedRisk: "medium",

  },

  {

    catalogId: "rc-api-001",

    category: "api" as const,

    name: "Executive reporting contract expansion",

    description: "Extend submitWorkerReport payloads for innovation proposals",

    evidenceRef: "pillow/src/executive-reporting-runtime/",

    expectedBenefit: "Unified executive visibility for innovation pipeline",

    estimatedCost: "low",

    estimatedRisk: "low",

  },

  {

    catalogId: "rc-architecture-001",

    category: "architecture" as const,

    name: "Shared runtime health aggregation",

    description: "Surface SRTC/POR health gaps for architectural improvement proposals",

    evidenceRef: "pillow/src/shared-runtime-core/",

    expectedBenefit: "Proactive architectural remediation before production impact",

    estimatedCost: "high",

    estimatedRisk: "medium",

  },

  {

    catalogId: "rc-operations-001",

    category: "operations" as const,

    name: "Monitoring signal enrichment",

    description: "Leverage monitoringRuntime signals for operational improvement analysis",

    evidenceRef: "pillow/src/monitoring-runtime/",

    expectedBenefit: "Evidence-backed operational tuning recommendations",

    estimatedCost: "low",

    estimatedRisk: "low",

  },

  {

    catalogId: "rc-cost-001",

    category: "cost_optimisation" as const,

    name: "Worker registry right-sizing",

    description: "Analyse workerRegistry topology for idle or over-provisioned workers",

    evidenceRef: "pillow/src/worker-registry/",

    expectedBenefit: "Reduced operational overhead",

    estimatedCost: "low",

    estimatedRisk: "low",

  },

  {

    catalogId: "rc-business-001",

    category: "business_opportunity" as const,

    name: "Factory topology opportunity scan",

    description: "Discover business opportunities from factory/worker topology via sharedRuntimeCore",

    evidenceRef: "pillow/src/shared-runtime-core/paths.js",

    expectedBenefit: "New revenue or efficiency pathways from existing infrastructure",

    estimatedCost: "medium",

    estimatedRisk: "medium",

  },

  {

    catalogId: "rc-research-001",

    category: "research" as const,

    name: "Q-series post-completion innovation pipeline",

    description: "Research governed innovation workflow after Q Series completion gate",

    evidenceRef: "docs/governance/EMPIREAI_AI_INNOVATION_FACTORY_SYSTEM.md",

    expectedBenefit: "Structured innovation without bypassing Pillow governance",

    estimatedCost: "medium",

    estimatedRisk: "low",

  },

] as const;



export const AIFRT_CAPABILITIES = [

  "research_emerging_technologies",

  "track_models_and_apis",

  "discover_business_opportunities",

  "evaluate_architectural_improvements",

  "analyse_operational_improvements",

  "prioritise_innovation_proposals",

  "generate_implementation_recommendations",

  "produce_ai_innovation_report",

  "consume_q1201_consumable_contract",

  "expose_q1301_consumable_contract",

  "submit_reports_through_executive_reporting_runtime",

  "preserve_innovation_history",

  "never_fabricate_research_evidence",

  "never_auto_deploy_innovations",

  "never_bypass_governance",

  "never_override_grand_king",

  "never_override_pillow",

  "never_implement_q1301_or_later",

  "never_claim_q_series_complete_when_incomplete",

  "deterministic_innovation_behaviour",

  "evidence_based_only",

  "governed_innovation_research_only",

] as const;


