import { nextReportId } from "./audit-store.js";

import {

  AIFRT_METADATA_VERSION,

  AI_INNOVATION_FACTORY_IDENTITY,

  AI_INNOVATION_FACTORY_REPORT_VERSION,

  AI_INNOVATION_FACTORY_RUNTIME_VERSION,

} from "./paths.js";

import type {

  ArchitectureRecommendationSummary,

  AifrtValidationReport,

  BusinessOpportunitySummary,

  CostOptimisationSummary,

  GkQ1201Observation,

  InnovationProposal,

  OperationalImprovementSummary,

  PriorityRanking,

  Q1201ContractConsumption,

  RiskSummary,

  TechnologyResearchSummary,

  AiInnovationReport,

} from "./types.js";



export type BuildReportParams = {

  reportId?: string | null;

  workerId: string;

  technologySummary: TechnologyResearchSummary;

  businessOpportunitySummary: BusinessOpportunitySummary;

  architectureRecommendations: ArchitectureRecommendationSummary;

  operationalImprovements: OperationalImprovementSummary;

  costOptimisationSummary: CostOptimisationSummary;

  riskSummary: RiskSummary;

  priorityRanking: PriorityRanking;

  proposals: InnovationProposal[];

  supportingEvidence: string[];

  outstandingIssues: string[];

  confidenceScore: number;

  validation: AifrtValidationReport;

  q1201ContractConsumed: Q1201ContractConsumption;

  gkQ1201Observation: GkQ1201Observation;

  seriesCompleteActivation: boolean;

};



export function buildReport(params: BuildReportParams): AiInnovationReport {

  const now = new Date().toISOString();

  const reportId = params.reportId?.trim() || nextReportId();



  return {

    reportId,

    timestamp: now,

    innovationVersion: AI_INNOVATION_FACTORY_RUNTIME_VERSION,

    engineId: "PILLOW-AIFRT-001",

    missionId: "Q12-01",

    technologySummary: params.technologySummary,

    businessOpportunitySummary: params.businessOpportunitySummary,

    architectureRecommendations: params.architectureRecommendations,

    operationalImprovements: params.operationalImprovements,

    costOptimisationSummary: params.costOptimisationSummary,

    riskSummary: params.riskSummary,

    priorityRanking: params.priorityRanking,

    supportingEvidence: params.supportingEvidence,

    outstandingIssues: params.outstandingIssues,

    confidenceScore: params.confidenceScore,

    metadataVersion: AIFRT_METADATA_VERSION,

    reportVersion: AI_INNOVATION_FACTORY_REPORT_VERSION,

    workerId: params.workerId,

    proposals: params.proposals,

    q1201ContractConsumed: params.q1201ContractConsumed,

    gkQ1201Observation: params.gkQ1201Observation,

    seriesCompleteActivation: params.seriesCompleteActivation,

    consumableByQ1301: params.validation.decision !== "fail" && params.q1201ContractConsumed.consumed,

    neverImplementQ1301OrLater: true,

    neverAutoDeployInnovations: true,

    evidenceBasedOnly: true,

    submittedToExecutiveReporting: false,

    executiveReportId: null,

    validation: params.validation,

    traceabilityRefs: [`q12-01:ai-innovation-factory`, `report:${reportId}`],

    runTimestamp: now,

    preserveCompleteTraceability: true,

    preserveInnovationHistory: true,

    preserveAuditHistory: true,

    deterministicInnovationBehaviour: true,

    maskSensitiveValues: true,

    neverFabricateResearchEvidence: true,

    neverBypassGovernance: true,

    neverOverridePillow: true,

    neverOverrideGrandKing: true,

    neverClaimQSeriesCompleteWhenIncomplete: true,

  };

}



export function buildCatalog(

  workerId: string,

  reports: AiInnovationReport[],

  integrations: import("./types.js").IntegrationHandshake[],

) {

  return {

    reportVersion: AI_INNOVATION_FACTORY_REPORT_VERSION,

    workerId,

    reports: reports.map((r) => ({ ...r })),

    integrations: integrations.map((i) => ({ ...i })),

    metadataVersion: AIFRT_METADATA_VERSION,

    neverFabricateResearchEvidence: true as const,

    neverImplementQ1301OrLater: true as const,

  };

}



export { AI_INNOVATION_FACTORY_IDENTITY };


