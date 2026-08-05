import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { QSCPT_METADATA_VERSION, Q_SERIES_COMPLETION_IDENTITY, INTEGRATION_TARGETS } from "./paths.js";
import type { QSeriesCompletionReport } from "./types.js";

export type QSeriesCompletionConfiguration = {
  enabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: QSeriesCompletionReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q11-13 hard boundaries — force-locked true. */
  neverFabricateCompletionEvidence: true;
  neverMarkCompleteWhenUnmet: true;
  neverBypassGovernance: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1201OrLater: true;
  preserveCompleteTraceability: true;
  preserveCompletionHistory: true;
  preserveAuditHistory: true;
  deterministicCompletionBehaviour: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_Q_SERIES_COMPLETION_CONFIGURATION: QSeriesCompletionConfiguration = {
  enabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: Q_SERIES_COMPLETION_IDENTITY.workerId,
  workerName: Q_SERIES_COMPLETION_IDENTITY.workerName,
  factory: Q_SERIES_COMPLETION_IDENTITY.factory,
  department: Q_SERIES_COMPLETION_IDENTITY.department,
  role: Q_SERIES_COMPLETION_IDENTITY.role,
  reportingLine: [...Q_SERIES_COMPLETION_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateCompletionEvidence: true,
  neverMarkCompleteWhenUnmet: true,
  neverBypassGovernance: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1201OrLater: true,
  preserveCompleteTraceability: true,
  preserveCompletionHistory: true,
  preserveAuditHistory: true,
  deterministicCompletionBehaviour: true,
  structuralSignalOnly: true,
  evidenceBasedOnly: true,
  maskSensitiveValues: true,
};

export function buildQSeriesCompletionConfiguration(
  repositoryRoot?: string,
  overrides: Partial<QSeriesCompletionConfiguration> = {},
): QSeriesCompletionConfiguration {
  let file: Partial<QSeriesCompletionConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "q-series-completion.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.Q_SERIES_COMPLETION_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.Q_SERIES_COMPLETION_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_Q_SERIES_COMPLETION_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_Q_SERIES_COMPLETION_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ?? file.reportingLine ?? DEFAULT_Q_SERIES_COMPLETION_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateCompletionEvidence: true,
    neverMarkCompleteWhenUnmet: true,
    neverBypassGovernance: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1201OrLater: true,
    preserveCompleteTraceability: true,
    preserveCompletionHistory: true,
    preserveAuditHistory: true,
    deterministicCompletionBehaviour: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: QSeriesCompletionReport): QSeriesCompletionReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    assessments: report.assessments.map((a) => ({ ...a, supportingEvidence: [...a.supportingEvidence] })),
    metadataVersion: report.metadataVersion || QSCPT_METADATA_VERSION,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveCompletionHistory: true,
    preserveAuditHistory: true,
    deterministicCompletionBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateCompletionEvidence: true,
    neverMarkCompleteWhenUnmet: true,
    neverBypassGovernance: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1201OrLater: true,
  };
}
