import type { ProfitabilityWorkerConfiguration } from "./configuration.js";
import {
  PRFW_CAPABILITIES,
  PRFW_METADATA_VERSION,
  PROFITABILITY_REPORT_VERSION,
  PROFITABILITY_WORKER_IDENTITY,
} from "./paths.js";
import { nextAnalysisId, nextDriverId, nextReportId } from "./profitability-store.js";
import { computeConfidenceScore, computeMarginPercent, computeTaxProvision, sumCategoryMinor } from "./profitability-calculator.js";
import { moneyFromMinor, moneySum, type MoneyMinor } from "./money.js";
import type {
  AnalysisScope,
  AuditStatus,
  CostCategory,
  CostSummary,
  DriverDirection,
  FeeSummary,
  FinancialLineItem,
  IntegrationHandshake,
  LossDriver,
  OperationalState,
  ProfitabilityAnalysis,
  ProfitabilityBreakdown,
  ProfitabilityDriver,
  ProfitabilityRanking,
  ProfitabilityReport,
  ProfitabilityWorkerCatalog,
  ProfitabilityWorkerEngineRecord,
  ProfitDriver,
  PrfwCapability,
  PrfwValidationReport,
  Q906ConsumableContract,
  RefundSummary,
  RevenueSummary,
  TaxSummary,
} from "./types.js";

/* ------------------------------------------------------------------------ */
/* Profit-and-loss breakdown assembly — pure, deterministic, integer money  */
/* ------------------------------------------------------------------------ */

export type BuildBreakdownResult = {
  breakdown: ProfitabilityBreakdown;
  issues: string[];
  taxEstimated: boolean;
};

/**
 * Assemble a full deterministic `ProfitabilityBreakdown` for one scope from
 * an already scope-and-currency-filtered set of verified `FinancialLineItem`
 * records, following the mandated calculation order:
 * grossRevenue → discounts → refunds → netRevenue → cogs → grossProfit →
 * (opex + advertising + platform/payment fees + shared allocation) →
 * operatingProfit → tax → netProfit → integer-basis-point margins.
 */
export function buildBreakdown(params: {
  scope: AnalysisScope;
  scopeId: string;
  currency: string;
  reportingPeriod: string;
  items: FinancialLineItem[];
  sharedCostAllocationMinor: number;
  taxRateBps: number | null | undefined;
}): BuildBreakdownResult {
  const { scope, scopeId, currency, reportingPeriod, items, sharedCostAllocationMinor, taxRateBps } = params;

  const grossRevenueMinor = sumCategoryMinor(items, "revenue", currency);
  const discountsMinor = sumCategoryMinor(items, "discount", currency);
  const refundsMinor = sumCategoryMinor(items, "refund", currency);
  const netRevenueMinor = grossRevenueMinor - discountsMinor - refundsMinor;
  const cogsMinor = sumCategoryMinor(items, "cogs", currency);
  const grossProfitMinor = netRevenueMinor - cogsMinor;

  const opexMinor = sumCategoryMinor(items, "opex", currency);
  const advertisingMinor = sumCategoryMinor(items, "advertising", currency);
  const platformFeesMinor = sumCategoryMinor(items, "platform_fee", currency);
  const paymentFeesMinor = sumCategoryMinor(items, "payment_fee", currency);
  const operatingProfitMinor =
    grossProfitMinor - opexMinor - advertisingMinor - platformFeesMinor - paymentFeesMinor - sharedCostAllocationMinor;

  const explicitTaxMinor = sumCategoryMinor(items, "tax", currency);
  const hasExplicitTaxLineItems = items.some((item) => item.category === "tax" && item.currency === currency);
  const taxResult = computeTaxProvision({
    operatingProfitMinor,
    explicitTaxMinor,
    hasExplicitTaxLineItems,
    taxRateBps,
  });
  const netProfitMinor = operatingProfitMinor - taxResult.taxMinor;

  const grossMarginPercent = computeMarginPercent(grossProfitMinor, netRevenueMinor);
  const operatingMarginPercent = computeMarginPercent(operatingProfitMinor, netRevenueMinor);
  const netMarginPercent = computeMarginPercent(netProfitMinor, netRevenueMinor);

  const realisedOnly = items.length > 0 && items.every((item) => item.realised === true);
  const sourceRefs = Array.from(new Set(items.map((item) => item.sourceRef)));

  const issues = [...taxResult.issues];
  if (!items.length) {
    issues.push(
      `No verified financial line items were available for scope=${scope} scopeId=${scopeId} — all profitability figures recorded as zero pending real data.`,
    );
  }

  const breakdown: ProfitabilityBreakdown = {
    grossRevenue: moneyFromMinor(grossRevenueMinor, currency),
    discounts: moneyFromMinor(discountsMinor, currency),
    refunds: moneyFromMinor(refundsMinor, currency),
    netRevenue: moneyFromMinor(netRevenueMinor, currency),
    cogs: moneyFromMinor(cogsMinor, currency),
    operatingExpenses: moneyFromMinor(opexMinor, currency),
    advertisingCosts: moneyFromMinor(advertisingMinor, currency),
    platformFees: moneyFromMinor(platformFeesMinor, currency),
    paymentFees: moneyFromMinor(paymentFeesMinor, currency),
    taxProvisions: moneyFromMinor(taxResult.taxMinor, currency),
    sharedCostAllocation: moneyFromMinor(sharedCostAllocationMinor, currency),
    grossProfit: moneyFromMinor(grossProfitMinor, currency),
    operatingProfit: moneyFromMinor(operatingProfitMinor, currency),
    netProfit: moneyFromMinor(netProfitMinor, currency),
    grossMarginPercent,
    operatingMarginPercent,
    netMarginPercent,
    currency,
    scope,
    scopeId,
    reportingPeriod,
    realisedOnly,
    fabricated: false,
    sourceRefs,
  };

  return { breakdown, issues, taxEstimated: taxResult.estimated };
}

export function buildAnalysis(params: {
  breakdown: ProfitabilityBreakdown;
  name: string | null;
  taxEstimated: boolean;
  outstandingIssues: string[];
  existingAnalysisId?: string | null;
}): ProfitabilityAnalysis {
  return {
    ...params.breakdown,
    analysisId: params.existingAnalysisId ?? nextAnalysisId(),
    name: params.name,
    taxEstimated: params.taxEstimated,
    outstandingIssues: params.outstandingIssues,
  };
}

/* ------------------------------------------------------------------------ */
/* Profit / loss drivers                                                    */
/* ------------------------------------------------------------------------ */

type CategoryContribution = {
  category: CostCategory;
  amountMinor: number;
  direction: DriverDirection;
  label: string;
};

function categoryContributions(breakdown: ProfitabilityBreakdown): CategoryContribution[] {
  return [
    {
      category: "revenue",
      amountMinor: breakdown.grossRevenue.minorUnits,
      direction: "positive",
      label: `Gross revenue contributed ${breakdown.grossRevenue.minorUnits} ${breakdown.currency} minor units`,
    },
    {
      category: "discount",
      amountMinor: breakdown.discounts.minorUnits,
      direction: "negative",
      label: `Discounts reduced revenue by ${breakdown.discounts.minorUnits} ${breakdown.currency} minor units`,
    },
    {
      category: "refund",
      amountMinor: breakdown.refunds.minorUnits,
      direction: "negative",
      label: `Refunds reduced revenue by ${breakdown.refunds.minorUnits} ${breakdown.currency} minor units`,
    },
    {
      category: "cogs",
      amountMinor: breakdown.cogs.minorUnits,
      direction: "negative",
      label: `Cost of goods sold consumed ${breakdown.cogs.minorUnits} ${breakdown.currency} minor units`,
    },
    {
      category: "opex",
      amountMinor: breakdown.operatingExpenses.minorUnits,
      direction: "negative",
      label: `Operating expenses consumed ${breakdown.operatingExpenses.minorUnits} ${breakdown.currency} minor units`,
    },
    {
      category: "advertising",
      amountMinor: breakdown.advertisingCosts.minorUnits,
      direction: "negative",
      label: `Advertising costs consumed ${breakdown.advertisingCosts.minorUnits} ${breakdown.currency} minor units`,
    },
    {
      category: "platform_fee",
      amountMinor: breakdown.platformFees.minorUnits,
      direction: "negative",
      label: `Platform fees consumed ${breakdown.platformFees.minorUnits} ${breakdown.currency} minor units`,
    },
    {
      category: "payment_fee",
      amountMinor: breakdown.paymentFees.minorUnits,
      direction: "negative",
      label: `Payment fees consumed ${breakdown.paymentFees.minorUnits} ${breakdown.currency} minor units`,
    },
    {
      category: "tax",
      amountMinor: breakdown.taxProvisions.minorUnits,
      direction: "negative",
      label: `Tax provisions consumed ${breakdown.taxProvisions.minorUnits} ${breakdown.currency} minor units`,
    },
    {
      category: "shared_cost",
      amountMinor: breakdown.sharedCostAllocation.minorUnits,
      direction: "negative",
      label: `Allocated shared operational costs consumed ${breakdown.sharedCostAllocation.minorUnits} ${breakdown.currency} minor units`,
    },
  ];
}

/** Largest positive/negative category contributions to net profit — never invented, ranked purely by verified amounts. */
export function buildDrivers(params: {
  breakdown: ProfitabilityBreakdown;
  topN: number;
  minimumPercentOfNetBps: number;
}): { profitDrivers: ProfitDriver[]; lossDrivers: LossDriver[] } {
  const { breakdown, topN, minimumPercentOfNetBps } = params;
  const netRevenueMinor = breakdown.netRevenue.minorUnits;
  const contributions = categoryContributions(breakdown).filter((c) => c.amountMinor !== 0);

  const toDriver = (contribution: CategoryContribution): ProfitabilityDriver => {
    const percentOfNet = computeMarginPercent(contribution.amountMinor, netRevenueMinor);
    return {
      driverId: nextDriverId(),
      label: contribution.label,
      category: contribution.category,
      amountMinor: moneyFromMinor(contribution.amountMinor, breakdown.currency),
      percentOfNet,
      direction: contribution.direction,
      scope: breakdown.scope,
      scopeId: breakdown.scopeId,
      evidenceRefs: [...breakdown.sourceRefs],
      fabricated: false,
    };
  };

  const meetsThreshold = (contribution: CategoryContribution): boolean => {
    if (netRevenueMinor === 0) return true;
    const percent = computeMarginPercent(contribution.amountMinor, netRevenueMinor);
    if (percent === null) return true;
    return Math.abs(percent) * 100 >= minimumPercentOfNetBps;
  };

  const profitDrivers = contributions
    .filter((c) => c.direction === "positive" && meetsThreshold(c))
    .sort((a, b) => b.amountMinor - a.amountMinor)
    .slice(0, topN)
    .map(toDriver);

  const lossDrivers = contributions
    .filter((c) => c.direction === "negative" && meetsThreshold(c))
    .sort((a, b) => b.amountMinor - a.amountMinor)
    .slice(0, topN)
    .map(toDriver);

  return { profitDrivers, lossDrivers };
}

/* ------------------------------------------------------------------------ */
/* Rankings                                                                  */
/* ------------------------------------------------------------------------ */

/** Deterministic rank-by-net-profit-descending across analyses sharing a scope — ties broken by ascending scopeId. */
export function buildRankings(analyses: ProfitabilityAnalysis[]): ProfitabilityRanking[] {
  const sorted = [...analyses].sort((a, b) => {
    if (b.netProfit.minorUnits !== a.netProfit.minorUnits) return b.netProfit.minorUnits - a.netProfit.minorUnits;
    return a.scopeId < b.scopeId ? -1 : a.scopeId > b.scopeId ? 1 : 0;
  });
  return sorted.map((analysis, index) => ({
    rank: index + 1,
    scope: analysis.scope,
    scopeId: analysis.scopeId,
    name: analysis.name,
    netProfit: { ...analysis.netProfit },
    netMarginPercent: analysis.netMarginPercent,
    fabricated: false,
  }));
}

/* ------------------------------------------------------------------------ */
/* Summaries, catalog, report, contract, engine record                      */
/* ------------------------------------------------------------------------ */

export function buildRevenueSummary(breakdown: ProfitabilityBreakdown, lineItemCount: number): RevenueSummary {
  return {
    grossRevenue: breakdown.grossRevenue,
    discounts: breakdown.discounts,
    refunds: breakdown.refunds,
    netRevenue: breakdown.netRevenue,
    lineItemCount,
    fabricated: false,
  };
}

export function buildCostSummary(breakdown: ProfitabilityBreakdown, currency: string): CostSummary {
  const totalCosts = moneySum(
    [breakdown.cogs, breakdown.operatingExpenses, breakdown.advertisingCosts, breakdown.sharedCostAllocation],
    currency,
  );
  return {
    cogs: breakdown.cogs,
    operatingExpenses: breakdown.operatingExpenses,
    advertisingCosts: breakdown.advertisingCosts,
    sharedCostAllocation: breakdown.sharedCostAllocation,
    totalCosts,
    fabricated: false,
  };
}

export function buildFeeSummary(breakdown: ProfitabilityBreakdown, currency: string): FeeSummary {
  return {
    platformFees: breakdown.platformFees,
    paymentFees: breakdown.paymentFees,
    totalFees: moneySum([breakdown.platformFees, breakdown.paymentFees], currency),
    fabricated: false,
  };
}

export function buildRefundSummary(breakdown: ProfitabilityBreakdown, refundLineCount: number): RefundSummary {
  return {
    refunds: breakdown.refunds,
    refundCount: refundLineCount,
    fabricated: false,
  };
}

export function buildTaxSummary(breakdown: ProfitabilityBreakdown, taxEstimated: boolean, rateBpsUsed: number | null): TaxSummary {
  return {
    taxProvisions: breakdown.taxProvisions,
    taxRateBpsUsed: rateBpsUsed,
    estimated: taxEstimated,
    fabricated: false,
  };
}

export function buildCatalog(
  config: ProfitabilityWorkerConfiguration,
  analyses: ProfitabilityAnalysis[],
  rankings: ProfitabilityRanking[],
  profitDrivers: ProfitDriver[],
  lossDrivers: LossDriver[],
  reports: ProfitabilityReport[],
  integrations: IntegrationHandshake[],
): ProfitabilityWorkerCatalog {
  return {
    reportVersion: PROFITABILITY_REPORT_VERSION,
    workerId: config.workerId,
    costCategories: [...config.costCategories],
    feeTypes: [...config.feeTypes],
    analysisScopes: [...config.analysisScopes],
    currencies: [...config.currencies],
    analyses: analyses.map((a) => ({ ...a })),
    rankings: rankings.map((r) => ({ ...r })),
    profitDrivers: profitDrivers.map((d) => ({ ...d })),
    lossDrivers: lossDrivers.map((d) => ({ ...d })),
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: PRFW_METADATA_VERSION,
    executiveAuthority: "pillow",
    neverFabricateRevenueCostFeeRefundOrProfitabilityFigures: true,
    neverForecastFutureProfitability: true,
    neverApproveSpending: true,
    neverExecuteFinancialTransactions: true,
    neverReplaceForecastingWorker: true,
    neverModifyAccountingRecords: true,
    neverBypassGrandKingApproval: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ906OrLater: true,
  };
}

export function buildReport(params: {
  capitalBusinessId: string;
  capitalProjectId: string | null;
  reportingPeriod: string;
  breakdown: ProfitabilityBreakdown;
  lineItemCount: number;
  refundLineCount: number;
  taxEstimated: boolean;
  taxRateBpsUsed: number | null;
  analyses: ProfitabilityAnalysis[];
  rankings: ProfitabilityRanking[];
  profitDrivers: ProfitDriver[];
  lossDrivers: LossDriver[];
  extraOutstandingIssues: string[];
  validation: PrfwValidationReport | null;
}): ProfitabilityReport {
  const {
    capitalBusinessId,
    capitalProjectId,
    reportingPeriod,
    breakdown,
    lineItemCount,
    refundLineCount,
    taxEstimated,
    taxRateBpsUsed,
    analyses,
    rankings,
    profitDrivers,
    lossDrivers,
    extraOutstandingIssues,
    validation,
  } = params;

  const revenueSummary = buildRevenueSummary(breakdown, lineItemCount);
  const costSummary = buildCostSummary(breakdown, breakdown.currency);
  const feeSummary = buildFeeSummary(breakdown, breakdown.currency);
  const refundSummary = buildRefundSummary(breakdown, refundLineCount);
  const taxSummary = buildTaxSummary(breakdown, taxEstimated, taxRateBpsUsed);
  const profitMargins = {
    grossMarginPercent: breakdown.grossMarginPercent,
    operatingMarginPercent: breakdown.operatingMarginPercent,
    netMarginPercent: breakdown.netMarginPercent,
    fabricated: false as const,
  };

  const missingEvidenceIssues = analyses.length
    ? analyses.filter((a) => !a.realisedOnly).map((a) => `Analysis for ${a.scope}:${a.scopeId} includes non-realised (estimated) line items.`)
    : [];

  const outstandingIssues = Array.from(
    new Set([...extraOutstandingIssues, ...missingEvidenceIssues]),
  );

  const auditStatus: AuditStatus =
    outstandingIssues.length === 0 && lineItemCount > 0
      ? "passed"
      : lineItemCount === 0
        ? "pending"
        : "partial";

  const confidenceScore = computeConfidenceScore({
    hasLineItems: lineItemCount > 0,
    outstandingIssueCount: outstandingIssues.length,
    allRealised: breakdown.realisedOnly,
    taxResolvedFromEvidence: !taxEstimated || taxRateBpsUsed !== null,
  });

  const reportId = nextReportId();
  const now = new Date().toISOString();

  const traceabilityRefs = Array.from(
    new Set([
      `q9-05:report:${reportId}`,
      `q9-05:capital_business:${capitalBusinessId}`,
      `q9-05:scope:${breakdown.scope}:${breakdown.scopeId}`,
      ...breakdown.sourceRefs,
      ...analyses.flatMap((a) => a.sourceRefs),
    ]),
  );

  const supportingEvidence = Array.from(
    new Set([
      ...breakdown.sourceRefs,
      ...analyses.flatMap((a) => a.sourceRefs),
      ...profitDrivers.flatMap((d) => d.evidenceRefs),
      ...lossDrivers.flatMap((d) => d.evidenceRefs),
    ]),
  );

  return {
    reportId,
    timestamp: now,
    capitalProjectId,
    reportingPeriod,
    revenueSummary,
    costSummary,
    feeSummary,
    refundSummary,
    taxSummary,
    grossProfit: breakdown.grossProfit,
    operatingProfit: breakdown.operatingProfit,
    netProfit: breakdown.netProfit,
    profitMargins,
    profitabilityRankings: rankings,
    profitDrivers,
    lossDrivers,
    supportingEvidence,
    auditStatus,
    outstandingIssues,
    confidenceScore,
    metadataVersion: PRFW_METADATA_VERSION,
    reportVersion: PROFITABILITY_REPORT_VERSION,
    workerId: PROFITABILITY_WORKER_IDENTITY.workerId,
    capitalBusinessId,
    analyses,
    validation,
    runTimestamp: now,
    consumableByQ906: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    preserveCompleteTraceability: true,
    preserveHistoricalProfitabilityReports: true,
    neverFabricateRevenueCostFeeRefundOrProfitabilityFigures: true,
    neverForecastFutureProfitability: true,
    neverApproveSpending: true,
    neverExecuteFinancialTransactions: true,
    neverReplaceForecastingWorker: true,
    neverModifyAccountingRecords: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ906OrLater: true,
  };
}

export function buildQ906ConsumableContract(config: ProfitabilityWorkerConfiguration): Q906ConsumableContract {
  return {
    contractId: `prfw-q906-contract-${PRFW_METADATA_VERSION}`,
    contractVersion: PRFW_METADATA_VERSION,
    producedBy: "profitability-worker",
    missionId: "Q9-05",
    consumerMissionId: "Q9-06",
    exposedFields: [
      "capitalBusinessId",
      "reportingPeriod",
      "revenueSummary",
      "costSummary",
      "feeSummary",
      "refundSummary",
      "taxSummary",
      "grossProfit",
      "operatingProfit",
      "netProfit",
      "profitMargins",
      "profitabilityRankings",
      "profitDrivers",
      "lossDrivers",
      "analyses",
      "confidenceScore",
      "metadataVersion",
    ],
    costCategoryCatalog: [...config.costCategories],
    feeTypeCatalog: [...config.feeTypes],
    analysisScopeCatalog: [...config.analysisScopes],
    currencyCatalog: [...config.currencies],
    notes: [
      "Profitability Worker (Q9-05) calculates real gross/operating/net profit from verified, already-categorised financial line items only — it never fabricates revenue, cost, fee, refund, or profitability figures.",
      "It does not forecast future profitability, approve spending, execute financial transactions, or modify accounting records.",
      "Q9-06 (Forecasting Worker) and later workers must consume this contract rather than reimplement Q9-05 profitability logic.",
    ],
    neverImplementQ906OrLater: true,
    structuralSignalOnly: true,
  };
}

export function buildEngineRecord(params: {
  existingId: string | null;
  engineId: string;
  state: OperationalState;
  healthStatus: ProfitabilityWorkerEngineRecord["healthStatus"];
  validationStatus: ProfitabilityWorkerEngineRecord["validationStatus"];
  totalAnalyses: number;
  totalRankings: number;
  lastScope: ProfitabilityWorkerEngineRecord["lastScope"];
  lastBusinessId: string | null;
  lastReportId: string | null;
  workerId: string;
  integrationTargets: ProfitabilityWorkerEngineRecord["integrationTargets"];
}): ProfitabilityWorkerEngineRecord {
  return {
    engineRecordId: params.existingId ?? `prfw-eng-${Date.now()}`,
    timestamp: new Date().toISOString(),
    engineId: params.engineId,
    engineVersion: "PILLOW-PRFW-001",
    currentOperationalState: params.state,
    healthStatus: params.healthStatus,
    validationStatus: params.validationStatus,
    supportedCapabilities: [...PRFW_CAPABILITIES] as PrfwCapability[],
    totalAnalyses: params.totalAnalyses,
    totalRankings: params.totalRankings,
    lastScope: params.lastScope,
    lastBusinessId: params.lastBusinessId,
    lastReportId: params.lastReportId,
    workerId: params.workerId,
    integrationTargets: params.integrationTargets,
    metadataVersion: PRFW_METADATA_VERSION,
  };
}
