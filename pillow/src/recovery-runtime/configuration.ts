import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  RECOVERY_RUNTIME_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";

export type RecoveryRuntimeConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  recoveryRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  defaultMaxRestarts: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q10-11 hard boundaries — force-locked true. */
  neverFabricateRecoverySuccess: true;
  neverLoseRecoverableExecutionState: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverModifyValidatedBusinessData: true;
  neverReplaceBusinessLogic: true;
  neverImplementQ1012OrLater: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveCompleteTraceability: true;
  preserveRecoveryHistory: true;
  preserveAuditHistory: true;
  deterministicRecoveryBehaviour: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_RECOVERY_RUNTIME_CONFIGURATION: RecoveryRuntimeConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  recoveryRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  defaultMaxRestarts: 3,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: RECOVERY_RUNTIME_IDENTITY.workerId,
  workerName: RECOVERY_RUNTIME_IDENTITY.workerName,
  factory: RECOVERY_RUNTIME_IDENTITY.factory,
  department: RECOVERY_RUNTIME_IDENTITY.department,
  role: RECOVERY_RUNTIME_IDENTITY.role,
  reportingLine: [...RECOVERY_RUNTIME_IDENTITY.reportingLine],
  loggingLevel: "info",
  neverFabricateRecoverySuccess: true,
  neverLoseRecoverableExecutionState: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverModifyValidatedBusinessData: true,
  neverReplaceBusinessLogic: true,
  neverImplementQ1012OrLater: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  preserveCompleteTraceability: true,
  preserveRecoveryHistory: true,
  preserveAuditHistory: true,
  deterministicRecoveryBehaviour: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildRecoveryRuntimeConfiguration(
  repositoryRoot?: string,
  overrides: Partial<RecoveryRuntimeConfiguration> = {},
): RecoveryRuntimeConfiguration {
  let file: Partial<RecoveryRuntimeConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "recovery-runtime.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }

  const mergeList = () =>
    Array.from(
      new Set([
        ...DEFAULT_RECOVERY_RUNTIME_CONFIGURATION.integrationTargets,
        ...(file.integrationTargets ?? []),
        ...(overrides.integrationTargets ?? []),
      ]),
    );

  return {
    ...DEFAULT_RECOVERY_RUNTIME_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList(),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_RECOVERY_RUNTIME_CONFIGURATION.reportingLine),
    ],
    neverFabricateRecoverySuccess: true,
    neverLoseRecoverableExecutionState: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverModifyValidatedBusinessData: true,
    neverReplaceBusinessLogic: true,
    neverImplementQ1012OrLater: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveCompleteTraceability: true,
    preserveRecoveryHistory: true,
    preserveAuditHistory: true,
    deterministicRecoveryBehaviour: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
