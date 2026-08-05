import { nextReportId } from "./audit-store.js";
import {
  PLMRT_METADATA_VERSION,
  POST_LAUNCH_MONITORING_IDENTITY,
  POST_LAUNCH_MONITORING_REPORT_VERSION,
  POST_LAUNCH_MONITORING_RUNTIME_VERSION,
} from "./paths.js";
import type {
  AlertSummary,
  ApiMonitoringSummary,
  FactoryMonitoringSummary,
  GrandKingAcceptanceVerification,
  IncidentSummary,
  IntegrationHandshake,
  PlmrtValidationReport,
  PostLaunchMonitoringAssessment,
  PostLaunchMonitoringReport,
  ProductionHealthSummary,
  Q1111ContractConsumption,
  RuntimeMonitoringSummary,
  WorkerMonitoringSummary,
  WorkflowMonitoringSummary,
} from "./types.js";

export type BuildReportParams = {
  reportId?: string | null;
  workerId: string;
  verification: GrandKingAcceptanceVerification;
  productionHealthSummary: ProductionHealthSummary;
  workerSummary: WorkerMonitoringSummary;
  factorySummary: FactoryMonitoringSummary;
  runtimeSummary: RuntimeMonitoringSummary;
  apiSummary: ApiMonitoringSummary;
  workflowSummary: WorkflowMonitoringSummary;
  incidentSummary: IncidentSummary;
  alertSummary: AlertSummary;
  abnormalWorkers: PostLaunchMonitoringAssessment[];
  supportingEvidence: string[];
  outstandingRisks: string[];
  confidenceScore: number;
  validation: PlmrtValidationReport;
  q1111ContractConsumed: Q1111ContractConsumption;
};

export function buildReport(params: BuildReportParams): PostLaunchMonitoringReport {
  const now = new Date().toISOString();
  const reportId = params.reportId?.trim() || nextReportId();
  const productionActive = params.verification.productionActiveMonitoring;
  const assessments = [
    ...params.workerSummary.assessments,
    ...params.factorySummary.assessments,
    ...params.workflowSummary.assessments,
    ...params.runtimeSummary.assessments,
    ...params.apiSummary.assessments,
    ...params.abnormalWorkers,
  ];

  return {
    reportId,
    timestamp: now,
    monitoringVersion: POST_LAUNCH_MONITORING_RUNTIME_VERSION,
    engineId: "PILLOW-PLMRT-001",
    missionId: "Q11-11",
    productionHealthSummary: params.productionHealthSummary,
    workerSummary: params.workerSummary,
    factorySummary: params.factorySummary,
    runtimeSummary: params.runtimeSummary,
    apiSummary: params.apiSummary,
    workflowSummary: params.workflowSummary,
    incidentSummary: params.incidentSummary,
    alertSummary: params.alertSummary,
    businessImpactSummary: {
      computedAt: now,
      level: params.productionHealthSummary.businessImpact,
      rationale: params.outstandingRisks.slice(0, 5),
      evidence: params.supportingEvidence.slice(0, 10),
    },
    supportingEvidence: params.supportingEvidence,
    outstandingRisks: params.outstandingRisks,
    confidenceScore: params.confidenceScore,
    metadataVersion: PLMRT_METADATA_VERSION,
    reportVersion: POST_LAUNCH_MONITORING_REPORT_VERSION,
    workerId: params.workerId,
    assessments,
    grandKingAcceptanceGranted: params.verification.grandKingAcceptanceGranted,
    productionActiveMonitoring: productionActive,
    q1111ContractConsumed: params.q1111ContractConsumed,
    consumableByQ1112: params.validation.decision !== "fail",
    neverImplementQ1112OrLater: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    validation: params.validation,
    traceabilityRefs: [`q11-11:post-launch-monitoring`, `report:${reportId}`],
    runTimestamp: now,
    preserveCompleteTraceability: true,
    preserveMonitoringHistory: true,
    preserveAuditHistory: true,
    deterministicMonitoringBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateProductionEvidence: true,
    neverSuppressCriticalIncidents: true,
    neverHideFailures: true,
    neverAutoModifyProduction: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
  };
}

export function buildCatalog(
  workerId: string,
  reports: PostLaunchMonitoringReport[],
  integrations: IntegrationHandshake[],
) {
  return {
    reportVersion: POST_LAUNCH_MONITORING_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: PLMRT_METADATA_VERSION,
    neverFabricateProductionEvidence: true as const,
    neverSuppressCriticalIncidents: true as const,
    neverImplementQ1112OrLater: true as const,
  };
}

export { POST_LAUNCH_MONITORING_IDENTITY };
