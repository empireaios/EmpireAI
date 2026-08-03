import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ROLE_CATEGORIES,
  ROLE_RULES,
  RTX_METADATA_VERSION,
  TAXONOMY_VERSION,
} from "./paths.js";
import type { RoleDefinition, RoleInheritanceBinding } from "./types.js";

function seedRole(
  partial: Omit<
    RoleDefinition,
    | "taxonomyVersion"
    | "metadataVersion"
    | "neverExecuteWorkerTasks"
    | "neverReplaceOrganizationCharter"
    | "neverReplaceWorkerConstitution"
    | "neverOverridePillow"
    | "neverOverrideGrandKing"
    | "preserveAuditability"
    | "preserveTraceability"
    | "structuralSignalOnly"
    | "maskSensitiveValues"
  >,
): RoleDefinition {
  return {
    ...partial,
    taxonomyVersion: TAXONOMY_VERSION,
    metadataVersion: RTX_METADATA_VERSION,
    neverExecuteWorkerTasks: true,
    neverReplaceOrganizationCharter: true,
    neverReplaceWorkerConstitution: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveAuditability: true,
    preserveTraceability: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

export const DEFAULT_SEED_ROLES: RoleDefinition[] = [
  seedRole({
    roleId: "role-system-base",
    roleName: "System Base Worker",
    roleCategory: "system",
    parentRole: null,
    purpose: "Foundational system role inherited by all workers",
    responsibilities: ["preserve_traceability", "remain_governed_by_pillow"],
    authorityLevel: "worker",
    reportingRelationship: "department",
    collaborationRules: ["use_approved_messaging_channels"],
    escalationRules: ["escalate_beyond_authority"],
    governanceRules: ["pillow_governance", "worker_constitution"],
    decisionAuthority: ["recommend_within_scope"],
    escalationAuthority: ["escalate_to_lead"],
    requiredSkills: ["structured_reporting"],
    requiredQualityStandard: "worker_quality_standard",
    roleKind: "standard",
  }),
  seedRole({
    roleId: "role-executive-chief",
    roleName: "Executive Chief Agent",
    roleCategory: "executive",
    parentRole: "role-system-base",
    purpose: "Executive coordination under Pillow authority",
    responsibilities: ["executive_direction", "cross_factory_alignment"],
    authorityLevel: "executive",
    reportingRelationship: "pillow",
    collaborationRules: ["executive_command_coordination"],
    escalationRules: ["escalate_to_pillow"],
    governanceRules: ["pillow_governance", "executive_audit"],
    decisionAuthority: ["recommend_executive_actions"],
    escalationAuthority: ["escalate_to_pillow"],
    requiredSkills: ["executive_reasoning", "governance_compliance"],
    requiredQualityStandard: "worker_quality_standard",
    roleKind: "standard",
  }),
  seedRole({
    roleId: "role-director-operations",
    roleName: "Operations Director",
    roleCategory: "director",
    parentRole: "role-executive-chief",
    purpose: "Direct factory-level operational outcomes",
    responsibilities: ["factory_oversight", "director_reporting"],
    authorityLevel: "director",
    reportingRelationship: "executive",
    collaborationRules: ["cross_department_alignment"],
    escalationRules: ["escalate_to_executive"],
    governanceRules: ["pillow_governance", "organization_charter"],
    decisionAuthority: ["approve_within_factory_scope"],
    escalationAuthority: ["escalate_to_executive"],
    requiredSkills: ["operations_leadership"],
    requiredQualityStandard: "worker_quality_standard",
    roleKind: "standard",
  }),
  seedRole({
    roleId: "role-manager-department",
    roleName: "Department Manager",
    roleCategory: "manager",
    parentRole: "role-director-operations",
    purpose: "Manage department mission delivery",
    responsibilities: ["department_planning", "resource_assignment"],
    authorityLevel: "manager",
    reportingRelationship: "director",
    collaborationRules: ["department_coordination"],
    escalationRules: ["escalate_to_director"],
    governanceRules: ["pillow_governance", "organization_charter"],
    decisionAuthority: ["assign_department_work"],
    escalationAuthority: ["escalate_to_director"],
    requiredSkills: ["team_management"],
    requiredQualityStandard: "worker_quality_standard",
    roleKind: "standard",
  }),
  seedRole({
    roleId: "role-lead-team",
    roleName: "Team Lead",
    roleCategory: "lead",
    parentRole: "role-manager-department",
    purpose: "Lead specialist delivery cells",
    responsibilities: ["task_sequencing", "peer_guidance"],
    authorityLevel: "lead",
    reportingRelationship: "manager",
    collaborationRules: ["lead_specialist_collaboration"],
    escalationRules: ["escalate_to_manager"],
    governanceRules: ["pillow_governance"],
    decisionAuthority: ["prioritize_team_tasks"],
    escalationAuthority: ["escalate_to_manager"],
    requiredSkills: ["facilitation"],
    requiredQualityStandard: "worker_quality_standard",
    roleKind: "standard",
  }),
  seedRole({
    roleId: "role-specialist-domain",
    roleName: "Domain Specialist",
    roleCategory: "specialist",
    parentRole: "role-lead-team",
    purpose: "Execute specialized domain work",
    responsibilities: ["domain_execution", "evidence_production"],
    authorityLevel: "specialist",
    reportingRelationship: "lead",
    collaborationRules: ["specialist_peer_exchange"],
    escalationRules: ["escalate_to_lead"],
    governanceRules: ["pillow_governance", "approved_tools_only"],
    decisionAuthority: ["decide_within_specialist_scope"],
    escalationAuthority: ["escalate_to_lead"],
    requiredSkills: ["domain_expertise"],
    requiredQualityStandard: "worker_quality_standard",
    roleKind: "standard",
  }),
  seedRole({
    roleId: "role-reviewer-peer",
    roleName: "Peer Reviewer",
    roleCategory: "reviewer",
    parentRole: "role-system-base",
    purpose: "Review peer outputs before executive acceptance",
    responsibilities: ["peer_review", "quality_challenge"],
    authorityLevel: "reviewer",
    reportingRelationship: "manager",
    collaborationRules: ["independent_review_separation"],
    escalationRules: ["escalate_review_conflicts"],
    governanceRules: ["peer_review_runtime", "pillow_governance"],
    decisionAuthority: ["approve_or_reject_peer_output"],
    escalationAuthority: ["escalate_to_manager"],
    requiredSkills: ["critical_review"],
    requiredQualityStandard: "worker_quality_standard",
    roleKind: "shared",
  }),
  seedRole({
    roleId: "role-analyst-strategy",
    roleName: "Strategy Analyst",
    roleCategory: "analyst",
    parentRole: "role-specialist-domain",
    purpose: "Analyze strategic options and produce briefs",
    responsibilities: ["strategic_analysis", "option_ranking"],
    authorityLevel: "analyst",
    reportingRelationship: "lead",
    collaborationRules: ["analyst_specialist_handoff"],
    escalationRules: ["escalate_to_lead"],
    governanceRules: ["pillow_governance", "self_critique_required"],
    decisionAuthority: ["recommend_strategic_options"],
    escalationAuthority: ["escalate_to_lead"],
    requiredSkills: ["analysis", "structured_reasoning"],
    requiredQualityStandard: "worker_quality_standard",
    roleKind: "standard",
  }),
  seedRole({
    roleId: "role-coordinator-mission",
    roleName: "Mission Coordinator",
    roleCategory: "coordinator",
    parentRole: "role-manager-department",
    purpose: "Coordinate multi-worker mission execution",
    responsibilities: ["mission_coordination", "dependency_tracking"],
    authorityLevel: "coordinator",
    reportingRelationship: "manager",
    collaborationRules: ["cross_functional_coordination"],
    escalationRules: ["escalate_blocked_missions"],
    governanceRules: ["mission_coordination_engine", "pillow_governance"],
    decisionAuthority: ["sequence_mission_work"],
    escalationAuthority: ["escalate_to_manager"],
    requiredSkills: ["coordination"],
    requiredQualityStandard: "worker_quality_standard",
    roleKind: "cross_functional",
  }),
  seedRole({
    roleId: "role-support-ops",
    roleName: "Operations Support",
    roleCategory: "support",
    parentRole: "role-system-base",
    purpose: "Provide operational support to production workers",
    responsibilities: ["support_handoffs", "status_tracking"],
    authorityLevel: "support",
    reportingRelationship: "coordinator",
    collaborationRules: ["support_channel_discipline"],
    escalationRules: ["escalate_to_coordinator"],
    governanceRules: ["pillow_governance"],
    decisionAuthority: ["recommend_support_actions"],
    escalationAuthority: ["escalate_to_coordinator"],
    requiredSkills: ["operations_support"],
    requiredQualityStandard: "worker_quality_standard",
    roleKind: "temporary",
  }),
];

export type RoleTaxonomyConfiguration = {
  enabled: boolean;
  definitionRulesEnabled: boolean;
  registrationRulesEnabled: boolean;
  inheritanceRulesEnabled: boolean;
  reportingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  taxonomyVersion: string;
  roleCategories: string[];
  roleRules: string[];
  seedRoles: RoleDefinition[];
  seedInheritanceRecords: RoleInheritanceBinding[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q1-03 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverReplaceOrganizationCharter: true;
  neverReplaceWorkerConstitution: true;
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

export const DEFAULT_ROLE_TAXONOMY_CONFIGURATION: RoleTaxonomyConfiguration = {
  enabled: true,
  definitionRulesEnabled: true,
  registrationRulesEnabled: true,
  inheritanceRulesEnabled: true,
  reportingRulesEnabled: true,
  validationRulesEnabled: true,
  taxonomyVersion: TAXONOMY_VERSION,
  roleCategories: [...ROLE_CATEGORIES],
  roleRules: [...ROLE_RULES],
  seedRoles: DEFAULT_SEED_ROLES,
  seedInheritanceRecords: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWorkerTasks: true,
  neverReplaceOrganizationCharter: true,
  neverReplaceWorkerConstitution: true,
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

export function buildRoleTaxonomyConfiguration(
  repositoryRoot?: string,
  overrides: Partial<RoleTaxonomyConfiguration> = {},
): RoleTaxonomyConfiguration {
  let file: Partial<RoleTaxonomyConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "role-taxonomy.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.ROLE_TAXONOMY_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.ROLE_TAXONOMY_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "roleCategories" | "roleRules") =>
    Array.from(
      new Set([
        ...DEFAULT_ROLE_TAXONOMY_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  const cloneRole = (r: RoleDefinition): RoleDefinition => ({
    ...r,
    responsibilities: [...r.responsibilities],
    collaborationRules: [...r.collaborationRules],
    escalationRules: [...r.escalationRules],
    governanceRules: [...r.governanceRules],
    decisionAuthority: [...r.decisionAuthority],
    escalationAuthority: [...r.escalationAuthority],
    requiredSkills: [...r.requiredSkills],
    neverExecuteWorkerTasks: true,
    neverReplaceOrganizationCharter: true,
    neverReplaceWorkerConstitution: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveAuditability: true,
    preserveTraceability: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  });

  return {
    ...DEFAULT_ROLE_TAXONOMY_CONFIGURATION,
    ...file,
    ...overrides,
    roleCategories: mergeList("roleCategories"),
    roleRules: mergeList("roleRules"),
    seedRoles: (overrides.seedRoles ?? file.seedRoles ?? DEFAULT_SEED_ROLES).map(cloneRole),
    seedInheritanceRecords: (
      overrides.seedInheritanceRecords ??
      file.seedInheritanceRecords ??
      []
    ).map((r) => ({
      ...r,
      parentChain: [...r.parentChain],
      rulesApplied: [...r.rulesApplied],
      rulesSatisfied: [...r.rulesSatisfied],
      rulesFailed: [...r.rulesFailed],
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverReplaceOrganizationCharter: true,
    neverReplaceWorkerConstitution: true,
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
