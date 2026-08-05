import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { QSCRT_METADATA_VERSION, Q_SERIES_CERTIFICATION_IDENTITY, INTEGRATION_TARGETS } from "./paths.js";
import type { QSeriesCertificationReport } from "./types.js";

export type QSeriesCertificationConfiguration = {
  enabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: QSeriesCertificationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q11-12 hard boundaries — force-locked true. */
  neverFabricateCertificationEvidence: true;
  neverCertifyMissingFunctionality: true;
  neverBypassGovernance: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1113OrLater: true;
  preserveCompleteTraceability: true;
  preserveCertificationHistory: true;
  preserveAuditHistory: true;
  deterministicCertificationBehaviour: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_Q_SERIES_CERTIFICATION_CONFIGURATION: QSeriesCertificationConfiguration = {
  enabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: Q_SERIES_CERTIFICATION_IDENTITY.workerId,
  workerName: Q_SERIES_CERTIFICATION_IDENTITY.workerName,
  factory: Q_SERIES_CERTIFICATION_IDENTITY.factory,
  department: Q_SERIES_CERTIFICATION_IDENTITY.department,
  role: Q_SERIES_CERTIFICATION_IDENTITY.role,
  reportingLine: [...Q_SERIES_CERTIFICATION_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateCertificationEvidence: true,
  neverCertifyMissingFunctionality: true,
  neverBypassGovernance: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1113OrLater: true,
  preserveCompleteTraceability: true,
  preserveCertificationHistory: true,
  preserveAuditHistory: true,
  deterministicCertificationBehaviour: true,
  structuralSignalOnly: true,
  evidenceBasedOnly: true,
  maskSensitiveValues: true,
};

export function buildQSeriesCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<QSeriesCertificationConfiguration> = {},
): QSeriesCertificationConfiguration {
  let file: Partial<QSeriesCertificationConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "q-series-certification.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.Q_SERIES_CERTIFICATION_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.Q_SERIES_CERTIFICATION_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_Q_SERIES_CERTIFICATION_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_Q_SERIES_CERTIFICATION_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ?? file.reportingLine ?? DEFAULT_Q_SERIES_CERTIFICATION_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateCertificationEvidence: true,
    neverCertifyMissingFunctionality: true,
    neverBypassGovernance: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1113OrLater: true,
    preserveCompleteTraceability: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    deterministicCertificationBehaviour: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: QSeriesCertificationReport): QSeriesCertificationReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    assessments: report.assessments.map((a) => ({ ...a, supportingEvidence: [...a.supportingEvidence] })),
    metadataVersion: report.metadataVersion || QSCRT_METADATA_VERSION,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    deterministicCertificationBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateCertificationEvidence: true,
    neverCertifyMissingFunctionality: true,
    neverBypassGovernance: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1113OrLater: true,
  };
}
