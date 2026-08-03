import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  AFCRT_METADATA_VERSION,
  AFFILIATE_CERTIFICATION_IDENTITY,
} from "./paths.js";
import type { AffiliateCertificationReport } from "./types.js";

export type AffiliateCertificationConfiguration = {
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
  seedReports: AffiliateCertificationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q8-09 hard boundaries — force-locked true. */
  neverFabricateVerificationResults: true;
  neverCertifyUnsupportedFunctionality: true;
  neverImplementMissingFunctionality: true;
  neverAutoCorrectFailedImplementations: true;
  neverOverrideGovernance: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ901OrLater: true;
  preserveCompleteTraceability: true;
  preserveCertificationAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_AFFILIATE_CERTIFICATION_CONFIGURATION: AffiliateCertificationConfiguration =
  {
    enabled: true,
    evidenceScanEnabled: true,
    runtimeProbingEnabled: true,
    executiveReportingEnabled: true,
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: AFFILIATE_CERTIFICATION_IDENTITY.workerId,
    workerName: AFFILIATE_CERTIFICATION_IDENTITY.workerName,
    factory: AFFILIATE_CERTIFICATION_IDENTITY.factory,
    department: AFFILIATE_CERTIFICATION_IDENTITY.department,
    role: AFFILIATE_CERTIFICATION_IDENTITY.role,
    reportingLine: [...AFFILIATE_CERTIFICATION_IDENTITY.reportingLine],
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
    neverImplementQ901OrLater: true,
    preserveCompleteTraceability: true,
    preserveCertificationAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };

export function buildAffiliateCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AffiliateCertificationConfiguration> = {},
): AffiliateCertificationConfiguration {
  let file: Partial<AffiliateCertificationConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "affiliate-certification.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.AFFILIATE_CERTIFICATION_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.AFFILIATE_CERTIFICATION_RETRY_ATTEMPTS ?? "",
    10,
  );

  return {
    ...DEFAULT_AFFILIATE_CERTIFICATION_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_AFFILIATE_CERTIFICATION_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_AFFILIATE_CERTIFICATION_CONFIGURATION.reportingLine),
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
    neverImplementQ901OrLater: true,
    preserveCompleteTraceability: true,
    preserveCertificationAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(
  report: AffiliateCertificationReport,
): AffiliateCertificationReport {
  return {
    ...report,
    risks: [...report.risks],
    outstandingFindings: [...report.outstandingFindings],
    traceabilityRefs: [...report.traceabilityRefs],
    metadataVersion: report.metadataVersion || AFCRT_METADATA_VERSION,
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
    neverImplementQ901OrLater: true,
    finalQ8Gate: true,
    consumableByFutureSeries: false,
  };
}
