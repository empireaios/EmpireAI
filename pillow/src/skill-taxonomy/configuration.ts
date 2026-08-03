import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PROFICIENCY_LEVELS,
  SKILL_CATEGORIES,
  SKILL_RULES,
  STX_METADATA_VERSION,
  TAXONOMY_VERSION,
} from "./paths.js";
import type { SkillDefinition, WorkerSkillBinding } from "./types.js";

function seedSkill(
  partial: Omit<
    SkillDefinition,
    | "taxonomyVersion"
    | "metadataVersion"
    | "neverExecuteWorkerTasks"
    | "neverReplaceRoleTaxonomy"
    | "neverReplaceWorkforceCapabilityRegistry"
    | "neverOverridePillow"
    | "neverOverrideGrandKing"
    | "preserveAuditability"
    | "preserveTraceability"
    | "structuralSignalOnly"
    | "maskSensitiveValues"
  >,
): SkillDefinition {
  return {
    ...partial,
    taxonomyVersion: TAXONOMY_VERSION,
    metadataVersion: STX_METADATA_VERSION,
    neverExecuteWorkerTasks: true,
    neverReplaceRoleTaxonomy: true,
    neverReplaceWorkforceCapabilityRegistry: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveAuditability: true,
    preserveTraceability: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

export const DEFAULT_SEED_SKILLS: SkillDefinition[] = [
  seedSkill({
    skillId: "skill-ops-foundation",
    skillName: "Operations Foundation",
    skillCategory: "operations",
    parentSkill: null,
    description: "Foundational operational discipline for all workforce skills",
    proficiencyLevel: "beginner",
    requiredTools: ["structured_reporting"],
    capabilityLimits: ["no_autonomous_execution"],
    validationRules: ["evidence_required"],
    certificationRequirements: ["worker_quality_standard"],
    purpose: "Provide the base skill all workers derive from",
    requiredKnowledge: ["workforce_operating_basics"],
    validationMethod: "evidence_review",
    dependencies: [],
    prerequisites: [],
  }),
  seedSkill({
    skillId: "skill-executive-direction",
    skillName: "Executive Direction",
    skillCategory: "executive",
    parentSkill: "skill-ops-foundation",
    description: "Set executive direction under Pillow authority",
    proficiencyLevel: "master",
    requiredTools: ["executive_command_center"],
    capabilityLimits: ["recommend_only_to_pillow"],
    validationRules: ["executive_audit"],
    certificationRequirements: ["executive_governance_cert"],
    purpose: "Coordinate executive outcomes without overriding Pillow",
    requiredKnowledge: ["governance", "cross_factory_alignment"],
    validationMethod: "executive_review",
    dependencies: ["skill-ops-foundation"],
    prerequisites: ["skill-ops-foundation"],
  }),
  seedSkill({
    skillId: "skill-business-strategy",
    skillName: "Business Strategy",
    skillCategory: "business",
    parentSkill: "skill-ops-foundation",
    description: "Formulate and rank business options",
    proficiencyLevel: "advanced",
    requiredTools: ["strategy_briefs"],
    capabilityLimits: ["no_capital_commitment"],
    validationRules: ["option_ranking_required"],
    certificationRequirements: ["business_strategy_cert"],
    purpose: "Produce structured business strategy recommendations",
    requiredKnowledge: ["market_structure", "competitive_analysis"],
    validationMethod: "peer_strategy_review",
    dependencies: ["skill-ops-foundation"],
    prerequisites: ["skill-ops-foundation"],
  }),
  seedSkill({
    skillId: "skill-commerce-marketplace",
    skillName: "Commerce Marketplace Ops",
    skillCategory: "commerce",
    parentSkill: "skill-business-strategy",
    description: "Operate marketplace listings and fulfillment readiness",
    proficiencyLevel: "intermediate",
    requiredTools: ["commerce_console", "inventory_feed"],
    capabilityLimits: ["no_unapproved_price_changes"],
    validationRules: ["listing_quality_gate"],
    certificationRequirements: ["commerce_ops_cert"],
    purpose: "Execute commerce operations within approved limits",
    requiredKnowledge: ["marketplace_policies", "fulfillment_slas"],
    validationMethod: "commerce_qa",
    dependencies: ["skill-business-strategy"],
    prerequisites: ["skill-business-strategy"],
  }),
  seedSkill({
    skillId: "skill-media-content",
    skillName: "Media Content Production",
    skillCategory: "media",
    parentSkill: "skill-ops-foundation",
    description: "Produce branded media assets under brand governance",
    proficiencyLevel: "intermediate",
    requiredTools: ["media_studio"],
    capabilityLimits: ["brand_approved_assets_only"],
    validationRules: ["brand_compliance_check"],
    certificationRequirements: ["media_production_cert"],
    purpose: "Create media content within brand and legal limits",
    requiredKnowledge: ["brand_guidelines", "content_rights"],
    validationMethod: "brand_review",
    dependencies: ["skill-ops-foundation"],
    prerequisites: ["skill-ops-foundation"],
  }),
  seedSkill({
    skillId: "skill-engineering-software",
    skillName: "Software Engineering",
    skillCategory: "engineering",
    parentSkill: "skill-ops-foundation",
    description: "Design and implement governed software changes",
    proficiencyLevel: "advanced",
    requiredTools: ["code_workspace", "ci_pipeline"],
    capabilityLimits: ["no_production_deploy_without_approval"],
    validationRules: ["tests_required", "review_required"],
    certificationRequirements: ["engineering_quality_cert"],
    purpose: "Deliver engineering work with evidence and review",
    requiredKnowledge: ["software_architecture", "testing"],
    validationMethod: "code_review",
    dependencies: ["skill-ops-foundation"],
    prerequisites: ["skill-ops-foundation"],
  }),
  seedSkill({
    skillId: "skill-engineering-automation",
    skillName: "Engineering Automation",
    skillCategory: "engineering",
    parentSkill: "skill-engineering-software",
    description: "Automate repeatable engineering workflows",
    proficiencyLevel: "expert",
    requiredTools: ["automation_runner", "ci_pipeline"],
    capabilityLimits: ["no_unscoped_automation"],
    validationRules: ["automation_safety_check"],
    certificationRequirements: ["automation_safety_cert"],
    purpose: "Build safe automation on top of software engineering",
    requiredKnowledge: ["workflow_automation", "failure_modes"],
    validationMethod: "automation_dry_run",
    dependencies: ["skill-engineering-software"],
    prerequisites: ["skill-engineering-software"],
  }),
  seedSkill({
    skillId: "skill-finance-analysis",
    skillName: "Financial Analysis",
    skillCategory: "finance",
    parentSkill: "skill-ops-foundation",
    description: "Analyze financial signals and produce governed briefs",
    proficiencyLevel: "advanced",
    requiredTools: ["finance_ledger_view"],
    capabilityLimits: ["no_fund_movement"],
    validationRules: ["finance_evidence_required"],
    certificationRequirements: ["finance_analysis_cert"],
    purpose: "Provide financial analysis without moving funds",
    requiredKnowledge: ["accounting_basics", "unit_economics"],
    validationMethod: "finance_peer_review",
    dependencies: ["skill-ops-foundation"],
    prerequisites: ["skill-ops-foundation"],
  }),
  seedSkill({
    skillId: "skill-ops-process",
    skillName: "Process Operations",
    skillCategory: "operations",
    parentSkill: "skill-ops-foundation",
    description: "Run and improve operational processes",
    proficiencyLevel: "intermediate",
    requiredTools: ["ops_runbook"],
    capabilityLimits: ["no_policy_override"],
    validationRules: ["runbook_compliance"],
    certificationRequirements: ["ops_process_cert"],
    purpose: "Operate processes within runbook limits",
    requiredKnowledge: ["process_control", "escalation_paths"],
    validationMethod: "ops_audit",
    dependencies: ["skill-ops-foundation"],
    prerequisites: ["skill-ops-foundation"],
  }),
  seedSkill({
    skillId: "skill-marketing-campaigns",
    skillName: "Marketing Campaigns",
    skillCategory: "marketing",
    parentSkill: "skill-business-strategy",
    description: "Plan and measure marketing campaigns",
    proficiencyLevel: "intermediate",
    requiredTools: ["campaign_planner"],
    capabilityLimits: ["budget_cap_enforced"],
    validationRules: ["campaign_brief_required"],
    certificationRequirements: ["marketing_campaign_cert"],
    purpose: "Execute marketing within approved budget and messaging",
    requiredKnowledge: ["channel_mix", "creative_compliance"],
    validationMethod: "campaign_review",
    dependencies: ["skill-business-strategy"],
    prerequisites: ["skill-business-strategy"],
  }),
  seedSkill({
    skillId: "skill-research-synthesis",
    skillName: "Research Synthesis",
    skillCategory: "research",
    parentSkill: "skill-ops-foundation",
    description: "Gather sources and synthesize research briefs",
    proficiencyLevel: "advanced",
    requiredTools: ["research_notebook"],
    capabilityLimits: ["cited_sources_only"],
    validationRules: ["citation_required"],
    certificationRequirements: ["research_quality_cert"],
    purpose: "Produce evidence-backed research outputs",
    requiredKnowledge: ["source_evaluation", "synthesis"],
    validationMethod: "citation_audit",
    dependencies: ["skill-ops-foundation"],
    prerequisites: ["skill-ops-foundation"],
  }),
  seedSkill({
    skillId: "skill-customer-support-service",
    skillName: "Customer Support Service",
    skillCategory: "customer_support",
    parentSkill: "skill-ops-process",
    description: "Resolve customer issues within support policy",
    proficiencyLevel: "beginner",
    requiredTools: ["support_desk"],
    capabilityLimits: ["no_policy_exception_without_escalation"],
    validationRules: ["response_sla_check"],
    certificationRequirements: ["customer_support_cert"],
    purpose: "Deliver customer support within SLA and policy",
    requiredKnowledge: ["support_policies", "escalation"],
    validationMethod: "qa_sampling",
    dependencies: ["skill-ops-process"],
    prerequisites: ["skill-ops-process"],
  }),
  seedSkill({
    skillId: "skill-analytics-metrics",
    skillName: "Analytics Metrics",
    skillCategory: "analytics",
    parentSkill: "skill-ops-foundation",
    description: "Define and interpret operational metrics",
    proficiencyLevel: "expert",
    requiredTools: ["metrics_warehouse"],
    capabilityLimits: ["no_raw_pii_export"],
    validationRules: ["metric_definition_required"],
    certificationRequirements: ["analytics_cert"],
    purpose: "Produce trustworthy analytics for decisions",
    requiredKnowledge: ["statistics", "metric_governance"],
    validationMethod: "metric_peer_review",
    dependencies: ["skill-ops-foundation"],
    prerequisites: ["skill-ops-foundation"],
  }),
  seedSkill({
    skillId: "skill-security-controls",
    skillName: "Security Controls",
    skillCategory: "security",
    parentSkill: "skill-ops-foundation",
    description: "Apply security controls and escalate risks",
    proficiencyLevel: "expert",
    requiredTools: ["security_scanner"],
    capabilityLimits: ["no_credential_exposure", "no_bypass_controls"],
    validationRules: ["security_checklist"],
    certificationRequirements: ["security_controls_cert"],
    purpose: "Enforce security posture without overriding governance",
    requiredKnowledge: ["threat_basics", "access_control"],
    validationMethod: "security_audit",
    dependencies: ["skill-ops-foundation"],
    prerequisites: ["skill-ops-foundation"],
  }),
];

export type SkillTaxonomyConfiguration = {
  enabled: boolean;
  definitionRulesEnabled: boolean;
  registrationRulesEnabled: boolean;
  derivationRulesEnabled: boolean;
  hierarchyRulesEnabled: boolean;
  proficiencyRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  taxonomyVersion: string;
  skillCategories: string[];
  proficiencyLevels: string[];
  skillRules: string[];
  seedSkills: SkillDefinition[];
  seedDerivationRecords: WorkerSkillBinding[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q1-04 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverReplaceRoleTaxonomy: true;
  neverReplaceWorkforceCapabilityRegistry: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SKILL_TAXONOMY_CONFIGURATION: SkillTaxonomyConfiguration = {
  enabled: true,
  definitionRulesEnabled: true,
  registrationRulesEnabled: true,
  derivationRulesEnabled: true,
  hierarchyRulesEnabled: true,
  proficiencyRulesEnabled: true,
  validationRulesEnabled: true,
  taxonomyVersion: TAXONOMY_VERSION,
  skillCategories: [...SKILL_CATEGORIES],
  proficiencyLevels: [...PROFICIENCY_LEVELS],
  skillRules: [...SKILL_RULES],
  seedSkills: DEFAULT_SEED_SKILLS,
  seedDerivationRecords: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWorkerTasks: true,
  neverReplaceRoleTaxonomy: true,
  neverReplaceWorkforceCapabilityRegistry: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveAuditability: true,
  preserveTraceability: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildSkillTaxonomyConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SkillTaxonomyConfiguration> = {},
): SkillTaxonomyConfiguration {
  let file: Partial<SkillTaxonomyConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "skill-taxonomy.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.SKILL_TAXONOMY_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.SKILL_TAXONOMY_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "skillCategories" | "proficiencyLevels" | "skillRules") =>
    Array.from(
      new Set([
        ...DEFAULT_SKILL_TAXONOMY_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  const cloneSkill = (s: SkillDefinition): SkillDefinition => ({
    ...s,
    requiredTools: [...s.requiredTools],
    capabilityLimits: [...s.capabilityLimits],
    validationRules: [...s.validationRules],
    certificationRequirements: [...s.certificationRequirements],
    requiredKnowledge: [...s.requiredKnowledge],
    dependencies: [...s.dependencies],
    prerequisites: [...s.prerequisites],
    neverExecuteWorkerTasks: true,
    neverReplaceRoleTaxonomy: true,
    neverReplaceWorkforceCapabilityRegistry: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveAuditability: true,
    preserveTraceability: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  });

  return {
    ...DEFAULT_SKILL_TAXONOMY_CONFIGURATION,
    ...file,
    ...overrides,
    skillCategories: mergeList("skillCategories"),
    proficiencyLevels: mergeList("proficiencyLevels"),
    skillRules: mergeList("skillRules"),
    seedSkills: (overrides.seedSkills ?? file.seedSkills ?? DEFAULT_SEED_SKILLS).map(cloneSkill),
    seedDerivationRecords: (
      overrides.seedDerivationRecords ??
      file.seedDerivationRecords ??
      []
    ).map((r) => ({
      ...r,
      skillIds: [...r.skillIds],
      parentChains: { ...r.parentChains },
      proficiencyLevels: { ...r.proficiencyLevels },
      rulesApplied: [...r.rulesApplied],
      rulesSatisfied: [...r.rulesSatisfied],
      rulesFailed: [...r.rulesFailed],
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverReplaceRoleTaxonomy: true,
    neverReplaceWorkforceCapabilityRegistry: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveAuditability: true,
    preserveTraceability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
