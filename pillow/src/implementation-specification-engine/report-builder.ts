import { nextReportId } from "./audit-store.js";
import {
  IMPLEMENTATION_SPECIFICATION_REPORT_VERSION,
  IMPLEMENTATION_SPECIFICATION_RUNTIME_VERSION,
  ISENG_METADATA_VERSION,
} from "./paths.js";
import type {
  DependencyDiscoverySummary,
  ImplementationSpecification,
  IsengValidationReport,
  ParsedRoadmapMission,
  PreservationSummary,
  Q1301ContractConsumption,
  RepositoryArchitectureSummary,
  ImplementationSpecificationReport,
} from "./types.js";

export type BuildReportParams = {
  reportId?: string | null;
  workerId: string;
  missionSummary: ParsedRoadmapMission;
  repositoryAuditSummary: RepositoryArchitectureSummary;
  dependencySummary: DependencyDiscoverySummary;
  preservationSummary: PreservationSummary;
  specifications: ImplementationSpecification[];
  architectureSummary: string;
  risks: Array<{ risk: string; level: string; mitigation: string }>;
  confidenceScore: number;
  validation: IsengValidationReport;
  q1301ContractConsumed: Q1301ContractConsumption;
};

export function buildReport(params: BuildReportParams): ImplementationSpecificationReport {
  const now = new Date().toISOString();
  const reportId = params.reportId?.trim() || nextReportId();
  const specificationIds = params.specifications.map((s) => s.specificationId);

  return {
    reportId,
    timestamp: now,
    specificationVersion: IMPLEMENTATION_SPECIFICATION_RUNTIME_VERSION,
    engineId: "PILLOW-ISENG-001",
    missionId: "Q13-01",
    missionSummary: params.missionSummary,
    repositoryAuditSummary: params.repositoryAuditSummary,
    architectureSummary: params.architectureSummary,
    dependencySummary: params.dependencySummary,
    preservationSummary: params.preservationSummary,
    generatedSpecificationSummary: {
      specificationCount: params.specifications.length,
      latestSpecificationId: specificationIds.at(-1) ?? null,
      specificationIds,
    },
    validationSummary: params.validation,
    risks: params.risks,
    confidenceScore: params.confidenceScore,
    metadataVersion: ISENG_METADATA_VERSION,
    reportVersion: IMPLEMENTATION_SPECIFICATION_REPORT_VERSION,
    workerId: params.workerId,
    specifications: params.specifications,
    q1301ContractConsumed: params.q1301ContractConsumed,
    consumableByQ1302: params.validation.decision !== "fail" && params.q1301ContractConsumed.consumed,
    neverImplementQ1302OrLater: true,
    neverExecuteImplementations: true,
    neverAutoDeploy: true,
    evidenceBasedOnly: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    validation: params.validation,
    traceabilityRefs: [`q13-01:implementation-specification-engine`, `report:${reportId}`],
    runTimestamp: now,
    preserveCompleteTraceability: true,
    preserveSpecificationHistory: true,
    preserveAuditHistory: true,
    deterministicSpecificationBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateRepositoryState: true,
    neverOverwriteVerifiedImplementations: true,
    neverBypassGovernance: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
  };
}

export function buildCatalog(
  workerId: string,
  reports: ImplementationSpecificationReport[],
  specifications: ImplementationSpecification[],
  integrations: import("./types.js").IntegrationHandshake[],
) {
  return {
    reportVersion: IMPLEMENTATION_SPECIFICATION_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    specifications: specifications.map((s) => ({ ...s })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: ISENG_METADATA_VERSION,
    neverFabricateRepositoryState: true as const,
    neverImplementQ1302OrLater: true as const,
  };
}
