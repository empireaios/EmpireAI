import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { INTEGRATION_TARGETS, FINART_METADATA_VERSION, FINANCIAL_READINESS_AUDIT_IDENTITY } from "./paths.js";
import type { FinancialReadinessAuditReport } from "./types.js";

export type FinancialReadinessAuditConfiguration = {
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
  seedReports: FinancialReadinessAuditReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q11-08 hard boundaries — force-locked true. */
  neverFabricateFinancialEvidence: true;
  neverCertifyUnverifiedFinancialCapability: true;
  neverExecuteFinancialTransactions: true;
  neverModifyAccountingRecords: true;
  neverAssumeImplementation: true;
  neverRepairFailedFinancialComponents: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1109OrLater: true;
  preserveCompleteTraceability: true;
  preserveImmutableFinancialHistory: true;
  preserveAuditHistory: true;
  deterministicAuditBehaviour: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_FINANCIAL_READINESS_AUDIT_CONFIGURATION: FinancialReadinessAuditConfiguration = {
  enabled: true,
  discoveryEnabled: true,
  capabilityProbingEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: FINANCIAL_READINESS_AUDIT_IDENTITY.workerId,
  workerName: FINANCIAL_READINESS_AUDIT_IDENTITY.workerName,
  factory: FINANCIAL_READINESS_AUDIT_IDENTITY.factory,
  department: FINANCIAL_READINESS_AUDIT_IDENTITY.department,
  role: FINANCIAL_READINESS_AUDIT_IDENTITY.role,
  reportingLine: [...FINANCIAL_READINESS_AUDIT_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateFinancialEvidence: true,
  neverCertifyUnverifiedFinancialCapability: true,
  neverExecuteFinancialTransactions: true,
  neverModifyAccountingRecords: true,
  neverAssumeImplementation: true,
  neverRepairFailedFinancialComponents: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1109OrLater: true,
  preserveCompleteTraceability: true,
  preserveImmutableFinancialHistory: true,
  preserveAuditHistory: true,
  deterministicAuditBehaviour: true,
  structuralSignalOnly: true,
  evidenceBasedOnly: true,
  maskSensitiveValues: true,
};

export function buildFinancialReadinessAuditConfiguration(
  repositoryRoot?: string,
  overrides: Partial<FinancialReadinessAuditConfiguration> = {},
): FinancialReadinessAuditConfiguration {
  let file: Partial<FinancialReadinessAuditConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "financial-readiness-audit.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.FINANCIAL_READINESS_AUDIT_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.FINANCIAL_READINESS_AUDIT_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_FINANCIAL_READINESS_AUDIT_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_FINANCIAL_READINESS_AUDIT_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ?? file.reportingLine ?? DEFAULT_FINANCIAL_READINESS_AUDIT_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateFinancialEvidence: true,
    neverCertifyUnverifiedFinancialCapability: true,
    neverExecuteFinancialTransactions: true,
    neverModifyAccountingRecords: true,
    neverAssumeImplementation: true,
    neverRepairFailedFinancialComponents: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1109OrLater: true,
    preserveCompleteTraceability: true,
    preserveImmutableFinancialHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: FinancialReadinessAuditReport): FinancialReadinessAuditReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingRisks: [...report.outstandingRisks],
    traceabilityRefs: [...report.traceabilityRefs],
    componentInventory: [...report.componentInventory],
    assessments: [...report.assessments],
    findings: [...report.findings],
    metadataVersion: report.metadataVersion || FINART_METADATA_VERSION,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveImmutableFinancialHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateFinancialEvidence: true,
    neverCertifyUnverifiedFinancialCapability: true,
    neverExecuteFinancialTransactions: true,
    neverModifyAccountingRecords: true,
    neverAssumeImplementation: true,
    neverRepairFailedFinancialComponents: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1109OrLater: true,
    eighthQ11Gate: true,
  };
}
