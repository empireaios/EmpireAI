import {
  MISSION_PLANNING_ENGINE_REPORT_VERSION,
  MPENG_METADATA_VERSION,
} from "./paths.js";
import type {
  AcceptanceCriterion,
  ExecutionStep,
  ImplementationDependency,
  ImplementationRisk,
  IntegrationPoint,
  MissionAnalysis,
  MissionPlan,
  MissionPlanningReport,
  MpengValidation,
  Q1302Observation,
  Q1303ContractConsumed,
  Q1303Prerequisite,
  RepositorySnapshotSummary,
  ValidationStrategyItem,
} from "./types.js";

export function buildReport(params: {
  reportId: string;
  workerId: string;
  missionSummary: MissionAnalysis;
  repositorySnapshot: RepositorySnapshotSummary;
  riengReportId: string | null;
  riengConfidence: number | null;
  dependencyNodeCount: number | null;
  dependencies: ImplementationDependency[];
  executionPlan: ExecutionStep[];
  integrationPoints: IntegrationPoint[];
  validationStrategy: ValidationStrategyItem[];
  acceptanceCriteria: AcceptanceCriterion[];
  risks: ImplementationRisk[];
  plans: MissionPlan[];
  validation: MpengValidation;
  confidenceScore: number;
  q1303ContractConsumed: Q1303ContractConsumed;
  q1303Prerequisite: Q1303Prerequisite;
  q1302Observation: Q1302Observation;
  supportingEvidence: string[];
  outstandingIssues: string[];
  historyRefs: string[];
}): MissionPlanningReport {
  const timestamp = new Date().toISOString();
  const requiredCount = params.dependencies.filter((d) => d.required).length;

  return {
    reportId: params.reportId,
    reportVersion: MISSION_PLANNING_ENGINE_REPORT_VERSION,
    metadataVersion: MPENG_METADATA_VERSION,
    engineId: "PILLOW-MPENG-001",
    timestamp,
    runTimestamp: timestamp,
    workerId: params.workerId,
    missionId: "Q13-03",
    missionSummary: params.missionSummary,
    repositoryIntelligenceSummary: {
      reportId: params.riengReportId,
      confidenceScore: params.riengConfidence,
      repositorySnapshot: params.repositorySnapshot,
      dependencyNodeCount: params.dependencyNodeCount,
    },
    dependencySummary: {
      count: params.dependencies.length,
      requiredCount,
      entries: params.dependencies.map((d) => ({ ...d, evidence: [...d.evidence] })),
    },
    executionPlan: params.executionPlan.map((step) => ({ ...step })),
    integrationSummary: {
      count: params.integrationPoints.length,
      points: params.integrationPoints.map((p) => ({ ...p, evidence: [...p.evidence] })),
    },
    validationStrategy: params.validationStrategy.map((v) => ({ ...v })),
    acceptanceCriteria: params.acceptanceCriteria.map((a) => ({ ...a })),
    riskSummary: {
      count: params.risks.length,
      risks: params.risks.map((r) => ({ ...r, evidence: [...r.evidence] })),
    },
    confidenceScore: params.confidenceScore,
    plans: params.plans.map((plan) => JSON.parse(JSON.stringify(plan)) as MissionPlan),
    q1303ContractConsumed: params.q1303ContractConsumed,
    q1303Prerequisite: params.q1303Prerequisite,
    q1302Observation: params.q1302Observation,
    consumableByQ1304: params.validation.decision !== "failed",
    neverImplementQ1304OrLater: true,
    neverModifyRepository: true,
    neverExecuteImplementation: true,
    neverFabricateRepositoryState: true,
    neverBypassGovernance: true,
    neverAutoDeploy: true,
    preservePlanningHistory: true,
    planningOnly: true,
    supportingEvidence: [...params.supportingEvidence],
    outstandingIssues: [...params.outstandingIssues],
    traceabilityRefs: [
      "q13-03:mission-planning-engine",
      `report:${params.reportId}`,
      `mission:${params.missionSummary.missionId || "Q13-03"}`,
    ],
    validation: params.validation,
    historyRefs: [...params.historyRefs],
  };
}

export function buildCatalog(
  workerId: string,
  reports: MissionPlanningReport[],
  plans: MissionPlan[],
  integrations: import("./types.js").IntegrationHandshake[],
  planningHistoryCount: number,
) {
  return {
    workerId,
    reports: reports.map((report) => ({
      reportId: report.reportId,
      timestamp: report.timestamp,
      confidenceScore: report.confidenceScore,
    })),
    plans: plans.map((plan) => ({
      planId: plan.planId,
      missionId: plan.missionId,
      timestamp: plan.timestamp,
    })),
    integrations: integrations.map((handshake) => ({ ...handshake })),
    planningHistoryCount,
  };
}
