import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MATRIX_VERSION,
  RESPONSIBILITY_RULES,
  RMX_METADATA_VERSION,
} from "./paths.js";
import type { ResponsibilityBinding, ResponsibilityDefinition } from "./types.js";

function seedResponsibility(
  partial: Omit<
    ResponsibilityDefinition,
    | "matrixVersion"
    | "metadataVersion"
    | "neverExecuteWorkerTasks"
    | "neverReplaceAuthorityMatrix"
    | "neverReplaceOrganizationCharter"
    | "neverOverridePillow"
    | "neverOverrideGrandKing"
    | "preserveAuditability"
    | "preserveTraceability"
    | "structuralSignalOnly"
    | "maskSensitiveValues"
  >,
): ResponsibilityDefinition {
  return {
    ...partial,
    matrixVersion: MATRIX_VERSION,
    metadataVersion: RMX_METADATA_VERSION,
    neverExecuteWorkerTasks: true,
    neverReplaceAuthorityMatrix: true,
    neverReplaceOrganizationCharter: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveAuditability: true,
    preserveTraceability: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

export const DEFAULT_SEED_RESPONSIBILITIES: ResponsibilityDefinition[] = [
  seedResponsibility({
    responsibilityId: "resp-strategy-briefs",
    responsibilityName: "Strategy Brief Production",
    primaryOwner: "wkr-strategy-01",
    supportingWorkers: ["wkr-research-01"],
    department: "strategy",
    factory: "workforce-factory",
    requiredInputs: ["market_signal", "prior_brief"],
    expectedOutputs: ["strategy_brief", "option_ranking"],
    dependencies: [],
    requiredApprovals: ["manager_approval"],
    successCriteria: ["brief_complete", "options_ranked"],
    failureConditions: ["missing_sources", "uncited_claims"],
    escalationTarget: "manager",
    escalationPath: ["worker", "manager", "pillow"],
    qualityRequirements: ["worker_quality_standard", "citation_required"],
    completionCriteria: ["manager_accepted"],
    purpose: "Produce ranked strategy briefs with accountable ownership",
  }),
  seedResponsibility({
    responsibilityId: "resp-ops-runbook",
    responsibilityName: "Operations Runbook Execution",
    primaryOwner: "wkr-ops-01",
    supportingWorkers: ["wkr-support-01"],
    department: "operations",
    factory: "workforce-factory",
    requiredInputs: ["runbook", "incident_context"],
    expectedOutputs: ["ops_status", "handoff_notes"],
    dependencies: ["resp-strategy-briefs"],
    requiredApprovals: ["department_approval"],
    successCriteria: ["runbook_followed", "status_logged"],
    failureConditions: ["policy_bypass", "missing_handoff"],
    escalationTarget: "department",
    escalationPath: ["worker", "manager", "department", "pillow"],
    qualityRequirements: ["runbook_compliance"],
    completionCriteria: ["department_signoff"],
    purpose: "Execute ops runbooks with clear owner and support",
  }),
  seedResponsibility({
    responsibilityId: "resp-commerce-listings",
    responsibilityName: "Commerce Listing Readiness",
    primaryOwner: "wkr-commerce-01",
    supportingWorkers: ["wkr-media-01", "wkr-ops-01"],
    department: "commerce",
    factory: "commerce-factory",
    requiredInputs: ["product_spec", "inventory_feed"],
    expectedOutputs: ["listing_draft", "readiness_score"],
    dependencies: ["resp-ops-runbook"],
    requiredApprovals: ["factory_approval"],
    successCriteria: ["listing_complete", "policy_compliant"],
    failureConditions: ["price_outside_policy", "missing_inventory"],
    escalationTarget: "factory",
    escalationPath: ["worker", "manager", "factory", "pillow"],
    qualityRequirements: ["listing_quality_gate"],
    completionCriteria: ["factory_approved"],
    purpose: "Own commerce listing readiness with collaboration rules",
  }),
  seedResponsibility({
    responsibilityId: "resp-media-assets",
    responsibilityName: "Media Asset Drafting",
    primaryOwner: "wkr-media-01",
    supportingWorkers: [],
    department: "media",
    factory: "commerce-factory",
    requiredInputs: ["brand_guidelines", "brief"],
    expectedOutputs: ["media_draft"],
    dependencies: ["resp-commerce-listings"],
    requiredApprovals: ["manager_approval"],
    successCriteria: ["brand_compliant"],
    failureConditions: ["unapproved_publish"],
    escalationTarget: "manager",
    escalationPath: ["worker", "manager", "pillow"],
    qualityRequirements: ["brand_compliance_check"],
    completionCriteria: ["manager_review_passed"],
    purpose: "Draft media assets under single owner accountability",
  }),
  seedResponsibility({
    responsibilityId: "resp-finance-analysis",
    responsibilityName: "Financial Analysis Briefs",
    primaryOwner: "wkr-finance-01",
    supportingWorkers: ["wkr-analytics-01"],
    department: "finance",
    factory: "workforce-factory",
    requiredInputs: ["ledger_snapshot", "unit_economics"],
    expectedOutputs: ["finance_brief"],
    dependencies: ["resp-strategy-briefs"],
    requiredApprovals: ["pillow_approval"],
    successCriteria: ["evidence_attached", "no_fund_movement"],
    failureConditions: ["fund_movement_attempt", "missing_evidence"],
    escalationTarget: "pillow",
    escalationPath: ["worker", "director", "pillow", "grand_king"],
    qualityRequirements: ["finance_evidence_required"],
    completionCriteria: ["pillow_acknowledged"],
    purpose: "Own finance analysis without autonomous fund movement",
  }),
  seedResponsibility({
    responsibilityId: "resp-security-review",
    responsibilityName: "Security Control Review",
    primaryOwner: "wkr-security-01",
    supportingWorkers: ["wkr-eng-01"],
    department: "security",
    factory: "workforce-factory",
    requiredInputs: ["control_baseline", "scan_results"],
    expectedOutputs: ["security_findings", "remediation_plan"],
    dependencies: ["resp-ops-runbook"],
    requiredApprovals: ["grand_king_approval"],
    successCriteria: ["findings_documented", "controls_intact"],
    failureConditions: ["control_bypass", "secret_exposure"],
    escalationTarget: "grand_king",
    escalationPath: ["worker", "manager", "pillow", "grand_king"],
    qualityRequirements: ["security_checklist"],
    completionCriteria: ["grand_king_or_pillow_gate"],
    purpose: "Accountable security review with supreme escalation",
  }),
  seedResponsibility({
    responsibilityId: "resp-customer-support",
    responsibilityName: "Customer Support Resolution",
    primaryOwner: "wkr-support-01",
    supportingWorkers: ["wkr-ops-01"],
    department: "customer_support",
    factory: "commerce-factory",
    requiredInputs: ["ticket", "policy_pack"],
    expectedOutputs: ["resolution_note", "customer_reply"],
    dependencies: ["resp-ops-runbook"],
    requiredApprovals: ["manager_approval"],
    successCriteria: ["sla_met", "policy_followed"],
    failureConditions: ["policy_exception_without_escalation"],
    escalationTarget: "manager",
    escalationPath: ["worker", "manager", "department", "pillow"],
    qualityRequirements: ["response_sla_check"],
    completionCriteria: ["ticket_closed"],
    purpose: "Resolve support tickets with clear ownership",
  }),
  seedResponsibility({
    responsibilityId: "resp-engineering-change",
    responsibilityName: "Engineering Change Proposal",
    primaryOwner: "wkr-eng-01",
    supportingWorkers: ["wkr-review-01"],
    department: "engineering",
    factory: "workforce-factory",
    requiredInputs: ["change_request", "test_plan"],
    expectedOutputs: ["change_proposal", "test_evidence"],
    dependencies: ["resp-security-review"],
    requiredApprovals: ["pillow_approval"],
    successCriteria: ["tests_pass", "review_complete"],
    failureConditions: ["production_deploy_without_approval"],
    escalationTarget: "pillow",
    escalationPath: ["worker", "lead", "manager", "pillow"],
    qualityRequirements: ["tests_required", "review_required"],
    completionCriteria: ["pillow_gate_passed"],
    purpose: "Own engineering change proposals under Pillow approval",
  }),
];

export type ResponsibilityMatrixConfiguration = {
  enabled: boolean;
  definitionRulesEnabled: boolean;
  registrationRulesEnabled: boolean;
  derivationRulesEnabled: boolean;
  ownershipRulesEnabled: boolean;
  inputsOutputsRulesEnabled: boolean;
  dependencyRulesEnabled: boolean;
  approvalRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  matrixVersion: string;
  responsibilityRules: string[];
  seedResponsibilities: ResponsibilityDefinition[];
  seedBindings: ResponsibilityBinding[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q1-06 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverReplaceAuthorityMatrix: true;
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

export const DEFAULT_RESPONSIBILITY_MATRIX_CONFIGURATION: ResponsibilityMatrixConfiguration =
  {
    enabled: true,
    definitionRulesEnabled: true,
    registrationRulesEnabled: true,
    derivationRulesEnabled: true,
    ownershipRulesEnabled: true,
    inputsOutputsRulesEnabled: true,
    dependencyRulesEnabled: true,
    approvalRulesEnabled: true,
    validationRulesEnabled: true,
    matrixVersion: MATRIX_VERSION,
    responsibilityRules: [...RESPONSIBILITY_RULES],
    seedResponsibilities: DEFAULT_SEED_RESPONSIBILITIES,
    seedBindings: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverExecuteWorkerTasks: true,
    neverReplaceAuthorityMatrix: true,
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

export function buildResponsibilityMatrixConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ResponsibilityMatrixConfiguration> = {},
): ResponsibilityMatrixConfiguration {
  let file: Partial<ResponsibilityMatrixConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "responsibility-matrix.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.RESPONSIBILITY_MATRIX_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.RESPONSIBILITY_MATRIX_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "responsibilityRules") =>
    Array.from(
      new Set([
        ...DEFAULT_RESPONSIBILITY_MATRIX_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  const cloneResp = (r: ResponsibilityDefinition): ResponsibilityDefinition => ({
    ...r,
    supportingWorkers: [...r.supportingWorkers],
    requiredInputs: [...r.requiredInputs],
    expectedOutputs: [...r.expectedOutputs],
    dependencies: [...r.dependencies],
    requiredApprovals: [...r.requiredApprovals],
    successCriteria: [...r.successCriteria],
    failureConditions: [...r.failureConditions],
    escalationPath: [...r.escalationPath],
    qualityRequirements: [...r.qualityRequirements],
    completionCriteria: [...r.completionCriteria],
    neverExecuteWorkerTasks: true,
    neverReplaceAuthorityMatrix: true,
    neverReplaceOrganizationCharter: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveAuditability: true,
    preserveTraceability: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  });

  return {
    ...DEFAULT_RESPONSIBILITY_MATRIX_CONFIGURATION,
    ...file,
    ...overrides,
    responsibilityRules: mergeList("responsibilityRules"),
    seedResponsibilities: (
      overrides.seedResponsibilities ??
      file.seedResponsibilities ??
      DEFAULT_SEED_RESPONSIBILITIES
    ).map(cloneResp),
    seedBindings: (overrides.seedBindings ?? file.seedBindings ?? []).map((b) => ({
      ...b,
      responsibilityIds: [...b.responsibilityIds],
      ownerMap: { ...b.ownerMap },
      rulesApplied: [...b.rulesApplied],
      rulesSatisfied: [...b.rulesSatisfied],
      rulesFailed: [...b.rulesFailed],
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverReplaceAuthorityMatrix: true,
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
