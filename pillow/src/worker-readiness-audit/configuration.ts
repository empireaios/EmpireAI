import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { INTEGRATION_TARGETS, WRART_METADATA_VERSION, WORKER_READINESS_AUDIT_IDENTITY } from "./paths.js";
import type { WorkerReadinessAuditReport } from "./types.js";

export type WorkerReadinessAuditConfiguration = {
  enabled: boolean;
  discoveryEnabled: boolean;
  reachabilityProbingEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: WorkerReadinessAuditReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q11-02 hard boundaries — force-locked true. */
  neverFabricateAuditEvidence: true;
  neverCertifyMissingWorkers: true;
  neverCertifyUnreachableWorkers: true;
  neverAssumeImplementation: true;
  neverModifyWorkerImplementations: true;
  neverRepairFailedWorkers: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1103OrLater: true;
  preserveCompleteTraceability: true;
  preserveImmutableAuditHistory: true;
  preserveAuditHistory: true;
  deterministicAuditBehaviour: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_WORKER_READINESS_AUDIT_CONFIGURATION: WorkerReadinessAuditConfiguration = {
  enabled: true,
  discoveryEnabled: true,
  reachabilityProbingEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: WORKER_READINESS_AUDIT_IDENTITY.workerId,
  workerName: WORKER_READINESS_AUDIT_IDENTITY.workerName,
  factory: WORKER_READINESS_AUDIT_IDENTITY.factory,
  department: WORKER_READINESS_AUDIT_IDENTITY.department,
  role: WORKER_READINESS_AUDIT_IDENTITY.role,
  reportingLine: [...WORKER_READINESS_AUDIT_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateAuditEvidence: true,
  neverCertifyMissingWorkers: true,
  neverCertifyUnreachableWorkers: true,
  neverAssumeImplementation: true,
  neverModifyWorkerImplementations: true,
  neverRepairFailedWorkers: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1103OrLater: true,
  preserveCompleteTraceability: true,
  preserveImmutableAuditHistory: true,
  preserveAuditHistory: true,
  deterministicAuditBehaviour: true,
  structuralSignalOnly: true,
  evidenceBasedOnly: true,
  maskSensitiveValues: true,
};

export function buildWorkerReadinessAuditConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkerReadinessAuditConfiguration> = {},
): WorkerReadinessAuditConfiguration {
  let file: Partial<WorkerReadinessAuditConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "worker-readiness-audit.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.WORKER_READINESS_AUDIT_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.WORKER_READINESS_AUDIT_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_WORKER_READINESS_AUDIT_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_WORKER_READINESS_AUDIT_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_WORKER_READINESS_AUDIT_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateAuditEvidence: true,
    neverCertifyMissingWorkers: true,
    neverCertifyUnreachableWorkers: true,
    neverAssumeImplementation: true,
    neverModifyWorkerImplementations: true,
    neverRepairFailedWorkers: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1103OrLater: true,
    preserveCompleteTraceability: true,
    preserveImmutableAuditHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: WorkerReadinessAuditReport): WorkerReadinessAuditReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    workerInventory: [...report.workerInventory],
    readinessMatrix: [...report.readinessMatrix],
    metadataVersion: report.metadataVersion || WRART_METADATA_VERSION,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveImmutableAuditHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateAuditEvidence: true,
    neverCertifyMissingWorkers: true,
    neverCertifyUnreachableWorkers: true,
    neverAssumeImplementation: true,
    neverModifyWorkerImplementations: true,
    neverRepairFailedWorkers: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1103OrLater: true,
    firstWorkerReadinessGate: true,
  };
}
