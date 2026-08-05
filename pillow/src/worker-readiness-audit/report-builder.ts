import { nextReportId } from "./audit-store.js";
import {
  WRART_METADATA_VERSION,
  WORKER_READINESS_AUDIT_REPORT_VERSION,
  WORKER_READINESS_AUDIT_RUNTIME_VERSION,
} from "./paths.js";
import type {
  AuditStatus,
  CapabilitySummary,
  GovernanceSummary,
  IntegrationHandshake,
  IntegrationVerification,
  Q1102ContractConsumption,
  ReadinessDecision,
  ReadinessSummary,
  RegisteredWorkerRecord,
  RuntimeSummary,
  WorkerReadinessAssessment,
  WorkerReadinessAuditReport,
  WrartCatalog,
  WrartValidationReport,
} from "./types.js";

export function computeConfidenceScore(readinessSummary: ReadinessSummary): number {
  return readinessSummary.overallReadinessScore;
}

export function buildOutstandingIssues(
  matrix: WorkerReadinessAssessment[],
  governanceSummary: GovernanceSummary,
  integrationVerification: IntegrationVerification,
  readinessSummary: ReadinessSummary,
): string[] {
  const outstandingIssues: string[] = [];

  for (const row of matrix) {
    if (row.readinessClassification === "Failed") {
      outstandingIssues.push(`${row.workerId}: failed readiness — ${row.supportingEvidence.join("; ")}`);
    } else if (row.readinessClassification === "Missing") {
      outstandingIssues.push(`${row.workerId}: missing structural evidence — ${row.supportingEvidence.join("; ")}`);
    } else if (row.readinessClassification === "Partially Ready") {
      outstandingIssues.push(`${row.workerId}: partially ready — ${row.supportingEvidence.join("; ")}`);
    } else if (row.readinessClassification === "Blocked") {
      outstandingIssues.push(`${row.workerId}: blocked — ${row.supportingEvidence.join("; ")}`);
    }
  }

  if (!governanceSummary.compliant) {
    outstandingIssues.push(`Governance: ${governanceSummary.evidence.join("; ")}`);
  }
  if (!integrationVerification.allBound) {
    outstandingIssues.push(
      `Integration incomplete: ${integrationVerification.boundCount}/${integrationVerification.totalTargets} targets bound`,
    );
  }
  if (!readinessSummary.ready) {
    outstandingIssues.push(
      `Worker readiness incomplete: ${readinessSummary.readyCount}/${readinessSummary.totalWorkers} workers Ready`,
    );
  }

  return outstandingIssues;
}

export function mapDecisionToAuditStatus(
  decision: ReadinessDecision,
  validationDecision: "pass" | "partial" | "fail",
): AuditStatus {
  if (validationDecision === "fail") return "rejected";
  switch (decision) {
    case "Ready":
      return "ready";
    case "Conditionally_Ready":
      return "conditionally_ready";
    case "Not_Ready":
      return "not_ready";
    case "Failed":
      return "failed";
    case "Deferred":
      return "deferred";
    default:
      return "unknown";
  }
}

export type BuildReportParams = {
  reportId?: string | null;
  workerInventory: RegisteredWorkerRecord[];
  readinessMatrix: WorkerReadinessAssessment[];
  governanceSummary: GovernanceSummary;
  runtimeSummary: RuntimeSummary;
  capabilitySummary: CapabilitySummary;
  integrationVerification: IntegrationVerification;
  readinessSummary: ReadinessSummary;
  q1102ContractConsumed: Q1102ContractConsumption;
  readinessDecision: ReadinessDecision;
  outstandingIssues: string[];
  validation: WrartValidationReport;
  workerId: string;
  consumableByQ1103: boolean;
};

export function buildReport(params: BuildReportParams): WorkerReadinessAuditReport {
  const now = new Date().toISOString();
  const confidenceScore = computeConfidenceScore(params.readinessSummary);

  return {
    reportId: params.reportId?.trim() || nextReportId(),
    timestamp: now,
    auditVersion: WORKER_READINESS_AUDIT_RUNTIME_VERSION,
    totalWorkers: params.readinessSummary.totalWorkers,
    readyWorkers: params.readinessSummary.readyCount,
    partiallyReadyWorkers: params.readinessSummary.partiallyReadyCount,
    failedWorkers: params.readinessSummary.failedCount,
    missingWorkers: params.readinessSummary.missingCount,
    blockedWorkers: params.readinessSummary.blockedCount,
    deferredWorkers: params.readinessSummary.deferredCount,
    governanceSummary: params.governanceSummary,
    runtimeSummary: params.runtimeSummary,
    capabilitySummary: params.capabilitySummary,
    supportingEvidence: params.readinessMatrix.flatMap((row) =>
      row.supportingEvidence.map((e) => `${row.workerId}: ${e}`),
    ),
    outstandingIssues: params.outstandingIssues,
    confidenceScore,
    metadataVersion: WRART_METADATA_VERSION,
    reportVersion: WORKER_READINESS_AUDIT_REPORT_VERSION,
    workerId: params.workerId,
    readinessDecision: params.readinessDecision,
    validation: params.validation,
    consumableByQ1103: params.consumableByQ1103,
    neverImplementQ1103OrLater: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    firstWorkerReadinessGate: true,
    q1102ContractConsumed: params.q1102ContractConsumed,
    workerInventory: params.workerInventory,
    readinessMatrix: params.readinessMatrix,
    readinessSummary: params.readinessSummary,
    integrationSummary: params.integrationVerification,
    auditStatus: mapDecisionToAuditStatus(params.readinessDecision, params.validation.decision),
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs: [
      "q11-02:worker-readiness-audit",
      ...params.readinessMatrix.map((row) => `worker:${row.workerId}:classification:${row.readinessClassification}`),
    ],
    runTimestamp: now,
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
  };
}

export function buildCatalog(
  workerId: string,
  reports: WorkerReadinessAuditReport[],
  integrations: IntegrationHandshake[],
): WrartCatalog {
  return {
    reportVersion: WORKER_READINESS_AUDIT_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: WRART_METADATA_VERSION,
    executiveAuthority: "pillow",
    neverFabricateAuditEvidence: true,
    neverAssumeImplementation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1103OrLater: true,
    secondQ11Gate: true,
  };
}
