import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { OPBK_METADATA_VERSION, PLAYBOOK_CATEGORIES } from "./paths.js";
import type { PlaybookRecord } from "./types.js";

export type OperationalPlaybookEngineConfiguration = {
  enabled: boolean;
  playbookRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  supportedCategories: string[];
  seedPlaybooks: PlaybookRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-15 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkers: true;
  neverReplaceWorkforceOrchestrator: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preservePlaybookTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_PLAYBOOKS: PlaybookRecord[] = [
  {
    playbookId: "opbk-biz-intake-001",
    version: "1.0.0",
    category: "business",
    name: "Business Intake Standardization",
    purpose: "Standardize executive intake for new business initiatives",
    preconditions: ["intent_documented", "pillow_approval"],
    executionSteps: [
      { stepId: "s1", order: 1, action: "Capture executive intent", requiredCapability: "intent_decomposition", requiredTool: "mission_planner" },
      { stepId: "s2", order: 2, action: "Validate business context", requiredCapability: "priority_framing", requiredTool: "repository_reader" },
      { stepId: "s3", order: 3, action: "Package intake for workforce routing", requiredCapability: "option_synthesis", requiredTool: "mission_planner" },
    ],
    requiredCapabilities: ["intent_decomposition", "priority_framing", "option_synthesis"],
    requiredTools: ["mission_planner", "repository_reader"],
    approvalRequirements: ["pillow_approval"],
    successCriteria: ["intent_captured", "context_validated"],
    failureCriteria: ["missing_intent", "approval_absent"],
    metadataVersion: OPBK_METADATA_VERSION,
    approved: true,
    active: true,
  },
  {
    playbookId: "opbk-mktplace-listing-001",
    version: "1.1.0",
    category: "marketplace",
    name: "Marketplace Listing Launch",
    purpose: "Execute approved marketplace listing launch procedure",
    preconditions: ["listing_draft_ready", "compliance_cleared"],
    executionSteps: [
      { stepId: "s1", order: 1, action: "Validate listing assets", requiredCapability: "requirements_structuring", requiredTool: "mission_planner" },
      { stepId: "s2", order: 2, action: "Run compliance checks", requiredCapability: "policy_checks", requiredTool: "policy_checker" },
      { stepId: "s3", order: 3, action: "Prepare launch handoff", requiredCapability: "process_coordination", requiredTool: "metrics_console" },
    ],
    requiredCapabilities: ["requirements_structuring", "policy_checks", "process_coordination"],
    requiredTools: ["mission_planner", "policy_checker", "metrics_console"],
    approvalRequirements: ["pillow_approval", "compliance_clearance"],
    successCriteria: ["assets_valid", "compliance_pass"],
    failureCriteria: ["policy_fail", "assets_incomplete"],
    metadataVersion: OPBK_METADATA_VERSION,
    approved: true,
    active: true,
  },
  {
    playbookId: "opbk-mktg-campaign-001",
    version: "1.0.0",
    category: "marketing",
    name: "Marketing Campaign Activation",
    purpose: "Activate an approved marketing campaign playbook",
    preconditions: ["campaign_brief_approved", "budget_confirmed"],
    executionSteps: [
      { stepId: "s1", order: 1, action: "Confirm campaign brief", requiredCapability: "roadmap_alignment", requiredTool: "mission_planner" },
      { stepId: "s2", order: 2, action: "Validate budget envelope", requiredCapability: "budget_alignment", requiredTool: "finance_ledger" },
      { stepId: "s3", order: 3, action: "Prepare activation workflow", requiredCapability: "process_coordination", requiredTool: "metrics_console" },
    ],
    requiredCapabilities: ["roadmap_alignment", "budget_alignment", "process_coordination"],
    requiredTools: ["mission_planner", "finance_ledger", "metrics_console"],
    approvalRequirements: ["pillow_approval", "finance_signoff"],
    successCriteria: ["brief_confirmed", "budget_valid"],
    failureCriteria: ["budget_exceeded", "brief_incomplete"],
    metadataVersion: OPBK_METADATA_VERSION,
    approved: true,
    active: true,
  },
  {
    playbookId: "opbk-fin-close-001",
    version: "1.0.0",
    category: "finance",
    name: "Finance Close Checklist",
    purpose: "Run finance close playbook with controlled approvals",
    preconditions: ["period_ended", "ledger_available"],
    executionSteps: [
      { stepId: "s1", order: 1, action: "Reconcile ledger signals", requiredCapability: "cost_estimation", requiredTool: "finance_ledger" },
      { stepId: "s2", order: 2, action: "Validate variance thresholds", requiredCapability: "budget_alignment", requiredTool: "metrics_console" },
      { stepId: "s3", order: 3, action: "Prepare close package", requiredCapability: "value_tracking", requiredTool: "finance_ledger" },
    ],
    requiredCapabilities: ["cost_estimation", "budget_alignment", "value_tracking"],
    requiredTools: ["finance_ledger", "metrics_console"],
    approvalRequirements: ["pillow_approval", "grand_king_approval"],
    successCriteria: ["ledger_reconciled", "variances_explained"],
    failureCriteria: ["unexplained_variance", "approval_missing"],
    metadataVersion: OPBK_METADATA_VERSION,
    approved: true,
    active: true,
  },
  {
    playbookId: "opbk-ops-incident-001",
    version: "2.0.0",
    category: "operations",
    name: "Operations Incident Stabilization",
    purpose: "Stabilize operational incidents through approved SOP steps",
    preconditions: ["incident_declared", "oncall_available"],
    executionSteps: [
      { stepId: "s1", order: 1, action: "Triage incident scope", requiredCapability: "runtime_monitoring", requiredTool: "metrics_console" },
      { stepId: "s2", order: 2, action: "Coordinate stabilization handoff", requiredCapability: "process_coordination", requiredTool: "mission_planner" },
      { stepId: "s3", order: 3, action: "Record stabilization progress", requiredCapability: "handoff_management", requiredTool: "repository_reader" },
    ],
    requiredCapabilities: ["runtime_monitoring", "process_coordination", "handoff_management"],
    requiredTools: ["metrics_console", "mission_planner", "repository_reader"],
    approvalRequirements: ["pillow_approval"],
    successCriteria: ["scope_triaged", "handoff_complete"],
    failureCriteria: ["scope_unknown", "handoff_failed"],
    metadataVersion: OPBK_METADATA_VERSION,
    approved: true,
    active: true,
  },
  {
    playbookId: "opbk-rec-recovery-001",
    version: "1.0.0",
    category: "recovery",
    name: "Service Recovery Playbook",
    purpose: "Recover degraded services using approved recovery SOP",
    preconditions: ["degradation_confirmed", "recovery_window_open"],
    executionSteps: [
      { stepId: "s1", order: 1, action: "Confirm degradation evidence", requiredCapability: "signal_analysis", requiredTool: "metrics_console" },
      { stepId: "s2", order: 2, action: "Select recovery path", requiredCapability: "risk_controls", requiredTool: "policy_checker" },
      { stepId: "s3", order: 3, action: "Prepare recovery workflow", requiredCapability: "process_coordination", requiredTool: "mission_planner" },
    ],
    requiredCapabilities: ["signal_analysis", "risk_controls", "process_coordination"],
    requiredTools: ["metrics_console", "policy_checker", "mission_planner"],
    approvalRequirements: ["pillow_approval"],
    successCriteria: ["evidence_confirmed", "recovery_path_selected"],
    failureCriteria: ["evidence_missing", "path_unresolved"],
    metadataVersion: OPBK_METADATA_VERSION,
    approved: true,
    active: true,
  },
  {
    playbookId: "opbk-emg-emergency-001",
    version: "1.0.0",
    category: "emergency",
    name: "Emergency Containment Playbook",
    purpose: "Contain emergency conditions with elevated approvals",
    preconditions: ["emergency_declared", "grand_king_notified"],
    executionSteps: [
      { stepId: "s1", order: 1, action: "Contain blast radius", requiredCapability: "threat_review", requiredTool: "security_scanner" },
      { stepId: "s2", order: 2, action: "Enforce emergency controls", requiredCapability: "control_verification", requiredTool: "policy_checker" },
      { stepId: "s3", order: 3, action: "Prepare executive escalation package", requiredCapability: "secure_handoff", requiredTool: "repository_reader" },
    ],
    requiredCapabilities: ["threat_review", "control_verification", "secure_handoff"],
    requiredTools: ["security_scanner", "policy_checker", "repository_reader"],
    approvalRequirements: ["grand_king_approval"],
    successCriteria: ["contained", "controls_enforced"],
    failureCriteria: ["containment_failed", "approval_missing"],
    metadataVersion: OPBK_METADATA_VERSION,
    approved: true,
    active: true,
  },
  {
    playbookId: "opbk-cs-support-001",
    version: "1.0.0",
    category: "customer_service",
    name: "Customer Service Escalation Playbook",
    purpose: "Handle customer escalations with standardized response steps",
    preconditions: ["ticket_opened", "customer_identified"],
    executionSteps: [
      { stepId: "s1", order: 1, action: "Classify escalation severity", requiredCapability: "requirements_structuring", requiredTool: "mission_planner" },
      { stepId: "s2", order: 2, action: "Prepare response path", requiredCapability: "process_coordination", requiredTool: "metrics_console" },
      { stepId: "s3", order: 3, action: "Record closure criteria", requiredCapability: "handoff_management", requiredTool: "repository_reader" },
    ],
    requiredCapabilities: ["requirements_structuring", "process_coordination", "handoff_management"],
    requiredTools: ["mission_planner", "metrics_console", "repository_reader"],
    approvalRequirements: ["pillow_approval"],
    successCriteria: ["severity_classified", "response_ready"],
    failureCriteria: ["unclassified", "response_blocked"],
    metadataVersion: OPBK_METADATA_VERSION,
    approved: true,
    active: true,
  },
];

export const DEFAULT_OPERATIONAL_PLAYBOOK_ENGINE_CONFIGURATION: OperationalPlaybookEngineConfiguration = {
  enabled: true,
  playbookRulesEnabled: true,
  validationRulesEnabled: true,
  supportedCategories: [...PLAYBOOK_CATEGORIES],
  seedPlaybooks: DEFAULT_SEED_PLAYBOOKS.map(clonePlaybook),
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWorkerTasks: true,
  neverReplaceWorkers: true,
  neverReplaceWorkforceOrchestrator: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preservePlaybookTraceability: true,
  preserveAuditability: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildOperationalPlaybookEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<OperationalPlaybookEngineConfiguration> = {},
): OperationalPlaybookEngineConfiguration {
  let file: Partial<OperationalPlaybookEngineConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "operational-playbook-engine.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.OPERATIONAL_PLAYBOOK_ENGINE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.OPERATIONAL_PLAYBOOK_ENGINE_RETRY_ATTEMPTS ?? "", 10);

  const mergedCategories = Array.from(
    new Set([
      ...DEFAULT_OPERATIONAL_PLAYBOOK_ENGINE_CONFIGURATION.supportedCategories,
      ...(file.supportedCategories ?? []),
      ...(overrides.supportedCategories ?? []),
    ]),
  );

  return {
    ...DEFAULT_OPERATIONAL_PLAYBOOK_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    supportedCategories: mergedCategories,
    seedPlaybooks: (overrides.seedPlaybooks ??
      file.seedPlaybooks ??
      DEFAULT_OPERATIONAL_PLAYBOOK_ENGINE_CONFIGURATION.seedPlaybooks).map(clonePlaybook),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverReplaceWorkers: true,
    neverReplaceWorkforceOrchestrator: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preservePlaybookTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function clonePlaybook(playbook: PlaybookRecord): PlaybookRecord {
  return {
    ...playbook,
    preconditions: [...playbook.preconditions],
    executionSteps: playbook.executionSteps.map((s) => ({ ...s })),
    requiredCapabilities: [...playbook.requiredCapabilities],
    requiredTools: [...playbook.requiredTools],
    approvalRequirements: [...playbook.approvalRequirements],
    successCriteria: [...playbook.successCriteria],
    failureCriteria: [...playbook.failureCriteria],
  };
}
