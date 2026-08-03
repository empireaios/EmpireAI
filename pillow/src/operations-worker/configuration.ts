import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  OPERATIONS_WORKER_IDENTITY,
  OPSW_METADATA_VERSION,
} from "./paths.js";
import type { OperationsReport } from "./types.js";

export type OperationsWorkerConfiguration = {
  enabled: boolean;
  operationsRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: OperationsReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q7-09 hard boundaries — force-locked true. */
  neverFabricateOperationalEvidence: true;
  neverPerformCustomerServices: true;
  neverReplaceBookingWorker: true;
  neverReplaceCrmWorker: true;
  neverReplaceLeadGenerationWorker: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ710OrLater: true;
  preserveCompleteOperationalTraceability: true;
  preserveWorkflowAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_OPERATIONS_WORKER_CONFIGURATION: OperationsWorkerConfiguration = {
  enabled: true,
  operationsRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: OPERATIONS_WORKER_IDENTITY.workerId,
  workerName: OPERATIONS_WORKER_IDENTITY.workerName,
  factory: OPERATIONS_WORKER_IDENTITY.factory,
  department: OPERATIONS_WORKER_IDENTITY.department,
  role: OPERATIONS_WORKER_IDENTITY.role,
  reportingLine: [...OPERATIONS_WORKER_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateOperationalEvidence: true,
  neverPerformCustomerServices: true,
  neverReplaceBookingWorker: true,
  neverReplaceCrmWorker: true,
  neverReplaceLeadGenerationWorker: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ710OrLater: true,
  preserveCompleteOperationalTraceability: true,
  preserveWorkflowAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildOperationsWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<OperationsWorkerConfiguration> = {},
): OperationsWorkerConfiguration {
  let file: Partial<OperationsWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "operations-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.OPERATIONS_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.OPERATIONS_WORKER_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_OPERATIONS_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_OPERATIONS_WORKER_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_OPERATIONS_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) =>
      lockReport(report),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverFabricateOperationalEvidence: true,
    neverPerformCustomerServices: true,
    neverReplaceBookingWorker: true,
    neverReplaceCrmWorker: true,
    neverReplaceLeadGenerationWorker: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ710OrLater: true,
    preserveCompleteOperationalTraceability: true,
    preserveWorkflowAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: OperationsReport): OperationsReport {
  return {
    ...report,
    operationalStages: report.operationalStages.map((stage) => ({
      ...stage,
      dependencies: [...stage.dependencies],
      notes: [...stage.notes],
    })),
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    metadataVersion: report.metadataVersion || OPSW_METADATA_VERSION,
    consumableByQ710: true,
    neverFabricateOperationalEvidence: true,
    neverPerformCustomerServices: true,
    neverReplaceBookingWorker: true,
    neverReplaceCrmWorker: true,
    neverReplaceLeadGenerationWorker: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ710OrLater: true,
    preserveCompleteOperationalTraceability: true,
    preserveWorkflowAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
