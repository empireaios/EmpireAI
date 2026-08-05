import {
  CURSOR_SPECIFICATION_GENERATOR_REPORT_VERSION,
  CSGEN_METADATA_VERSION,
} from "./paths.js";
import type {
  BoundaryValidation,
  CompletenessValidation,
  CursorSpecification,
  CursorSpecificationReport,
  CsgenValidation,
  GenerationPrerequisite,
  GovernanceValidation,
  ImplementationSpecificationReference,
  MissionPlanReference,
  Q1302Observation,
  Q1303ContractConsumed,
  Q1304ContractConsumed,
  RepositorySnapshotReference,
  RoadmapMissionInput,
} from "./types.js";

export function buildReport(params: {
  reportId: string;
  workerId: string;
  mission: RoadmapMissionInput;
  repositorySnapshot: RepositorySnapshotReference;
  riengReportId: string | null;
  riengConfidence: number | null;
  missionPlanRef: MissionPlanReference & { confidenceScore: number | null };
  isengRef: ImplementationSpecificationReference;
  generatedCursorSpecification: CursorSpecification | null;
  boundaryValidation: BoundaryValidation;
  governanceValidation: GovernanceValidation;
  completenessValidation: CompletenessValidation;
  validation: CsgenValidation;
  confidenceScore: number;
  q1304ContractConsumed: Q1304ContractConsumed;
  q1303ContractConsumed: Q1303ContractConsumed;
  q1302Observation: Q1302Observation;
  generationPrerequisite: GenerationPrerequisite;
  supportingEvidence: string[];
  outstandingIssues: string[];
  historyRefs: string[];
}): CursorSpecificationReport {
  const timestamp = new Date().toISOString();
  const specGenerated = params.generatedCursorSpecification !== null;

  return {
    reportId: params.reportId,
    reportVersion: CURSOR_SPECIFICATION_GENERATOR_REPORT_VERSION,
    metadataVersion: CSGEN_METADATA_VERSION,
    engineId: "PILLOW-CSGEN-001",
    timestamp,
    runTimestamp: timestamp,
    workerId: params.workerId,
    missionId: "Q13-04",
    missionSummary: {
      missionId: params.mission.missionId || "Q13-04",
      missionName: params.mission.missionName || "Cursor Specification Generator",
      deliverable: params.mission.deliverable || "Cursor Specification Generator module",
      programme: params.mission.programme ?? "Q13",
    },
    sourceOfTruthSummary: "docs/governance/EMPIREAI_CURSOR_SPECIFICATION_GENERATOR_SYSTEM.md",
    repositoryIntelligenceReference: {
      reportId: params.riengReportId,
      confidenceScore: params.riengConfidence,
      snapshot: params.repositorySnapshot,
    },
    missionPlanningReference: params.missionPlanRef,
    implementationSpecificationReference: params.isengRef,
    generatedCursorSpecification: params.generatedCursorSpecification
      ? JSON.parse(JSON.stringify(params.generatedCursorSpecification))
      : null,
    boundaryValidation: params.boundaryValidation,
    governanceValidation: params.governanceValidation,
    completenessValidation: params.completenessValidation,
    outstandingIssues: [...params.outstandingIssues],
    confidenceScore: params.confidenceScore,
    q1304ContractConsumed: params.q1304ContractConsumed,
    q1303ContractConsumed: params.q1303ContractConsumed,
    q1302Observation: params.q1302Observation,
    generationPrerequisite: params.generationPrerequisite,
    consumableByQ1305: specGenerated && params.validation.decision !== "failed",
    neverImplementQ1305OrLater: true,
    neverImplementCode: true,
    neverExecuteCursorMissions: true,
    neverSelfApprove: true,
    neverInventMissions: true,
    neverFabricateRepositoryFindings: true,
    neverBypassGovernance: true,
    specificationOnly: true,
    preserveSpecificationHistory: true,
    supportingEvidence: [...params.supportingEvidence],
    traceabilityRefs: [
      "q13-04:cursor-specification-generator",
      `report:${params.reportId}`,
      `mission:${params.mission.missionId || "Q13-04"}`,
    ],
    validation: params.validation,
    historyRefs: [...params.historyRefs],
  };
}

export function buildCatalog(
  workerId: string,
  reports: CursorSpecificationReport[],
  specifications: CursorSpecification[],
  integrations: import("./types.js").IntegrationHandshake[],
  specificationHistoryCount: number,
) {
  return {
    workerId,
    reports: reports.map((report) => ({
      reportId: report.reportId,
      timestamp: report.timestamp,
      confidenceScore: report.confidenceScore,
    })),
    specifications: specifications.map((spec) => ({
      cursorSpecificationId: spec.cursorSpecificationId,
      missionId: spec.missionId,
      timestamp: spec.timestamp,
    })),
    integrations: integrations.map((handshake) => ({ ...handshake })),
    specificationHistoryCount,
  };
}
