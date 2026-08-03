import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONSTITUTION_VERSION,
  CONSTITUTIONAL_RULES,
  WORKER_LIFECYCLE_STAGES,
} from "./paths.js";
import type { WorkerInheritanceRecord } from "./types.js";

export type WorkerConstitutionConfiguration = {
  enabled: boolean;
  definitionRulesEnabled: boolean;
  inheritanceRulesEnabled: boolean;
  complianceRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  constitutionVersion: string;
  constitutionalRules: string[];
  lifecycleStages: string[];
  workerIdentity: string;
  workerPurpose: string;
  workerResponsibilities: string[];
  workerAuthority: string[];
  workerRestrictions: string[];
  workerObligations: string[];
  communicationStandards: string[];
  reportingStandards: string[];
  qualityStandards: string[];
  governanceStandards: string[];
  escalationStandards: string[];
  auditStandards: string[];
  traceabilityStandards: string[];
  seedInheritanceRecords: WorkerInheritanceRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q1-01 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkerQualityStandard: true;
  neverReplaceGovernance: true;
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

export const DEFAULT_WORKER_CONSTITUTION_CONFIGURATION: WorkerConstitutionConfiguration = {
  enabled: true,
  definitionRulesEnabled: true,
  inheritanceRulesEnabled: true,
  complianceRulesEnabled: true,
  validationRulesEnabled: true,
  constitutionVersion: CONSTITUTION_VERSION,
  constitutionalRules: [...CONSTITUTIONAL_RULES],
  lifecycleStages: [...WORKER_LIFECYCLE_STAGES],
  workerIdentity: "AI Worker under Pillow governance",
  workerPurpose:
    "Execute assigned missions within authority while remaining governed, auditable, and certifiable by Pillow.",
  workerResponsibilities: [
    "execute_assigned_missions",
    "report_progress_and_outcomes",
    "preserve_evidence_and_assumptions",
    "self_critique_before_submission",
    "escalate_beyond_authority",
  ],
  workerAuthority: [
    "operate_within_assigned_mission_scope",
    "use_approved_tools_only",
    "request_peer_review_when_required",
    "recommend_actions_to_pillow",
  ],
  workerRestrictions: [
    "never_bypass_pillow",
    "never_override_grand_king",
    "never_execute_outside_authority",
    "never_use_unapproved_tools",
    "never_hide_work_or_evidence",
  ],
  workerObligations: [
    "remain_governed_by_pillow",
    "follow_executive_instructions",
    "comply_with_worker_quality_standard",
    "comply_with_worker_self_critique_protocol",
    "remain_certifiable_at_all_times",
  ],
  communicationStandards: [
    "structured_inter_worker_messaging",
    "explicit_task_negotiation",
    "no_silent_side_channels",
  ],
  reportingStandards: [
    "report_all_work",
    "include_confidence_and_limitations",
    "emit_machine_readable_completion_signals",
  ],
  qualityStandards: [
    "worker_quality_standard",
    "worker_self_critique_protocol",
    "peer_review_when_required",
  ],
  governanceStandards: [
    "pillow_governance",
    "workforce_access_controls",
    "approved_tool_access",
  ],
  escalationStandards: [
    "escalate_beyond_authority",
    "escalate_governance_conflicts",
    "escalate_certification_failures",
  ],
  auditStandards: [
    "preserve_audit_history",
    "record_decision_trace",
    "mask_sensitive_values",
  ],
  traceabilityStandards: [
    "preserve_traceability",
    "link_mission_worker_output",
    "retain_inheritance_binding",
  ],
  seedInheritanceRecords: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWorkerTasks: true,
  neverReplaceWorkerQualityStandard: true,
  neverReplaceGovernance: true,
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

export function buildWorkerConstitutionConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkerConstitutionConfiguration> = {},
): WorkerConstitutionConfiguration {
  let file: Partial<WorkerConstitutionConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "worker-constitution.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.WORKER_CONSTITUTION_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.WORKER_CONSTITUTION_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: keyof WorkerConstitutionConfiguration) =>
    Array.from(
      new Set([
        ...((DEFAULT_WORKER_CONSTITUTION_CONFIGURATION[key] as string[]) ?? []),
        ...((file[key] as string[] | undefined) ?? []),
        ...((overrides[key] as string[] | undefined) ?? []),
      ]),
    );

  return {
    ...DEFAULT_WORKER_CONSTITUTION_CONFIGURATION,
    ...file,
    ...overrides,
    constitutionalRules: mergeList("constitutionalRules"),
    lifecycleStages: mergeList("lifecycleStages"),
    workerResponsibilities: mergeList("workerResponsibilities"),
    workerAuthority: mergeList("workerAuthority"),
    workerRestrictions: mergeList("workerRestrictions"),
    workerObligations: mergeList("workerObligations"),
    communicationStandards: mergeList("communicationStandards"),
    reportingStandards: mergeList("reportingStandards"),
    qualityStandards: mergeList("qualityStandards"),
    governanceStandards: mergeList("governanceStandards"),
    escalationStandards: mergeList("escalationStandards"),
    auditStandards: mergeList("auditStandards"),
    traceabilityStandards: mergeList("traceabilityStandards"),
    seedInheritanceRecords: (
      overrides.seedInheritanceRecords ??
      file.seedInheritanceRecords ??
      []
    ).map((r) => ({
      ...r,
      rulesApplied: [...r.rulesApplied],
      rulesSatisfied: [...r.rulesSatisfied],
      rulesFailed: [...r.rulesFailed],
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverReplaceWorkerQualityStandard: true,
    neverReplaceGovernance: true,
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
