import { nextReportId } from "./audit-store.js";
import {
  PCART_METADATA_VERSION,
  PILLOW_COMMAND_AUDIT_REPORT_VERSION,
  PILLOW_COMMAND_AUDIT_RUNTIME_VERSION,
} from "./paths.js";
import type {
  AssignmentSummary,
  AuditStatus,
  CommandReadinessSummary,
  CommunicationSummary,
  GovernanceSummary,
  IntegrationHandshake,
  IntegrationVerification,
  PcartCatalog,
  PcartValidationReport,
  PillowCommandAssessment,
  PillowCommandAuditReport,
  Q1103ContractConsumption,
  ReadinessDecision,
  RegisteredWorkerRecord,
  SupervisionSummary,
} from "./types.js";

export function computeConfidenceScore(commandReadinessSummary: CommandReadinessSummary): number {
  return commandReadinessSummary.overallReadinessScore;
}

export function buildOutstandingIssues(
  matrix: PillowCommandAssessment[],
  governanceSummary: GovernanceSummary,
  integrationVerification: IntegrationVerification,
  commandReadinessSummary: CommandReadinessSummary,
): string[] {
  const outstandingIssues: string[] = [];

  for (const row of matrix) {
    if (row.readinessClassification === "Failed") {
      outstandingIssues.push(`${row.workerId}: failed command readiness — ${row.supportingEvidence.join("; ")}`);
    } else if (row.readinessClassification === "Missing") {
      outstandingIssues.push(`${row.workerId}: missing structural evidence — ${row.supportingEvidence.join("; ")}`);
    } else if (row.readinessClassification === "Partially Ready") {
      outstandingIssues.push(`${row.workerId}: partially command-ready — ${row.supportingEvidence.join("; ")}`);
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
  if (!commandReadinessSummary.ready) {
    outstandingIssues.push(
      `Command readiness incomplete: ${commandReadinessSummary.readyCount}/${commandReadinessSummary.totalWorkers} workers Ready`,
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
  commandMatrix: PillowCommandAssessment[];
  governanceSummary: GovernanceSummary;
  assignmentSummary: AssignmentSummary;
  communicationSummary: CommunicationSummary;
  supervisionSummary: SupervisionSummary;
  integrationVerification: IntegrationVerification;
  commandReadinessSummary: CommandReadinessSummary;
  q1103ContractConsumed: Q1103ContractConsumption;
  commandReadinessDecision: ReadinessDecision;
  outstandingIssues: string[];
  validation: PcartValidationReport;
  workerId: string;
  consumableByQ1104: boolean;
};

export function buildReport(params: BuildReportParams): PillowCommandAuditReport {
  const now = new Date().toISOString();
  const confidenceScore = computeConfidenceScore(params.commandReadinessSummary);

  return {
    reportId: params.reportId?.trim() || nextReportId(),
    timestamp: now,
    auditVersion: PILLOW_COMMAND_AUDIT_RUNTIME_VERSION,
    totalWorkersAudited: params.commandReadinessSummary.totalWorkers,
    successfullyControlledWorkers: params.commandReadinessSummary.readyCount,
    partiallyControlledWorkers: params.commandReadinessSummary.partiallyReadyCount,
    failedCommandTests: params.commandReadinessSummary.failedCount,
    missingCommandWorkers: params.commandReadinessSummary.missingCount,
    blockedCommandWorkers: params.commandReadinessSummary.blockedCount,
    deferredCommandWorkers: params.commandReadinessSummary.deferredCount,
    communicationSummary: params.communicationSummary,
    assignmentSummary: params.assignmentSummary,
    supervisionSummary: params.supervisionSummary,
    governanceSummary: params.governanceSummary,
    supportingEvidence: params.commandMatrix.flatMap((row) =>
      row.supportingEvidence.map((e) => `${row.workerId}: ${e}`),
    ),
    outstandingIssues: params.outstandingIssues,
    confidenceScore,
    metadataVersion: PCART_METADATA_VERSION,
    reportVersion: PILLOW_COMMAND_AUDIT_REPORT_VERSION,
    workerId: params.workerId,
    commandReadinessDecision: params.commandReadinessDecision,
    validation: params.validation,
    consumableByQ1104: params.consumableByQ1104,
    neverImplementQ1104OrLater: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    firstPillowCommandGate: true,
    q1103ContractConsumed: params.q1103ContractConsumed,
    workerInventory: params.workerInventory,
    commandMatrix: params.commandMatrix,
    commandReadinessSummary: params.commandReadinessSummary,
    integrationSummary: params.integrationVerification,
    auditStatus: mapDecisionToAuditStatus(params.commandReadinessDecision, params.validation.decision),
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs: [
      "q11-03:pillow-command-audit",
      ...params.commandMatrix.map(
        (row) => `worker:${row.workerId}:classification:${row.readinessClassification}`,
      ),
    ],
    runTimestamp: now,
    preserveCompleteTraceability: true,
    preserveImmutableAuditHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateAuditEvidence: true,
    neverCertifyUnverifiedCommandCapability: true,
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
  reports: PillowCommandAuditReport[],
  integrations: IntegrationHandshake[],
): PcartCatalog {
  return {
    reportVersion: PILLOW_COMMAND_AUDIT_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: PCART_METADATA_VERSION,
    executiveAuthority: "pillow",
    neverFabricateAuditEvidence: true,
    neverAssumeImplementation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1104OrLater: true,
    thirdQ11Gate: true,
  };
}
