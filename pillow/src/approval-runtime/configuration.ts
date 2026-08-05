import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APPROVAL_RUNTIME_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";

export type ApprovalRuntimeConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  approvalRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  defaultTimeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q10-09 hard boundaries — force-locked true. */
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverFabricateApprovalDecisions: true;
  neverAutoApproveRestrictedActions: true;
  neverImplementQ1010OrLater: true;
  neverReplaceBusinessLogic: true;
  neverReplaceWorkerImplementations: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveCompleteTraceability: true;
  preserveApprovalHistory: true;
  preserveAuditHistory: true;
  preventUnauthorizedExecution: true;
  deterministicApprovalRouting: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_APPROVAL_RUNTIME_CONFIGURATION: ApprovalRuntimeConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  approvalRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: APPROVAL_RUNTIME_IDENTITY.workerId,
  workerName: APPROVAL_RUNTIME_IDENTITY.workerName,
  factory: APPROVAL_RUNTIME_IDENTITY.factory,
  department: APPROVAL_RUNTIME_IDENTITY.department,
  role: APPROVAL_RUNTIME_IDENTITY.role,
  reportingLine: [...APPROVAL_RUNTIME_IDENTITY.reportingLine],
  defaultTimeoutMs: 86_400_000,
  loggingLevel: "info",
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverFabricateApprovalDecisions: true,
  neverAutoApproveRestrictedActions: true,
  neverImplementQ1010OrLater: true,
  neverReplaceBusinessLogic: true,
  neverReplaceWorkerImplementations: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  preserveCompleteTraceability: true,
  preserveApprovalHistory: true,
  preserveAuditHistory: true,
  preventUnauthorizedExecution: true,
  deterministicApprovalRouting: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildApprovalRuntimeConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ApprovalRuntimeConfiguration> = {},
): ApprovalRuntimeConfiguration {
  let file: Partial<ApprovalRuntimeConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "approval-runtime.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.APPROVAL_RUNTIME_DEFAULT_TIMEOUT_MS ?? "", 10);

  const mergeList = () =>
    Array.from(
      new Set([
        ...DEFAULT_APPROVAL_RUNTIME_CONFIGURATION.integrationTargets,
        ...(file.integrationTargets ?? []),
        ...(overrides.integrationTargets ?? []),
      ]),
    );

  return {
    ...DEFAULT_APPROVAL_RUNTIME_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList(),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_APPROVAL_RUNTIME_CONFIGURATION.reportingLine),
    ],
    ...(Number.isFinite(timeout) ? { defaultTimeoutMs: timeout } : {}),
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverFabricateApprovalDecisions: true,
    neverAutoApproveRestrictedActions: true,
    neverImplementQ1010OrLater: true,
    neverReplaceBusinessLogic: true,
    neverReplaceWorkerImplementations: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveCompleteTraceability: true,
    preserveApprovalHistory: true,
    preserveAuditHistory: true,
    preventUnauthorizedExecution: true,
    deterministicApprovalRouting: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
