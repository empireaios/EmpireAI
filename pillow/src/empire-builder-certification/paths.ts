/** PILLOW-EBC-001 — Empire Builder Certification (Q2-10). */
export const EMPIRE_BUILDER_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EMPIRE_BUILDER_CERTIFICATION_SYSTEM.md" as const;
export const EMPIRE_BUILDER_CERTIFICATION_ID = "empire-builder-certification" as const;
export const EBC_METADATA_VERSION = "EBC-001-v1" as const;
export const EMPIRE_BUILDER_FACTORY_VERSION = "Q2-EBF-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "certifying",
  "assessing",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Final certification levels (Q2-10).
 * Architecture allows additional levels via configuration without redesign.
 */
export const CERTIFICATION_LEVELS = [
  "certified",
  "certified_with_warnings",
  "provisionally_certified",
  "failed_certification",
] as const;

/**
 * Mandatory Empire Builder Factory components (Q2-01 … Q2-09).
 */
export const EMPIRE_BUILDER_COMPONENTS = [
  {
    id: "empire-builder-factory-core",
    label: "Empire Builder Factory Core",
    missionId: "Q2-01",
  },
  {
    id: "business-idea-interpreter",
    label: "Business Idea Interpreter",
    missionId: "Q2-02",
  },
  {
    id: "empire-builder-model-generator",
    label: "Business Model Generator",
    missionId: "Q2-03",
  },
  {
    id: "market-research-worker",
    label: "Market Research Worker",
    missionId: "Q2-04",
  },
  {
    id: "opportunity-evaluation-worker",
    label: "Opportunity Evaluation Worker",
    missionId: "Q2-05",
  },
  {
    id: "business-blueprint-worker",
    label: "Business Blueprint Worker",
    missionId: "Q2-06",
  },
  {
    id: "launch-plan-worker",
    label: "Launch Plan Worker",
    missionId: "Q2-07",
  },
  {
    id: "business-risk-worker",
    label: "Business Risk Worker",
    missionId: "Q2-08",
  },
  {
    id: "business-approval-pack-worker",
    label: "Business Approval Pack Worker",
    missionId: "Q2-09",
  },
] as const;

/**
 * Final acceptance integration domains (Q2-10).
 */
export const INTEGRATION_DOMAINS = [
  "idea_to_model",
  "model_to_research",
  "research_to_opportunity",
  "opportunity_to_blueprint",
  "blueprint_to_launch_plan",
  "launch_plan_to_risk",
  "risk_to_approval_pack",
  "cross_worker_integration",
  "executive_reporting",
  "traceability_chain",
  "pillow_governance",
  "empire_builder_readiness",
] as const;

/**
 * Mandatory Empire Builder planning / governance validations (Q2-10).
 */
export const PLANNING_GOVERNANCE_RULES = [
  "grand_king_business_command_accepted",
  "business_intent_generated",
  "business_model_generated",
  "market_research_completed",
  "opportunity_evaluated",
  "business_blueprint_completed",
  "launch_plan_completed",
  "business_risks_assessed",
  "business_approval_pack_generated",
  "full_traceability_preserved",
  "executive_reporting_completed",
  "entire_factory_governed_by_pillow",
] as const;

export const COMPONENT_PROBE_RESULTS = ["pass", "warning", "fail"] as const;

export const EBC_CAPABILITIES = [
  "verify_business_idea_interpreter",
  "verify_business_model_generator",
  "verify_market_research_worker",
  "verify_opportunity_evaluation_worker",
  "verify_business_blueprint_worker",
  "verify_launch_plan_worker",
  "verify_business_risk_worker",
  "verify_business_approval_pack_worker",
  "verify_cross_worker_integration",
  "verify_traceability_from_grand_king_command",
  "verify_executive_reporting_integration",
  "verify_pillow_governance",
  "verify_empire_builder_factory_readiness",
  "produce_unified_empire_builder_certification_report",
  "assess_planning_completeness",
  "determine_q2_production_readiness",
  "confirm_readiness_for_q3",
  "extensible_certification_levels",
  "extensible_integration_domains",
  "preserve_auditability",
  "preserve_traceability",
  "empire_builder_certification_validation",
  "health_monitoring",
  "recovery_management",
] as const;
