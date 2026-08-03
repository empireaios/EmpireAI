import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  LBC_METADATA_VERSION,
  LOCAL_BUSINESS_CERTIFICATION_IDENTITY,
} from "./paths.js";
import type { LocalBusinessCertificationReport } from "./types.js";

export type LocalBusinessCertificationConfiguration = {
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
  seedReports: LocalBusinessCertificationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q7-11 hard boundaries — force-locked true. */
  neverFabricateVerificationResults: true;
  neverCertifyUnsupportedFunctionality: true;
  neverImplementMissingFunctionality: true;
  neverAutoCorrectFailedImplementations: true;
  neverOverrideGovernance: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ801OrLater: true;
  preserveCompleteTraceability: true;
  preserveCertificationAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_LOCAL_BUSINESS_CERTIFICATION_CONFIGURATION: LocalBusinessCertificationConfiguration =
  {
    enabled: true,
    evidenceScanEnabled: true,
    runtimeProbingEnabled: true,
    executiveReportingEnabled: true,
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: LOCAL_BUSINESS_CERTIFICATION_IDENTITY.workerId,
    workerName: LOCAL_BUSINESS_CERTIFICATION_IDENTITY.workerName,
    factory: LOCAL_BUSINESS_CERTIFICATION_IDENTITY.factory,
    department: LOCAL_BUSINESS_CERTIFICATION_IDENTITY.department,
    role: LOCAL_BUSINESS_CERTIFICATION_IDENTITY.role,
    reportingLine: [...LOCAL_BUSINESS_CERTIFICATION_IDENTITY.reportingLine],
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverFabricateVerificationResults: true,
    neverCertifyUnsupportedFunctionality: true,
    neverImplementMissingFunctionality: true,
    neverAutoCorrectFailedImplementations: true,
    neverOverrideGovernance: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ801OrLater: true,
    preserveCompleteTraceability: true,
    preserveCertificationAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };

export function buildLocalBusinessCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LocalBusinessCertificationConfiguration> = {},
): LocalBusinessCertificationConfiguration {
  let file: Partial<LocalBusinessCertificationConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "local-business-certification.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.LOCAL_BUSINESS_CERTIFICATION_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.LOCAL_BUSINESS_CERTIFICATION_RETRY_ATTEMPTS ?? "",
    10,
  );

  return {
    ...DEFAULT_LOCAL_BUSINESS_CERTIFICATION_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_LOCAL_BUSINESS_CERTIFICATION_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_LOCAL_BUSINESS_CERTIFICATION_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) =>
      lockReport(report),
    ),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateVerificationResults: true,
    neverCertifyUnsupportedFunctionality: true,
    neverImplementMissingFunctionality: true,
    neverAutoCorrectFailedImplementations: true,
    neverOverrideGovernance: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ801OrLater: true,
    preserveCompleteTraceability: true,
    preserveCertificationAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(
  report: LocalBusinessCertificationReport,
): LocalBusinessCertificationReport {
  return {
    ...report,
    risks: [...report.risks],
    outstandingFindings: [...report.outstandingFindings],
    traceabilityRefs: [...report.traceabilityRefs],
    metadataVersion: report.metadataVersion || LBC_METADATA_VERSION,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    preserveCompleteTraceability: true,
    preserveCertificationAuditHistory: true,
    neverFabricateVerificationResults: true,
    neverCertifyUnsupportedFunctionality: true,
    neverImplementMissingFunctionality: true,
    neverAutoCorrectFailedImplementations: true,
    neverOverrideGovernance: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ801OrLater: true,
    finalQ7Gate: true,
    consumableByFutureSeries: false,
  };
}
