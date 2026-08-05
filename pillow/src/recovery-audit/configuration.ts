import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { INTEGRATION_TARGETS, RECART_METADATA_VERSION, RECOVERY_AUDIT_IDENTITY } from "./paths.js";
import type { RecoveryAuditReport } from "./types.js";

export type RecoveryAuditConfiguration = {
  enabled: boolean;
  discoveryEnabled: boolean;
  capabilityProbingEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: RecoveryAuditReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q11-07 hard boundaries — force-locked true. */
  neverFabricateRecoveryEvidence: true;
  neverCertifyUntestedRecovery: true;
  neverMutateProductionViaRecoveryCalls: true;
  neverAssumeImplementation: true;
  neverModifyRecoveryImplementations: true;
  neverRepairFailedRecoveryComponents: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1108OrLater: true;
  preserveCompleteTraceability: true;
  preserveImmutableRecoveryHistory: true;
  preserveAuditHistory: true;
  deterministicAuditBehaviour: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_RECOVERY_AUDIT_CONFIGURATION: RecoveryAuditConfiguration = {
  enabled: true,
  discoveryEnabled: true,
  capabilityProbingEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: RECOVERY_AUDIT_IDENTITY.workerId,
  workerName: RECOVERY_AUDIT_IDENTITY.workerName,
  factory: RECOVERY_AUDIT_IDENTITY.factory,
  department: RECOVERY_AUDIT_IDENTITY.department,
  role: RECOVERY_AUDIT_IDENTITY.role,
  reportingLine: [...RECOVERY_AUDIT_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateRecoveryEvidence: true,
  neverCertifyUntestedRecovery: true,
  neverMutateProductionViaRecoveryCalls: true,
  neverAssumeImplementation: true,
  neverModifyRecoveryImplementations: true,
  neverRepairFailedRecoveryComponents: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1108OrLater: true,
  preserveCompleteTraceability: true,
  preserveImmutableRecoveryHistory: true,
  preserveAuditHistory: true,
  deterministicAuditBehaviour: true,
  structuralSignalOnly: true,
  evidenceBasedOnly: true,
  maskSensitiveValues: true,
};

export function buildRecoveryAuditConfiguration(
  repositoryRoot?: string,
  overrides: Partial<RecoveryAuditConfiguration> = {},
): RecoveryAuditConfiguration {
  let file: Partial<RecoveryAuditConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "recovery-audit.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.RECOVERY_AUDIT_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.RECOVERY_AUDIT_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_RECOVERY_AUDIT_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_RECOVERY_AUDIT_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ?? file.reportingLine ?? DEFAULT_RECOVERY_AUDIT_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateRecoveryEvidence: true,
    neverCertifyUntestedRecovery: true,
    neverMutateProductionViaRecoveryCalls: true,
    neverAssumeImplementation: true,
    neverModifyRecoveryImplementations: true,
    neverRepairFailedRecoveryComponents: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1108OrLater: true,
    preserveCompleteTraceability: true,
    preserveImmutableRecoveryHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: RecoveryAuditReport): RecoveryAuditReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingRisks: [...report.outstandingRisks],
    traceabilityRefs: [...report.traceabilityRefs],
    componentInventory: [...report.componentInventory],
    assessments: [...report.assessments],
    findings: [...report.findings],
    metadataVersion: report.metadataVersion || RECART_METADATA_VERSION,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveImmutableRecoveryHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateRecoveryEvidence: true,
    neverCertifyUntestedRecovery: true,
    neverMutateProductionViaRecoveryCalls: true,
    neverAssumeImplementation: true,
    neverModifyRecoveryImplementations: true,
    neverRepairFailedRecoveryComponents: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1108OrLater: true,
    seventhQ11Gate: true,
  };
}
