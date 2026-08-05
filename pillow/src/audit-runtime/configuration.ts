import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AUDIT_RUNTIME_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";

export type AuditRuntimeConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  auditRulesEnabled: boolean;
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
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q10-13 hard boundaries — force-locked true. */
  neverFabricateAuditEvidence: true;
  neverDeleteAuditRecords: true;
  neverExecuteBusinessLogic: true;
  neverModifyOperationalData: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1014OrLater: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveCompleteTraceability: true;
  preserveImmutableAuditHistory: true;
  preserveAuditHistory: true;
  deterministicAuditRecording: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_AUDIT_RUNTIME_CONFIGURATION: AuditRuntimeConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  auditRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: AUDIT_RUNTIME_IDENTITY.workerId,
  workerName: AUDIT_RUNTIME_IDENTITY.workerName,
  factory: AUDIT_RUNTIME_IDENTITY.factory,
  department: AUDIT_RUNTIME_IDENTITY.department,
  role: AUDIT_RUNTIME_IDENTITY.role,
  reportingLine: [...AUDIT_RUNTIME_IDENTITY.reportingLine],
  loggingLevel: "info",
  neverFabricateAuditEvidence: true,
  neverDeleteAuditRecords: true,
  neverExecuteBusinessLogic: true,
  neverModifyOperationalData: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ1014OrLater: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  preserveCompleteTraceability: true,
  preserveImmutableAuditHistory: true,
  preserveAuditHistory: true,
  deterministicAuditRecording: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildAuditRuntimeConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AuditRuntimeConfiguration> = {},
): AuditRuntimeConfiguration {
  let file: Partial<AuditRuntimeConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "audit-runtime.config.json")
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
        ...DEFAULT_AUDIT_RUNTIME_CONFIGURATION.integrationTargets,
        ...(file.integrationTargets ?? []),
        ...(overrides.integrationTargets ?? []),
      ]),
    );

  return {
    ...DEFAULT_AUDIT_RUNTIME_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList(),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_AUDIT_RUNTIME_CONFIGURATION.reportingLine),
    ],
    neverFabricateAuditEvidence: true,
    neverDeleteAuditRecords: true,
    neverExecuteBusinessLogic: true,
    neverModifyOperationalData: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ1014OrLater: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveCompleteTraceability: true,
    preserveImmutableAuditHistory: true,
    preserveAuditHistory: true,
    deterministicAuditRecording: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
