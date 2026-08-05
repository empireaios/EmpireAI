import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  CAPCRT_METADATA_VERSION,
  CAPITAL_FACTORY_CERTIFICATION_IDENTITY,
} from "./paths.js";
import type { CapitalCertificationReport } from "./types.js";

export type CapitalFactoryCertificationConfiguration = {
  enabled: boolean;
  evidenceScanEnabled: boolean;
  runtimeProbingEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: CapitalCertificationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  currencyPrecisionRequired: boolean;
  financialTraceabilityRequired: boolean;
  /** Q9-11 hard boundaries — force-locked true. */
  neverFabricateSuccessfulTests: true;
  neverAssumeImplementation: true;
  neverImplementMissingWorkers: true;
  neverModifyFinancialRecords: true;
  neverAutomaticallyFixFailures: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ10OrLater: true;
  preserveCompleteTraceability: true;
  preserveCertificationHistory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
};

export const DEFAULT_CAPITAL_FACTORY_CERTIFICATION_CONFIGURATION: CapitalFactoryCertificationConfiguration =
  {
    enabled: true,
    evidenceScanEnabled: true,
    runtimeProbingEnabled: true,
    executiveReportingEnabled: true,
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: CAPITAL_FACTORY_CERTIFICATION_IDENTITY.workerId,
    workerName: CAPITAL_FACTORY_CERTIFICATION_IDENTITY.workerName,
    factory: CAPITAL_FACTORY_CERTIFICATION_IDENTITY.factory,
    department: CAPITAL_FACTORY_CERTIFICATION_IDENTITY.department,
    role: CAPITAL_FACTORY_CERTIFICATION_IDENTITY.role,
    reportingLine: [...CAPITAL_FACTORY_CERTIFICATION_IDENTITY.reportingLine],
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    currencyPrecisionRequired: true,
    financialTraceabilityRequired: true,
    neverFabricateSuccessfulTests: true,
    neverAssumeImplementation: true,
    neverImplementMissingWorkers: true,
    neverModifyFinancialRecords: true,
    neverAutomaticallyFixFailures: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ10OrLater: true,
    preserveCompleteTraceability: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
  };

export function buildCapitalFactoryCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CapitalFactoryCertificationConfiguration> = {},
): CapitalFactoryCertificationConfiguration {
  let file: Partial<CapitalFactoryCertificationConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "capital-factory-certification.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.CAPITAL_FACTORY_CERTIFICATION_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.CAPITAL_FACTORY_CERTIFICATION_RETRY_ATTEMPTS ?? "",
    10,
  );

  return {
    ...DEFAULT_CAPITAL_FACTORY_CERTIFICATION_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_CAPITAL_FACTORY_CERTIFICATION_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_CAPITAL_FACTORY_CERTIFICATION_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) =>
      lockReport(report),
    ),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateSuccessfulTests: true,
    neverAssumeImplementation: true,
    neverImplementMissingWorkers: true,
    neverModifyFinancialRecords: true,
    neverAutomaticallyFixFailures: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ10OrLater: true,
    preserveCompleteTraceability: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
  };
}

function lockReport(report: CapitalCertificationReport): CapitalCertificationReport {
  return {
    ...report,
    risks: [...report.risks],
    openIssues: [...report.openIssues],
    supportingEvidence: [...report.supportingEvidence],
    traceabilityRefs: [...report.traceabilityRefs],
    metadataVersion: report.metadataVersion || CAPCRT_METADATA_VERSION,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    neverFabricateSuccessfulTests: true,
    neverAssumeImplementation: true,
    neverImplementMissingWorkers: true,
    neverModifyFinancialRecords: true,
    neverAutomaticallyFixFailures: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ10OrLater: true,
    neverExposeCredentials: true,
    finalQ9Gate: true,
    consumableByFutureSeries: false,
  };
}
