import type { InvestmentPlanningWorkerConfiguration } from "./configuration.js";
import {
  INVESTMENT_PLANNING_REPORT_VERSION,
  INVESTMENT_PLANNING_WORKER_IDENTITY,
  IPW_CAPABILITIES,
  IPW_METADATA_VERSION,
  OPPORTUNITY_TYPES,
  RECOMMENDATION_KINDS,
  SCORING_WEIGHT_KEYS,
} from "./paths.js";
import {
  computeCapitalFit,
  estimatePaybackPeriods,
  recommendFromScore,
  scoreOpportunity,
} from "./investment-scorer.js";
import { nextEngineRecordId, nextRecommendationId, nextReportId } from "./investment-store.js";
import type {
  CapitalAllocationRecommendation,
  EvaluatedOpportunity,
  ExpectedRoiSummary,
  IntegrationHandshake,
  InvestmentOpportunityInput,
  InvestmentPlanningReport,
  InvestmentPlanningWorkerCatalog,
  InvestmentPlanningWorkerEngineRecord,
  IpwCapability,
  OperationalState,
  PaybackSummary,
  Q909ConsumableContract,
  RiskAssessmentSummary,
  StrategicAlignmentSummary,
  ValidationResult,
} from "./types.js";
import { moneyFromMinor } from "./money.js";

export function buildExpectedRoiSummary(
  opportunities: readonly EvaluatedOpportunity[],
): ExpectedRoiSummary {
  const withRoi = opportunities.filter((o) => o.expectedRoiBps != null);
  if (withRoi.length === 0) {
    return {
      opportunityCountWithRoi: 0,
      averageExpectedRoiBps: null,
      highestExpectedRoiBps: null,
      highestRoiOpportunityId: null,
      recordKind: "projected_caller_supplied",
      fabricated: false,
    };
  }
  let highest = withRoi[0]!;
  for (const opp of withRoi) {
    if ((opp.expectedRoiBps ?? 0) > (highest.expectedRoiBps ?? 0)) highest = opp;
  }
  const averageExpectedRoiBps = Math.round(
    withRoi.reduce((sum, o) => sum + (o.expectedRoiBps ?? 0), 0) / withRoi.length,
  );
  return {
    opportunityCountWithRoi: withRoi.length,
    averageExpectedRoiBps,
    highestExpectedRoiBps: highest.expectedRoiBps,
    highestRoiOpportunityId: highest.opportunityId,
    recordKind: "projected_caller_supplied",
    fabricated: false,
  };
}

export function buildPaybackSummary(opportunities: readonly EvaluatedOpportunity[]): PaybackSummary {
  const withPayback = opportunities.filter((o) => o.expectedPaybackPeriods != null);
  if (withPayback.length === 0) {
    return {
      opportunityCountWithPayback: 0,
      averagePaybackPeriods: null,
      shortestPaybackPeriods: null,
      shortestPaybackOpportunityId: null,
      callerSuppliedCount: 0,
      projectedDerivedCount: 0,
      recordKind: "mixed_projected_payback",
      fabricated: false,
    };
  }
  let shortest = withPayback[0]!;
  for (const opp of withPayback) {
    if ((opp.expectedPaybackPeriods ?? Number.POSITIVE_INFINITY) < (shortest.expectedPaybackPeriods ?? Number.POSITIVE_INFINITY)) {
      shortest = opp;
    }
  }
  return {
    opportunityCountWithPayback: withPayback.length,
    averagePaybackPeriods: Math.round(
      withPayback.reduce((sum, o) => sum + (o.expectedPaybackPeriods ?? 0), 0) / withPayback.length,
    ),
    shortestPaybackPeriods: shortest.expectedPaybackPeriods,
    shortestPaybackOpportunityId: shortest.opportunityId,
    callerSuppliedCount: withPayback.filter((o) => o.measuredVsProjected.paybackSource === "caller_supplied").length,
    projectedDerivedCount: withPayback.filter((o) => o.measuredVsProjected.paybackSource === "projected_derived").length,
    recordKind: "mixed_projected_payback",
    fabricated: false,
  };
}

export function buildStrategicAlignmentSummary(
  opportunities: readonly EvaluatedOpportunity[],
): StrategicAlignmentSummary {
  const withAlign = opportunities.filter((o) => o.strategicAlignmentBps != null);
  if (withAlign.length === 0) {
    return {
      opportunityCountWithAlignment: 0,
      averageStrategicAlignmentBps: null,
      highestStrategicAlignmentBps: null,
      highestAlignmentOpportunityId: null,
      recordKind: "caller_supplied_alignment",
      fabricated: false,
    };
  }
  let highest = withAlign[0]!;
  for (const opp of withAlign) {
    if ((opp.strategicAlignmentBps ?? 0) > (highest.strategicAlignmentBps ?? 0)) highest = opp;
  }
  return {
    opportunityCountWithAlignment: withAlign.length,
    averageStrategicAlignmentBps: Math.round(
      withAlign.reduce((sum, o) => sum + (o.strategicAlignmentBps ?? 0), 0) / withAlign.length,
    ),
    highestStrategicAlignmentBps: highest.strategicAlignmentBps,
    highestAlignmentOpportunityId: highest.opportunityId,
    recordKind: "caller_supplied_alignment",
    fabricated: false,
  };
}

export function buildEvaluatedOpportunity(
  opp: InvestmentOpportunityInput,
  config: InvestmentPlanningWorkerConfiguration,
  availableCapitalMinor: number | null,
): EvaluatedOpportunity {
  const { paybackPeriods, paybackSource } = estimatePaybackPeriods(
    opp.expectedRoiBps,
    opp.expectedPaybackPeriods,
  );
  const capitalFit = computeCapitalFit(opp.capitalRequiredMinor, availableCapitalMinor);
  const opportunityScore = scoreOpportunity(
    {
      expectedRoiBps: opp.expectedRoiBps,
      strategicAlignmentBps: opp.strategicAlignmentBps,
      expectedPaybackPeriods: paybackPeriods,
      riskScoreBps: opp.riskScoreBps,
      capitalRequiredMinor: opp.capitalRequiredMinor,
    },
    config.scoringWeights,
    availableCapitalMinor,
  );
  const recommendation = recommendFromScore(
    opportunityScore,
    capitalFit,
    config.recommendThresholdBps,
    config.deferThresholdBps,
  );
  return {
    opportunityId: opp.opportunityId,
    opportunityType: opp.opportunityType,
    businessOrProject: opp.businessOrProject,
    capitalRequiredMinor: opp.capitalRequiredMinor,
    currency: opp.currency,
    expectedRoiBps: opp.expectedRoiBps ?? null,
    expectedPaybackPeriods: paybackPeriods,
    strategicAlignmentBps: opp.strategicAlignmentBps ?? null,
    riskScoreBps: opp.riskScoreBps ?? null,
    operationalDependencies: [...opp.operationalDependencies],
    evidenceRefs: [...opp.evidenceRefs],
    assumptions: [...opp.assumptions],
    opportunityScore,
    recommendation,
    supportingEvidence: [...opp.evidenceRefs],
    measuredVsProjected: {
      roiIsProjected: opp.expectedRoiBps != null,
      paybackIsProjected: paybackSource !== "caller_supplied" && paybackPeriods != null,
      paybackSource,
      availableCapitalIsMeasured: availableCapitalMinor !== null,
      capitalRequiredIsCallerSupplied: true,
    },
    capitalFit,
    fabricated: false,
  };
}

export function buildCapitalAllocationRecommendations(
  ranked: readonly EvaluatedOpportunity[],
  availableCapitalMinor: number | null,
): CapitalAllocationRecommendation[] {
  if (availableCapitalMinor === null || availableCapitalMinor <= 0) {
    return ranked
      .filter((o) => o.recommendation === "recommend" || o.recommendation === "monitor")
      .map((opp, index) => ({
        recommendationId: nextRecommendationId(),
        opportunityId: opp.opportunityId,
        businessOrProject: opp.businessOrProject,
        recommendedCapitalMinor: opp.capitalRequiredMinor,
        currency: opp.currency,
        rank: index + 1,
        opportunityScore: opp.opportunityScore,
        recommendation: opp.recommendation,
        signalKind: "capital_allocation_recommendation" as const,
        isExecution: false as const,
        isApproval: false as const,
        supportingEvidence: [...opp.supportingEvidence],
        fabricated: false as const,
      }));
  }

  let remaining = availableCapitalMinor;
  const recommendations: CapitalAllocationRecommendation[] = [];
  let rank = 0;
  for (const opp of ranked) {
    if (opp.recommendation !== "recommend" && opp.recommendation !== "monitor") continue;
    if (opp.capitalRequiredMinor > remaining) continue;
    rank += 1;
    remaining -= opp.capitalRequiredMinor;
    recommendations.push({
      recommendationId: nextRecommendationId(),
      opportunityId: opp.opportunityId,
      businessOrProject: opp.businessOrProject,
      recommendedCapitalMinor: opp.capitalRequiredMinor,
      currency: opp.currency,
      rank,
      opportunityScore: opp.opportunityScore,
      recommendation: opp.recommendation,
      signalKind: "capital_allocation_recommendation",
      isExecution: false,
      isApproval: false,
      supportingEvidence: [...opp.supportingEvidence],
      fabricated: false,
    });
  }
  return recommendations;
}

export function buildInvestmentPlanningReport(params: {
  capitalBusinessId: string;
  capitalProjectId: string;
  planningPeriod: string;
  currency: string;
  evaluatedOpportunities: EvaluatedOpportunity[];
  rankedOpportunities: EvaluatedOpportunity[];
  capitalAllocationRecommendations: CapitalAllocationRecommendation[];
  riskAssessment: RiskAssessmentSummary;
  availableCapitalMinor: number | null;
  availableCapitalSource: InvestmentPlanningReport["availableCapitalSource"];
  supportingEvidence: string[];
  outstandingIssues: string[];
  confidenceScore: number;
  validation: ValidationResult;
  config: InvestmentPlanningWorkerConfiguration;
}): InvestmentPlanningReport {
  const evaluated = params.evaluatedOpportunities.map((o) => ({ ...o }));
  const ranked = params.rankedOpportunities.map((o) => ({ ...o }));
  return {
    reportId: nextReportId(),
    timestamp: new Date().toISOString(),
    capitalProjectId: params.capitalProjectId,
    evaluationPeriod: params.planningPeriod,
    planningPeriod: params.planningPeriod,
    investmentOpportunities: evaluated,
    evaluatedOpportunities: evaluated,
    capitalAllocationRecommendations: params.capitalAllocationRecommendations.map((r) => ({ ...r })),
    opportunityRankings: ranked,
    rankedOpportunities: ranked,
    expectedRoiSummary: buildExpectedRoiSummary(evaluated),
    paybackSummary: buildPaybackSummary(evaluated),
    strategicAlignmentSummary: buildStrategicAlignmentSummary(evaluated),
    riskAssessment: params.riskAssessment,
    availableCapital:
      params.availableCapitalMinor !== null
        ? moneyFromMinor(params.availableCapitalMinor, params.currency)
        : null,
    availableCapitalSource: params.availableCapitalSource,
    supportingEvidence: [...params.supportingEvidence],
    auditStatus: "pending",
    outstandingIssues: [...params.outstandingIssues],
    confidenceScore: params.confidenceScore,
    metadataVersion: IPW_METADATA_VERSION,
    reportVersion: INVESTMENT_PLANNING_REPORT_VERSION,
    workerId: params.config.workerId,
    capitalBusinessId: params.capitalBusinessId,
    currency: params.currency,
    validation: params.validation,
    runTimestamp: new Date().toISOString(),
    consumableByQ909: true,
    submittedThroughExecutiveReportingRuntime: false,
    executiveReportId: null,
    traceabilityRefs: [...params.supportingEvidence],
    neverExecuteInvestments: true,
    neverApproveInvestments: true,
    neverMoveOrAllocateCapital: true,
    neverModifyAccountingRecords: true,
    neverFabricateRoiOrPaybackOrRecommendations: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ909OrLater: true,
    preserveCompleteTraceability: true,
    preserveInvestmentHistory: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    measuredDataDistinctFromProjections: true,
  };
}

export function buildQ909ConsumableContract(
  config: InvestmentPlanningWorkerConfiguration,
): Q909ConsumableContract {
  return {
    contractId: `ipw-q909-contract-${IPW_METADATA_VERSION}`,
    contractVersion: IPW_METADATA_VERSION,
    producedBy: "investment-planning-worker",
    missionId: "Q9-08",
    consumerMissionId: "Q9-09",
    exposedFields: [
      "reportId",
      "timestamp",
      "capitalProjectId",
      "planningPeriod",
      "evaluatedOpportunities",
      "rankedOpportunities",
      "capitalAllocationRecommendations",
      "riskAssessment",
      "availableCapital",
      "availableCapitalSource",
      "supportingEvidence",
      "auditStatus",
      "outstandingIssues",
      "confidenceScore",
      "metadataVersion",
    ],
    opportunityTypeCatalog: [...OPPORTUNITY_TYPES],
    recommendationKindCatalog: [...RECOMMENDATION_KINDS],
    currencyCatalog: [...config.currencies],
    notes: [
      "Investment Planning Worker (Q9-08) evaluates caller-supplied investment opportunities, ranks them deterministically, and produces capital allocation recommendations from verified/measured context — it never executes investments, never approves investments, never moves or allocates capital, and never fabricates ROI or payback.",
      "Projections are clearly labelled measuredVsProjected; derived payback from caller ROI is projected_derived only.",
      "Q9-09 and later workers must consume this contract rather than reimplement Q9-08 investment planning logic.",
    ],
    neverImplementQ909OrLater: true,
    structuralSignalOnly: true,
  };
}

export function buildCatalog(config: InvestmentPlanningWorkerConfiguration): InvestmentPlanningWorkerCatalog {
  return {
    catalogVersion: IPW_METADATA_VERSION,
    opportunityTypes: [...config.opportunityTypes],
    recommendationKinds: [...config.recommendationKinds],
    currencies: [...config.currencies],
    capabilities: [...IPW_CAPABILITIES] as IpwCapability[],
    scoringWeightKeys: [...SCORING_WEIGHT_KEYS],
  };
}

export function buildEngineRecord(params: {
  operationalState: OperationalState;
  healthStatus: InvestmentPlanningWorkerEngineRecord["healthStatus"];
  validationStatus: InvestmentPlanningWorkerEngineRecord["validationStatus"];
  totalOpportunities: number;
  totalReports: number;
  totalRecommendations: number;
  lastBusinessId: string | null;
  lastPlanningPeriod: string | null;
  handshakes: IntegrationHandshake[];
}): InvestmentPlanningWorkerEngineRecord {
  const bound = (target: string) =>
    params.handshakes.some((h) => h.target === target && h.status === "bound");
  return {
    engineRecordId: nextEngineRecordId(),
    timestamp: new Date().toISOString(),
    engineId: INVESTMENT_PLANNING_WORKER_IDENTITY.workerId,
    engineVersion: "PILLOW-IPW-001",
    currentOperationalState: params.operationalState,
    healthStatus: params.healthStatus,
    validationStatus: params.validationStatus,
    supportedCapabilities: [...IPW_CAPABILITIES] as IpwCapability[],
    totalOpportunities: params.totalOpportunities,
    totalReports: params.totalReports,
    totalRecommendations: params.totalRecommendations,
    lastBusinessId: params.lastBusinessId,
    lastPlanningPeriod: params.lastPlanningPeriod,
    dependencyPresence: {
      capitalFactoryCore: bound("capital_factory_core"),
      accountingWorker: bound("accounting_worker"),
      cashflowWorker: bound("cashflow_worker"),
      budgetPlanningWorker: bound("budget_planning_worker"),
      profitabilityWorker: bound("profitability_worker"),
      forecastingWorker: bound("forecasting_worker"),
      taxSupportWorker: bound("tax_support_worker"),
    },
    metadataVersion: IPW_METADATA_VERSION,
  };
}

export function buildRiskAssessmentSummaryFromEvaluated(
  evaluated: readonly EvaluatedOpportunity[],
): RiskAssessmentSummary {
  const summary = evaluated.reduce(
    (acc, opp) => {
      acc.assessedOpportunityCount += 1;
      const risk = opp.riskScoreBps ?? 0;
      if (risk >= 7000) acc.elevatedRiskCount += 1;
      acc.totalRisk += risk;
      if (!acc.highest || risk > (acc.highest.riskScoreBps ?? 0)) acc.highest = opp;
      return acc;
    },
    {
      assessedOpportunityCount: 0,
      elevatedRiskCount: 0,
      totalRisk: 0,
      highest: null as EvaluatedOpportunity | null,
    },
  );
  return {
    assessedOpportunityCount: summary.assessedOpportunityCount,
    elevatedRiskCount: summary.elevatedRiskCount,
    averageRiskScoreBps:
      summary.assessedOpportunityCount === 0
        ? 0
        : Math.round(summary.totalRisk / summary.assessedOpportunityCount),
    highestRiskOpportunityId: summary.highest?.opportunityId ?? null,
    signalKind: "risk_assessment_summary",
    fabricated: false,
  };
}
