import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { INTEGRATION_TARGETS, PCART_METADATA_VERSION, PILLOW_COMMAND_AUDIT_IDENTITY } from "./paths.js";
import type { PillowCommandAuditReport } from "./types.js";

export type PillowCommandAuditConfiguration = {
  enabled: boolean;
  discoveryEnabled: boolean;
  commandDispatchProbingEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: PillowCommandAuditReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q11-03 hard boundaries — force-locked true. */
  neverFabricateAuditEvidence: true;
  neverCertifyUnverifiedCommandCapability: true;
  neverAssumeImplementation: true;
  neverModifyWorkerImplementations: true;
  neverRepairFailedWorkers: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1104OrLater: true;
  preserveCompleteTraceability: true;
  preserveImmutableAuditHistory: true;
  preserveAuditHistory: true;
  deterministicAuditBehaviour: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_PILLOW_COMMAND_AUDIT_CONFIGURATION: PillowCommandAuditConfiguration = {
  enabled: true,
  discoveryEnabled: true,
  commandDispatchProbingEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: PILLOW_COMMAND_AUDIT_IDENTITY.workerId,
  workerName: PILLOW_COMMAND_AUDIT_IDENTITY.workerName,
  factory: PILLOW_COMMAND_AUDIT_IDENTITY.factory,
  department: PILLOW_COMMAND_AUDIT_IDENTITY.department,
  role: PILLOW_COMMAND_AUDIT_IDENTITY.role,
  reportingLine: [...PILLOW_COMMAND_AUDIT_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateAuditEvidence: true,
  neverCertifyUnverifiedCommandCapability: true,
  neverAssumeImplementation: true,
  neverModifyWorkerImplementations: true,
  neverRepairFailedWorkers: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1104OrLater: true,
  preserveCompleteTraceability: true,
  preserveImmutableAuditHistory: true,
  preserveAuditHistory: true,
  deterministicAuditBehaviour: true,
  structuralSignalOnly: true,
  evidenceBasedOnly: true,
  maskSensitiveValues: true,
};

export function buildPillowCommandAuditConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PillowCommandAuditConfiguration> = {},
): PillowCommandAuditConfiguration {
  let file: Partial<PillowCommandAuditConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "pillow-command-audit.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.PILLOW_COMMAND_AUDIT_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.PILLOW_COMMAND_AUDIT_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_PILLOW_COMMAND_AUDIT_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_PILLOW_COMMAND_AUDIT_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_PILLOW_COMMAND_AUDIT_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateAuditEvidence: true,
    neverCertifyUnverifiedCommandCapability: true,
    neverAssumeImplementation: true,
    neverModifyWorkerImplementations: true,
    neverRepairFailedWorkers: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1104OrLater: true,
    preserveCompleteTraceability: true,
    preserveImmutableAuditHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: PillowCommandAuditReport): PillowCommandAuditReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    workerInventory: [...report.workerInventory],
    commandMatrix: [...report.commandMatrix],
    metadataVersion: report.metadataVersion || PCART_METADATA_VERSION,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveImmutableAuditHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateAuditEvidence: true,
    neverCertifyUnverifiedCommandCapability: true,
    neverAssumeImplementation: true,
    neverModifyWorkerImplementations: true,
    neverRepairFailedWorkers: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1104OrLater: true,
    firstPillowCommandGate: true,
  };
}
