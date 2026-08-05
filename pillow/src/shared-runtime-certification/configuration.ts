import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  SRCRT_METADATA_VERSION,
  SHARED_RUNTIME_CERTIFICATION_IDENTITY,
} from "./paths.js";
import type { SharedRuntimeCertificationReport } from "./types.js";

export type SharedRuntimeCertificationConfiguration = {
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
  seedReports: SharedRuntimeCertificationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q10-14 hard boundaries — force-locked true. */
  neverFabricateCertificationEvidence: true;
  neverCertifyMissingFunctionality: true;
  neverAssumeImplementation: true;
  neverImplementMissingRuntimes: true;
  neverModifyRuntimeBehaviour: true;
  neverAutomaticallyFixFailures: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1101OrLater: true;
  preserveCompleteTraceability: true;
  preserveImmutableCertificationHistory: true;
  preserveCertificationHistory: true;
  preserveAuditHistory: true;
  deterministicCertification: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_SHARED_RUNTIME_CERTIFICATION_CONFIGURATION: SharedRuntimeCertificationConfiguration =
  {
    enabled: true,
    evidenceScanEnabled: true,
    runtimeProbingEnabled: true,
    executiveReportingEnabled: true,
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: SHARED_RUNTIME_CERTIFICATION_IDENTITY.workerId,
    workerName: SHARED_RUNTIME_CERTIFICATION_IDENTITY.workerName,
    factory: SHARED_RUNTIME_CERTIFICATION_IDENTITY.factory,
    department: SHARED_RUNTIME_CERTIFICATION_IDENTITY.department,
    role: SHARED_RUNTIME_CERTIFICATION_IDENTITY.role,
    reportingLine: [...SHARED_RUNTIME_CERTIFICATION_IDENTITY.reportingLine],
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverFabricateCertificationEvidence: true,
    neverCertifyMissingFunctionality: true,
    neverAssumeImplementation: true,
    neverImplementMissingRuntimes: true,
    neverModifyRuntimeBehaviour: true,
    neverAutomaticallyFixFailures: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1101OrLater: true,
    preserveCompleteTraceability: true,
    preserveImmutableCertificationHistory: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    deterministicCertification: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };

export function buildSharedRuntimeCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SharedRuntimeCertificationConfiguration> = {},
): SharedRuntimeCertificationConfiguration {
  let file: Partial<SharedRuntimeCertificationConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "shared-runtime-certification.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.SHARED_RUNTIME_CERTIFICATION_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.SHARED_RUNTIME_CERTIFICATION_RETRY_ATTEMPTS ?? "",
    10,
  );

  return {
    ...DEFAULT_SHARED_RUNTIME_CERTIFICATION_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_SHARED_RUNTIME_CERTIFICATION_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_SHARED_RUNTIME_CERTIFICATION_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) =>
      lockReport(report),
    ),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateCertificationEvidence: true,
    neverCertifyMissingFunctionality: true,
    neverAssumeImplementation: true,
    neverImplementMissingRuntimes: true,
    neverModifyRuntimeBehaviour: true,
    neverAutomaticallyFixFailures: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1101OrLater: true,
    preserveCompleteTraceability: true,
    preserveImmutableCertificationHistory: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    deterministicCertification: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(
  report: SharedRuntimeCertificationReport,
): SharedRuntimeCertificationReport {
  return {
    ...report,
    risks: [...report.risks],
    outstandingIssues: [...report.outstandingIssues],
    supportingEvidence: [...report.supportingEvidence],
    traceabilityRefs: [...report.traceabilityRefs],
    metadataVersion: report.metadataVersion || SRCRT_METADATA_VERSION,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveImmutableCertificationHistory: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    deterministicCertification: true,
    maskSensitiveValues: true,
    neverFabricateCertificationEvidence: true,
    neverCertifyMissingFunctionality: true,
    neverAssumeImplementation: true,
    neverImplementMissingRuntimes: true,
    neverModifyRuntimeBehaviour: true,
    neverAutomaticallyFixFailures: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1101OrLater: true,
    finalQ10Gate: true,
  };
}
