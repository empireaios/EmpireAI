import { nextReportId } from "./audit-store.js";
import {
  QSCPT_METADATA_VERSION,
  Q_SERIES_COMPLETION_IDENTITY,
  Q_SERIES_COMPLETION_REPORT_VERSION,
  Q_SERIES_COMPLETION_RUNTIME_VERSION,
} from "./paths.js";
import type {
  AggregatedCompletionEvidence,
  CertificationCompletionSummary,
  CompletionReadinessClassification,
  FactoryCompletionSummary,
  FinalCompletionDecision,
  GovernanceCompletionSummary,
  MissionCompletionSummary,
  ProductionReadinessCompletion,
  Q1113ContractConsumption,
  QscptValidationReport,
  QSeriesCompletionRecord,
  QSeriesCompletionReport,
  RuntimeCompletionSummary,
  WorkerCompletionSummary,
} from "./types.js";

export type BuildReportParams = {
  reportId?: string | null;
  workerId: string;
  missionSummary: MissionCompletionSummary;
  factorySummary: FactoryCompletionSummary;
  workerSummary: WorkerCompletionSummary;
  runtimeSummary: RuntimeCompletionSummary;
  governanceSummary: GovernanceCompletionSummary;
  certificationSummary: CertificationCompletionSummary;
  productionReadinessSummary: ProductionReadinessCompletion;
  aggregated: AggregatedCompletionEvidence;
  readiness: CompletionReadinessClassification;
  finalCompletionDecision: FinalCompletionDecision;
  assessments: QSeriesCompletionRecord[];
  supportingEvidence: string[];
  outstandingIssues: string[];
  confidenceScore: number;
  validation: QscptValidationReport;
  q1113ContractConsumed: Q1113ContractConsumption;
};

export function buildReport(params: BuildReportParams): QSeriesCompletionReport {
  const now = new Date().toISOString();
  const reportId = params.reportId?.trim() || nextReportId();

  return {
    reportId,
    timestamp: now,
    completionVersion: Q_SERIES_COMPLETION_RUNTIME_VERSION,
    engineId: "PILLOW-QSCPT-001",
    missionId: "Q11-13",
    missionSummary: params.missionSummary,
    factorySummary: params.factorySummary,
    workerSummary: params.workerSummary,
    runtimeSummary: params.runtimeSummary,
    governanceSummary: params.governanceSummary,
    certificationSummary: params.certificationSummary,
    productionReadinessSummary: params.productionReadinessSummary,
    finalCompletionDecision: params.finalCompletionDecision,
    supportingEvidence: params.supportingEvidence,
    outstandingIssues: params.outstandingIssues,
    confidenceScore: params.confidenceScore,
    metadataVersion: QSCPT_METADATA_VERSION,
    reportVersion: Q_SERIES_COMPLETION_REPORT_VERSION,
    workerId: params.workerId,
    assessments: params.assessments,
    q1113ContractConsumed: params.q1113ContractConsumed,
    consumableByQ1201: params.validation.decision !== "fail" && params.finalCompletionDecision !== "escalate",
    neverImplementQ1201OrLater: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    validation: params.validation,
    traceabilityRefs: [`q11-13:q-series-completion`, `report:${reportId}`],
    runTimestamp: now,
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
  };
}

export function buildCatalog(
  workerId: string,
  reports: QSeriesCompletionReport[],
  integrations: import("./types.js").IntegrationHandshake[],
) {
  return {
    reportVersion: Q_SERIES_COMPLETION_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: QSCPT_METADATA_VERSION,
    neverFabricateCompletionEvidence: true as const,
    neverImplementQ1201OrLater: true as const,
  };
}

export { Q_SERIES_COMPLETION_IDENTITY };
