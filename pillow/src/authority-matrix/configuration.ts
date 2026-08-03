import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AMX_METADATA_VERSION,
  AUTHORITY_LEVELS,
  AUTHORITY_RULES,
  DECISION_CATEGORIES,
  MATRIX_VERSION,
} from "./paths.js";
import type { AuthorityBinding, AuthorityRuleDefinition } from "./types.js";

function seedRule(
  partial: Omit<
    AuthorityRuleDefinition,
    | "matrixVersion"
    | "metadataVersion"
    | "neverExecuteWorkerTasks"
    | "neverReplaceApprovalRouter"
    | "neverReplaceOrganizationCharter"
    | "neverOverridePillow"
    | "neverOverrideGrandKing"
    | "preserveAuditability"
    | "preserveTraceability"
    | "structuralSignalOnly"
    | "maskSensitiveValues"
  >,
): AuthorityRuleDefinition {
  return {
    ...partial,
    matrixVersion: MATRIX_VERSION,
    metadataVersion: AMX_METADATA_VERSION,
    neverExecuteWorkerTasks: true,
    neverReplaceApprovalRouter: true,
    neverReplaceOrganizationCharter: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveAuditability: true,
    preserveTraceability: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

export const DEFAULT_SEED_RULES: AuthorityRuleDefinition[] = [
  seedRule({
    authorityId: "auth-base-information",
    decisionCategory: "information_retrieval",
    workerRole: "specialist",
    permittedActions: ["query_approved_sources", "summarize_findings"],
    restrictedActions: ["exfiltrate_credentials", "bypass_access_controls"],
    requiredApproval: "autonomous_worker_decision",
    escalationTarget: "manager",
    riskClassification: "low",
    whoMayPerform: ["specialist", "analyst", "lead"],
    approvalRequired: false,
    maximumAuthority: "autonomous_worker_decision",
    escalationPath: ["worker", "manager", "pillow"],
    riskLevel: "low",
    auditRequirements: ["log_query_scope"],
    parentAuthority: null,
    purpose: "Allow autonomous retrieval within approved sources",
  }),
  seedRule({
    authorityId: "auth-planning",
    decisionCategory: "planning",
    workerRole: "lead",
    permittedActions: ["draft_plan", "sequence_tasks"],
    restrictedActions: ["commit_resources", "approve_budget"],
    requiredApproval: "manager_approval",
    escalationTarget: "manager",
    riskClassification: "medium",
    whoMayPerform: ["lead", "manager", "coordinator"],
    approvalRequired: true,
    maximumAuthority: "manager_approval",
    escalationPath: ["lead", "manager", "department", "pillow"],
    riskLevel: "medium",
    auditRequirements: ["plan_evidence", "approval_trace"],
    parentAuthority: "auth-base-information",
    purpose: "Plan work with manager approval before commitment",
  }),
  seedRule({
    authorityId: "auth-business-ops",
    decisionCategory: "business_operations",
    workerRole: "manager",
    permittedActions: ["assign_department_work", "update_status"],
    restrictedActions: ["change_org_structure", "override_charter"],
    requiredApproval: "department_approval",
    escalationTarget: "department",
    riskClassification: "medium",
    whoMayPerform: ["manager", "director"],
    approvalRequired: true,
    maximumAuthority: "department_approval",
    escalationPath: ["manager", "department", "factory", "pillow"],
    riskLevel: "medium",
    auditRequirements: ["ops_change_log"],
    parentAuthority: "auth-planning",
    purpose: "Authorize department business operations within charter",
  }),
  seedRule({
    authorityId: "auth-financial",
    decisionCategory: "financial_decisions",
    workerRole: "director",
    permittedActions: ["recommend_spend", "analyze_unit_economics"],
    restrictedActions: ["move_funds", "open_credit_lines"],
    requiredApproval: "pillow_approval",
    escalationTarget: "pillow",
    riskClassification: "high",
    whoMayPerform: ["director", "executive"],
    approvalRequired: true,
    maximumAuthority: "pillow_approval",
    escalationPath: ["director", "factory", "pillow", "grand_king"],
    riskLevel: "high",
    auditRequirements: ["finance_evidence", "pillow_approval_record"],
    parentAuthority: "auth-business-ops",
    purpose: "Financial decisions require Pillow; funds never move autonomously",
  }),
  seedRule({
    authorityId: "auth-marketplace",
    decisionCategory: "marketplace_actions",
    workerRole: "specialist",
    permittedActions: ["update_listing_draft", "check_inventory"],
    restrictedActions: ["publish_price_outside_policy", "cancel_orders_bulk"],
    requiredApproval: "factory_approval",
    escalationTarget: "factory",
    riskClassification: "high",
    whoMayPerform: ["specialist", "manager"],
    approvalRequired: true,
    maximumAuthority: "factory_approval",
    escalationPath: ["specialist", "manager", "factory", "pillow"],
    riskLevel: "high",
    auditRequirements: ["marketplace_change_log"],
    parentAuthority: "auth-business-ops",
    purpose: "Marketplace actions escalate to factory before go-live",
  }),
  seedRule({
    authorityId: "auth-media",
    decisionCategory: "media_publishing",
    workerRole: "specialist",
    permittedActions: ["draft_asset", "request_brand_review"],
    restrictedActions: ["publish_unreviewed", "alter_brand_marks"],
    requiredApproval: "manager_approval",
    escalationTarget: "manager",
    riskClassification: "medium",
    whoMayPerform: ["specialist", "lead"],
    approvalRequired: true,
    maximumAuthority: "manager_approval",
    escalationPath: ["specialist", "manager", "pillow"],
    riskLevel: "medium",
    auditRequirements: ["brand_review_trace"],
    parentAuthority: "auth-base-information",
    purpose: "Media publishing requires manager brand approval",
  }),
  seedRule({
    authorityId: "auth-infrastructure",
    decisionCategory: "infrastructure_changes",
    workerRole: "specialist",
    permittedActions: ["propose_change", "run_dry_run"],
    restrictedActions: ["deploy_production", "alter_security_groups"],
    requiredApproval: "pillow_approval",
    escalationTarget: "pillow",
    riskClassification: "critical",
    whoMayPerform: ["specialist", "lead", "manager"],
    approvalRequired: true,
    maximumAuthority: "pillow_approval",
    escalationPath: ["specialist", "manager", "factory", "pillow"],
    riskLevel: "critical",
    auditRequirements: ["change_ticket", "pillow_gate"],
    parentAuthority: "auth-planning",
    purpose: "Infrastructure changes always require Pillow approval",
  }),
  seedRule({
    authorityId: "auth-security",
    decisionCategory: "security",
    workerRole: "reviewer",
    permittedActions: ["scan", "recommend_controls"],
    restrictedActions: ["disable_controls", "expose_secrets"],
    requiredApproval: "grand_king_approval",
    escalationTarget: "grand_king",
    riskClassification: "critical",
    whoMayPerform: ["reviewer", "specialist", "executive"],
    approvalRequired: true,
    maximumAuthority: "grand_king_approval",
    escalationPath: ["reviewer", "manager", "pillow", "grand_king"],
    riskLevel: "critical",
    auditRequirements: ["security_audit", "grand_king_gate"],
    parentAuthority: "auth-infrastructure",
    purpose: "Critical security exceptions require Grand King approval",
  }),
  seedRule({
    authorityId: "auth-data",
    decisionCategory: "data_management",
    workerRole: "analyst",
    permittedActions: ["query_metrics", "export_aggregated"],
    restrictedActions: ["export_raw_pii", "delete_production_data"],
    requiredApproval: "department_approval",
    escalationTarget: "department",
    riskClassification: "high",
    whoMayPerform: ["analyst", "specialist"],
    approvalRequired: true,
    maximumAuthority: "department_approval",
    escalationPath: ["analyst", "department", "pillow"],
    riskLevel: "high",
    auditRequirements: ["data_access_log"],
    parentAuthority: "auth-base-information",
    purpose: "Data management stays within department policy",
  }),
  seedRule({
    authorityId: "auth-customer",
    decisionCategory: "customer_communications",
    workerRole: "support",
    permittedActions: ["reply_within_policy", "escalate_ticket"],
    restrictedActions: ["grant_policy_exception", "issue_refunds_above_cap"],
    requiredApproval: "manager_approval",
    escalationTarget: "manager",
    riskClassification: "medium",
    whoMayPerform: ["support", "coordinator"],
    approvalRequired: true,
    maximumAuthority: "manager_approval",
    escalationPath: ["support", "manager", "department", "pillow"],
    riskLevel: "medium",
    auditRequirements: ["support_transcript_log"],
    parentAuthority: "auth-base-information",
    purpose: "Customer communications follow policy with manager escalation",
  }),
  seedRule({
    authorityId: "auth-external",
    decisionCategory: "external_integrations",
    workerRole: "specialist",
    permittedActions: ["propose_integration", "test_sandbox"],
    restrictedActions: ["connect_production_secrets", "grant_partner_access"],
    requiredApproval: "pillow_approval",
    escalationTarget: "pillow",
    riskClassification: "critical",
    whoMayPerform: ["specialist", "manager", "director"],
    approvalRequired: true,
    maximumAuthority: "pillow_approval",
    escalationPath: ["specialist", "factory", "pillow", "grand_king"],
    riskLevel: "critical",
    auditRequirements: ["integration_risk_review", "pillow_gate"],
    parentAuthority: "auth-infrastructure",
    purpose: "External integrations require Pillow; secrets never auto-connected",
  }),
  seedRule({
    authorityId: "auth-pillow-executive",
    decisionCategory: "business_operations",
    workerRole: "executive",
    permittedActions: ["approve_factory_actions", "route_to_grand_king"],
    restrictedActions: ["override_grand_king", "disable_authority_matrix"],
    requiredApproval: "pillow_approval",
    escalationTarget: "grand_king",
    riskClassification: "high",
    whoMayPerform: ["pillow"],
    approvalRequired: false,
    maximumAuthority: "pillow_approval",
    escalationPath: ["pillow", "grand_king"],
    riskLevel: "high",
    auditRequirements: ["executive_decision_log"],
    parentAuthority: "auth-business-ops",
    purpose: "Pillow is executive authority under Grand King",
  }),
  seedRule({
    authorityId: "auth-grand-king-supreme",
    decisionCategory: "security",
    workerRole: "executive",
    permittedActions: ["approve_critical_exceptions", "set_supreme_policy"],
    restrictedActions: ["none_above_grand_king"],
    requiredApproval: "grand_king_approval",
    escalationTarget: "grand_king",
    riskClassification: "critical",
    whoMayPerform: ["grand_king"],
    approvalRequired: false,
    maximumAuthority: "grand_king_approval",
    escalationPath: ["grand_king"],
    riskLevel: "critical",
    auditRequirements: ["supreme_audit_trail"],
    parentAuthority: "auth-pillow-executive",
    purpose: "Grand King is supreme authority for critical exceptions",
  }),
];

export type AuthorityMatrixConfiguration = {
  enabled: boolean;
  definitionRulesEnabled: boolean;
  registrationRulesEnabled: boolean;
  derivationRulesEnabled: boolean;
  workerAuthorityRulesEnabled: boolean;
  pillowAuthorityRulesEnabled: boolean;
  grandKingAuthorityRulesEnabled: boolean;
  approvalRoutingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  matrixVersion: string;
  authorityLevels: string[];
  decisionCategories: string[];
  authorityRules: string[];
  seedRules: AuthorityRuleDefinition[];
  seedBindings: AuthorityBinding[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q1-05 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverReplaceApprovalRouter: true;
  neverReplaceOrganizationCharter: true;
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

export const DEFAULT_AUTHORITY_MATRIX_CONFIGURATION: AuthorityMatrixConfiguration = {
  enabled: true,
  definitionRulesEnabled: true,
  registrationRulesEnabled: true,
  derivationRulesEnabled: true,
  workerAuthorityRulesEnabled: true,
  pillowAuthorityRulesEnabled: true,
  grandKingAuthorityRulesEnabled: true,
  approvalRoutingRulesEnabled: true,
  validationRulesEnabled: true,
  matrixVersion: MATRIX_VERSION,
  authorityLevels: [...AUTHORITY_LEVELS],
  decisionCategories: [...DECISION_CATEGORIES],
  authorityRules: [...AUTHORITY_RULES],
  seedRules: DEFAULT_SEED_RULES,
  seedBindings: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWorkerTasks: true,
  neverReplaceApprovalRouter: true,
  neverReplaceOrganizationCharter: true,
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

export function buildAuthorityMatrixConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AuthorityMatrixConfiguration> = {},
): AuthorityMatrixConfiguration {
  let file: Partial<AuthorityMatrixConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "authority-matrix.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.AUTHORITY_MATRIX_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.AUTHORITY_MATRIX_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "authorityLevels" | "decisionCategories" | "authorityRules") =>
    Array.from(
      new Set([
        ...DEFAULT_AUTHORITY_MATRIX_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  const cloneRule = (r: AuthorityRuleDefinition): AuthorityRuleDefinition => ({
    ...r,
    permittedActions: [...r.permittedActions],
    restrictedActions: [...r.restrictedActions],
    whoMayPerform: [...r.whoMayPerform],
    escalationPath: [...r.escalationPath],
    auditRequirements: [...r.auditRequirements],
    neverExecuteWorkerTasks: true,
    neverReplaceApprovalRouter: true,
    neverReplaceOrganizationCharter: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveAuditability: true,
    preserveTraceability: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  });

  return {
    ...DEFAULT_AUTHORITY_MATRIX_CONFIGURATION,
    ...file,
    ...overrides,
    authorityLevels: mergeList("authorityLevels"),
    decisionCategories: mergeList("decisionCategories"),
    authorityRules: mergeList("authorityRules"),
    seedRules: (overrides.seedRules ?? file.seedRules ?? DEFAULT_SEED_RULES).map(cloneRule),
    seedBindings: (overrides.seedBindings ?? file.seedBindings ?? []).map((b) => ({
      ...b,
      authorityIds: [...b.authorityIds],
      parentChains: { ...b.parentChains },
      rulesApplied: [...b.rulesApplied],
      rulesSatisfied: [...b.rulesSatisfied],
      rulesFailed: [...b.rulesFailed],
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverReplaceApprovalRouter: true,
    neverReplaceOrganizationCharter: true,
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
