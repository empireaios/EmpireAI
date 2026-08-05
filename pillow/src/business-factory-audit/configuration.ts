import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { INTEGRATION_TARGETS, BFART_METADATA_VERSION, BUSINESS_FACTORY_AUDIT_IDENTITY } from "./paths.js";
import type { BusinessFactoryAuditReport } from "./types.js";

export type BusinessFactoryAuditConfiguration = {
  enabled: boolean;
  discoveryEnabled: boolean;
  workflowProbingEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: BusinessFactoryAuditReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q11-04 hard boundaries — force-locked true. */
  neverFabricateAuditEvidence: true;
  neverCertifyIncompleteWorkflows: true;
  neverCertifyMissingIntegrations: true;
  neverAssumeImplementation: true;
  neverModifyFactoryImplementations: true;
  neverRepairFailedFactories: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1105OrLater: true;
  preserveCompleteTraceability: true;
  preserveImmutableAuditHistory: true;
  preserveAuditHistory: true;
  deterministicAuditBehaviour: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_BUSINESS_FACTORY_AUDIT_CONFIGURATION: BusinessFactoryAuditConfiguration = {
  enabled: true,
  discoveryEnabled: true,
  workflowProbingEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: BUSINESS_FACTORY_AUDIT_IDENTITY.workerId,
  workerName: BUSINESS_FACTORY_AUDIT_IDENTITY.workerName,
  factory: BUSINESS_FACTORY_AUDIT_IDENTITY.factory,
  department: BUSINESS_FACTORY_AUDIT_IDENTITY.department,
  role: BUSINESS_FACTORY_AUDIT_IDENTITY.role,
  reportingLine: [...BUSINESS_FACTORY_AUDIT_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateAuditEvidence: true,
  neverCertifyIncompleteWorkflows: true,
  neverCertifyMissingIntegrations: true,
  neverAssumeImplementation: true,
  neverModifyFactoryImplementations: true,
  neverRepairFailedFactories: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1105OrLater: true,
  preserveCompleteTraceability: true,
  preserveImmutableAuditHistory: true,
  preserveAuditHistory: true,
  deterministicAuditBehaviour: true,
  structuralSignalOnly: true,
  evidenceBasedOnly: true,
  maskSensitiveValues: true,
};

export function buildBusinessFactoryAuditConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BusinessFactoryAuditConfiguration> = {},
): BusinessFactoryAuditConfiguration {
  let file: Partial<BusinessFactoryAuditConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "business-factory-audit.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.BUSINESS_FACTORY_AUDIT_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.BUSINESS_FACTORY_AUDIT_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_BUSINESS_FACTORY_AUDIT_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_BUSINESS_FACTORY_AUDIT_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_BUSINESS_FACTORY_AUDIT_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateAuditEvidence: true,
    neverCertifyIncompleteWorkflows: true,
    neverCertifyMissingIntegrations: true,
    neverAssumeImplementation: true,
    neverModifyFactoryImplementations: true,
    neverRepairFailedFactories: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1105OrLater: true,
    preserveCompleteTraceability: true,
    preserveImmutableAuditHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: BusinessFactoryAuditReport): BusinessFactoryAuditReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    factoryInventory: [...report.factoryInventory],
    assessments: [...report.assessments],
    findings: [...report.findings],
    metadataVersion: report.metadataVersion || BFART_METADATA_VERSION,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveImmutableAuditHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateAuditEvidence: true,
    neverCertifyIncompleteWorkflows: true,
    neverCertifyMissingIntegrations: true,
    neverAssumeImplementation: true,
    neverModifyFactoryImplementations: true,
    neverRepairFailedFactories: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1105OrLater: true,
    fourthQ11Gate: true,
  };
}
