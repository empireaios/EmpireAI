import { nextReportId } from "./audit-store.js";
import {
  QSCRT_METADATA_VERSION,
  Q_SERIES_CERTIFICATION_IDENTITY,
  Q_SERIES_CERTIFICATION_REPORT_VERSION,
  Q_SERIES_CERTIFICATION_RUNTIME_VERSION,
} from "./paths.js";
import type {
  AggregatedCertificationEvidence,
  CertificationDecision,
  FactoryDiscoverySummary,
  GovernanceVerificationSummary,
  IntegrationHandshake,
  IntegrationVerificationSummary,
  ProductionReadinessVerification,
  Q1112ContractConsumption,
  QSeriesCertificationRecord,
  QSeriesReadinessClassification,
  QscrtValidationReport,
  QSeriesCertificationReport,
  RuntimeVerificationSummary,
  WorkerVerificationSummary,
} from "./types.js";

export type BuildReportParams = {
  reportId?: string | null;
  workerId: string;
  factorySummary: FactoryDiscoverySummary;
  workerSummary: WorkerVerificationSummary;
  runtimeSummary: RuntimeVerificationSummary;
  integrationSummary: IntegrationVerificationSummary;
  governanceSummary: GovernanceVerificationSummary;
  productionReadinessSummary: ProductionReadinessVerification;
  aggregated: AggregatedCertificationEvidence;
  readiness: QSeriesReadinessClassification;
  certificationDecision: CertificationDecision;
  assessments: QSeriesCertificationRecord[];
  supportingEvidence: string[];
  outstandingIssues: string[];
  confidenceScore: number;
  validation: QscrtValidationReport;
  q1112ContractConsumed: Q1112ContractConsumption;
};

export function buildReport(params: BuildReportParams): QSeriesCertificationReport {
  const now = new Date().toISOString();
  const reportId = params.reportId?.trim() || nextReportId();

  return {
    reportId,
    timestamp: now,
    certificationVersion: Q_SERIES_CERTIFICATION_RUNTIME_VERSION,
    engineId: "PILLOW-QSCRT-001",
    missionId: "Q11-12",
    factorySummary: params.factorySummary,
    workerSummary: params.workerSummary,
    runtimeSummary: params.runtimeSummary,
    integrationSummary: params.integrationSummary,
    governanceSummary: params.governanceSummary,
    productionReadinessSummary: params.productionReadinessSummary,
    certificationDecision: params.certificationDecision,
    supportingEvidence: params.supportingEvidence,
    outstandingIssues: params.outstandingIssues,
    confidenceScore: params.confidenceScore,
    metadataVersion: QSCRT_METADATA_VERSION,
    reportVersion: Q_SERIES_CERTIFICATION_REPORT_VERSION,
    workerId: params.workerId,
    assessments: params.assessments,
    q1112ContractConsumed: params.q1112ContractConsumed,
    consumableByQ1113: params.validation.decision !== "fail",
    neverImplementQ1113OrLater: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    validation: params.validation,
    traceabilityRefs: [`q11-12:q-series-certification`, `report:${reportId}`],
    runTimestamp: now,
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
  };
}

export function buildCatalog(
  workerId: string,
  reports: QSeriesCertificationReport[],
  integrations: IntegrationHandshake[],
) {
  return {
    reportVersion: Q_SERIES_CERTIFICATION_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: QSCRT_METADATA_VERSION,
    neverFabricateCertificationEvidence: true as const,
    neverImplementQ1113OrLater: true as const,
  };
}

export { Q_SERIES_CERTIFICATION_IDENTITY };
