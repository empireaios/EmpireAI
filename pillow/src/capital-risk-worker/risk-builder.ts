import type { CapitalRiskWorkerConfiguration } from "./configuration.js";
import { computeBpsDelta } from "./money.js";
import { prioritiseRisks } from "./risk-detector.js";
import {
  nextDashboardId,
  nextEngineRecordId,
  nextMitigationId,
  nextReportId,
  nextSummaryId,
  nextWidgetId,
} from "./risk-store.js";
import {
  CAPRW_CAPABILITIES,
  CAPRW_METADATA_VERSION,
  CAPITAL_RISK_REPORT_VERSION,
  CAPITAL_RISK_WORKER_IDENTITY,
  ESCALATION_LEVELS,
  RISK_CATEGORIES,
  SEVERITY_LEVELS,
} from "./paths.js";
import type {
  BudgetOverrunSummary,
  CapitalRisk,
  CapitalRiskReport,
  CapitalRiskWorkerCatalog,
  CapitalRiskWorkerEngineRecord,
  CaprwCapability,
  ExecutiveRiskSummary,
  RiskDashboardWidget,
  EnterpriseRiskDashboard,
  IntegrationHandshake,
  OperationalState,
  Q911ConsumableContract,
  RecommendedMitigation,
  OverspendSummary,
  CashShortageSummary,
  LiquiditySummary,
  InvestmentRiskSummary,
  TrendRiskSummary,
  ValidationResult,
  DetectionContext,
  SeverityLevel,
  EscalationLevel,
} from "./types.js";

const ESCALATION_ORDER: Record<EscalationLevel, number> = {
  monitor: 0,
  pillow: 1,
  grand_king: 2,
};

export function buildOverspendSummary(ctx: DetectionContext): OverspendSummary {
  const snap = ctx.budgetSnapshot;
  if (!snap || snap.fabricated !== false) {
    return {
      plannedMinor: null,
      actualMinor: null,
      overrunMinor: null,
      overrunBps: null,
      currency: ctx.currency,
      recordKind: "unavailable",
      sourceRefs: [],
      status: "unavailable",
      fabricated: false,
    };
  }
  const overrunMinor = snap.actualMinor > snap.plannedMinor ? snap.actualMinor - snap.plannedMinor : 0;
  return {
    plannedMinor: snap.plannedMinor,
    actualMinor: snap.actualMinor,
    overrunMinor,
    overrunBps: snap.plannedMinor > 0 ? computeBpsDelta(overrunMinor, snap.plannedMinor) : null,
    currency: snap.currency,
    recordKind: "factual_measured",
    sourceRefs: [...snap.sourceRefs],
    status: "available",
    fabricated: false,
  };
}

export function buildCashShortageSummary(ctx: DetectionContext): CashShortageSummary {
  const snap = ctx.cashflowSnapshot;
  if (!snap || snap.fabricated !== false) {
    return {
      cashPositionMinor: null,
      thresholdMinor: null,
      shortageMinor: null,
      currency: ctx.currency,
      recordKind: "unavailable",
      sourceRefs: [],
      status: "unavailable",
      fabricated: false,
    };
  }
  const threshold = ctx.config.cashShortageMinor;
  const shortage = snap.cashPositionMinor < threshold ? threshold - snap.cashPositionMinor : 0;
  return {
    cashPositionMinor: snap.cashPositionMinor,
    thresholdMinor: threshold,
    shortageMinor: shortage > 0 ? shortage : null,
    currency: snap.currency,
    recordKind: "factual_measured",
    sourceRefs: [...snap.sourceRefs],
    status: "available",
    fabricated: false,
  };
}

export function buildLiquiditySummary(ctx: DetectionContext): LiquiditySummary {
  const snap = ctx.liquiditySnapshot;
  if (!snap || snap.fabricated !== false || snap.runwayDays == null) {
    return {
      runwayDays: null,
      warningDays: ctx.config.liquidityDaysWarning,
      currency: ctx.currency,
      recordKind: "unavailable",
      sourceRefs: [],
      status: "unavailable",
      fabricated: false,
    };
  }
  return {
    runwayDays: snap.runwayDays,
    warningDays: ctx.config.liquidityDaysWarning,
    currency: snap.currency,
    recordKind: "factual_measured",
    sourceRefs: [...snap.sourceRefs],
    status: "available",
    fabricated: false,
  };
}

export function buildInvestmentRiskSummary(ctx: DetectionContext): InvestmentRiskSummary {
  const snap = ctx.investmentSnapshot;
  if (!snap || snap.fabricated !== false) {
    return {
      underperformingCount: 0,
      totalOpportunities: 0,
      currency: ctx.currency,
      recordKind: "unavailable",
      sourceRefs: [],
      status: "unavailable",
      fabricated: false,
    };
  }
  const under = snap.opportunities.filter(
    (o) =>
      o.recommendation === "reject" ||
      o.recommendation === "defer" ||
      o.expectedRoiBps < ctx.config.underperformingRoiBps,
  ).length;
  return {
    underperformingCount: under,
    totalOpportunities: snap.opportunities.length,
    currency: snap.currency,
    recordKind: "factual_measured",
    sourceRefs: [...snap.sourceRefs],
    status: "available",
    fabricated: false,
  };
}

export function buildBudgetOverrunSummary(ctx: DetectionContext): BudgetOverrunSummary {
  const snap = ctx.budgetSnapshot;
  if (!snap || snap.fabricated !== false) {
    return {
      plannedMinor: null,
      actualMinor: null,
      overrunBps: null,
      currency: ctx.currency,
      recordKind: "unavailable",
      sourceRefs: [],
      status: "unavailable",
      fabricated: false,
    };
  }
  const overrunMinor = snap.actualMinor > snap.plannedMinor ? snap.actualMinor - snap.plannedMinor : 0;
  return {
    plannedMinor: snap.plannedMinor,
    actualMinor: snap.actualMinor,
    overrunBps: snap.plannedMinor > 0 ? computeBpsDelta(overrunMinor, snap.plannedMinor) : null,
    currency: snap.currency,
    recordKind: "factual_measured",
    sourceRefs: [...snap.sourceRefs],
    status: "available",
    fabricated: false,
  };
}

export function buildTrendRiskSummary(ctx: DetectionContext): TrendRiskSummary {
  const rev = ctx.revenueSnapshot;
  const prof = ctx.profitabilitySnapshot;
  let revenueDeclineBps: number | null = null;
  let marginDeclineBps: number | null = null;
  const sourceRefs: string[] = [];
  if (rev && rev.fabricated === false && rev.priorTotalMinor != null) {
    if (rev.totalMinor < rev.priorTotalMinor) {
      revenueDeclineBps = computeBpsDelta(rev.priorTotalMinor - rev.totalMinor, rev.priorTotalMinor);
    }
    sourceRefs.push(...rev.sourceRefs);
  }
  if (prof && prof.fabricated === false && prof.marginBps != null && prof.priorMarginBps != null) {
    marginDeclineBps = prof.priorMarginBps - prof.marginBps;
    sourceRefs.push(...prof.sourceRefs);
  }
  const available = revenueDeclineBps != null || marginDeclineBps != null;
  return {
    revenueDeclineBps,
    marginDeclineBps,
    currency: ctx.currency,
    recordKind: available ? "factual_measured" : "unavailable",
    sourceRefs: [...new Set(sourceRefs)],
    status: available ? "available" : "unavailable",
    fabricated: false,
  };
}

export function buildExecutiveRiskSummary(risks: CapitalRisk[]): ExecutiveRiskSummary {
  const counts: Record<SeverityLevel, number> = {
    info: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  for (const risk of risks) counts[risk.severity] += 1;
  const prioritised = prioritiseRisks(risks);
  const topRisks = prioritised.slice(0, 5);
  let highestEscalation: EscalationLevel = "monitor";
  for (const risk of risks) {
    if (ESCALATION_ORDER[risk.escalationLevel] > ESCALATION_ORDER[highestEscalation]) {
      highestEscalation = risk.escalationLevel;
    }
  }
  return {
    summaryId: nextSummaryId(),
    timestamp: new Date().toISOString(),
    totalRisks: risks.length,
    criticalCount: counts.critical,
    highCount: counts.high,
    mediumCount: counts.medium,
    lowCount: counts.low,
    infoCount: counts.info,
    topRisks,
    escalationRequired: highestEscalation !== "monitor",
    highestEscalationLevel: highestEscalation,
    fabricated: false,
  };
}

export function buildEnterpriseRiskDashboard(
  risks: CapitalRisk[],
  executiveRiskSummary: ExecutiveRiskSummary,
  currency: string,
): EnterpriseRiskDashboard {
  const byCategory = new Map<string, CapitalRisk[]>();
  for (const risk of risks) {
    const list = byCategory.get(risk.category) ?? [];
    list.push(risk);
    byCategory.set(risk.category, list);
  }
  const widgets: RiskDashboardWidget[] = [...byCategory.entries()].map(([category, categoryRisks]) => {
    const prioritised = prioritiseRisks(categoryRisks);
    return {
      widgetId: nextWidgetId(),
      category: category as CapitalRisk["category"],
      title: `${category.replace(/_/g, " ")} risks`,
      riskCount: categoryRisks.length,
      highestSeverity: prioritised[0]?.severity ?? null,
      sourceRefs: [...new Set(categoryRisks.flatMap((r) => r.sourceRefs))],
    };
  });
  if (risks.length) {
    widgets.unshift({
      widgetId: nextWidgetId(),
      category: "aggregate" as const,
      title: "Total capital risks",
      riskCount: risks.length,
      highestSeverity: prioritiseRisks(risks)[0]?.severity ?? null,
      sourceRefs: [...new Set(risks.flatMap((r) => r.sourceRefs))],
    });
  }
  const risksBySeverity: Record<SeverityLevel, number> = {
    info: executiveRiskSummary.infoCount,
    low: executiveRiskSummary.lowCount,
    medium: executiveRiskSummary.mediumCount,
    high: executiveRiskSummary.highCount,
    critical: executiveRiskSummary.criticalCount,
  };
  return {
    dashboardId: nextDashboardId(),
    timestamp: new Date().toISOString(),
    widgets,
    executiveRiskSummary,
    risksBySeverity,
    currency,
    fabricated: false,
  };
}

export function buildRecommendedMitigations(risks: CapitalRisk[]): RecommendedMitigation[] {
  return risks.map((risk) => ({
    mitigationId: nextMitigationId(),
    riskId: risk.riskId,
    recommendation: `Review and acknowledge ${risk.category} risk "${risk.title}" — escalate to ${risk.escalationLevel} if unresolved. Never auto-execute mitigation.`,
    escalationLevel: risk.escalationLevel,
    signalKind: "risk_mitigation_recommendation" as const,
    isAutomaticExecution: false as const,
    isApproval: false as const,
    fabricated: false as const,
  }));
}

export function buildCapitalRiskReport(params: {
  capitalBusinessId: string;
  capitalProjectId: string;
  reportingPeriod: string;
  currency: string;
  detectedRisks: CapitalRisk[];
  prioritisedRisks: CapitalRisk[];
  executiveRiskSummary: ExecutiveRiskSummary;
  enterpriseRiskDashboard: EnterpriseRiskDashboard;
  recommendedMitigations: RecommendedMitigation[];
  ctx: DetectionContext;
  supportingEvidence: string[];
  outstandingIssues: string[];
  confidenceScore: number;
  validation: ValidationResult;
  config: CapitalRiskWorkerConfiguration;
}): CapitalRiskReport {
  return {
    reportId: nextReportId(),
    timestamp: new Date().toISOString(),
    capitalProjectId: params.capitalProjectId,
    reportingPeriod: params.reportingPeriod,
    capitalBusinessId: params.capitalBusinessId,
    currency: params.currency,
    executiveRiskSummary: params.executiveRiskSummary,
    enterpriseRiskDashboard: params.enterpriseRiskDashboard,
    detectedRisks: params.detectedRisks,
    prioritisedRisks: params.prioritisedRisks,
    recommendedMitigations: params.recommendedMitigations,
    overspendSummary: buildOverspendSummary(params.ctx),
    cashShortageSummary: buildCashShortageSummary(params.ctx),
    liquiditySummary: buildLiquiditySummary(params.ctx),
    investmentRiskSummary: buildInvestmentRiskSummary(params.ctx),
    budgetOverrunSummary: buildBudgetOverrunSummary(params.ctx),
    trendRiskSummary: buildTrendRiskSummary(params.ctx),
    supportingEvidence: [...params.supportingEvidence],
    auditStatus: "pending",
    outstandingIssues: [...params.outstandingIssues],
    confidenceScore: params.confidenceScore,
    metadataVersion: CAPRW_METADATA_VERSION,
    reportVersion: CAPITAL_RISK_REPORT_VERSION,
    workerId: params.config.workerId,
    validation: params.validation,
    runTimestamp: new Date().toISOString(),
    consumableByQ911: true,
    submittedThroughExecutiveReportingRuntime: false,
    executiveReportId: null,
    traceabilityRefs: [...params.supportingEvidence],
    neverApproveFinancialDecisions: true,
    neverExecuteInvestments: true,
    neverMoveCapital: true,
    neverModifyAccountingRecords: true,
    neverFabricateRisksOrEvidence: true,
    neverAutomaticallyExecuteMitigation: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ911OrLater: true,
    preserveCompleteTraceability: true,
    preserveRiskHistory: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    observedRisksDistinctFromPredictions: true,
  };
}

export function buildQ911ConsumableContract(
  config: CapitalRiskWorkerConfiguration,
): Q911ConsumableContract {
  return {
    contractId: `caprw-q911-contract-${CAPRW_METADATA_VERSION}`,
    contractVersion: CAPRW_METADATA_VERSION,
    producedBy: "capital-risk-worker",
    missionId: "Q9-10",
    consumerMissionId: "Q9-11",
    exposedFields: [
      "reportId",
      "timestamp",
      "capitalProjectId",
      "reportingPeriod",
      "capitalBusinessId",
      "executiveRiskSummary",
      "enterpriseRiskDashboard",
      "detectedRisks",
      "prioritisedRisks",
      "recommendedMitigations",
      "overspendSummary",
      "cashShortageSummary",
      "liquiditySummary",
      "investmentRiskSummary",
      "budgetOverrunSummary",
      "trendRiskSummary",
      "supportingEvidence",
      "auditStatus",
      "outstandingIssues",
      "confidenceScore",
      "metadataVersion",
    ],
    riskCategoryCatalog: [...RISK_CATEGORIES],
    severityLevelCatalog: [...SEVERITY_LEVELS],
    escalationLevelCatalog: [...ESCALATION_LEVELS],
    currencyCatalog: [...config.currencies],
    notes: [
      "Capital Risk Worker (Q9-10) detects capital risks from verified upstream snapshots — it never approves financial decisions, never executes investments, never moves capital, and never fabricates risks or evidence.",
      "Mitigation recommendations are structural signals only — never automatically executed.",
      "Q9-11 and later workers must consume this contract rather than reimplement Q9-10 capital risk logic.",
    ],
    neverImplementQ911OrLater: true,
    structuralSignalOnly: true,
  };
}

export function buildCatalog(config: CapitalRiskWorkerConfiguration): CapitalRiskWorkerCatalog {
  return {
    catalogVersion: CAPRW_METADATA_VERSION,
    riskCategories: [...config.riskCategories],
    severityLevels: [...config.severityLevels],
    escalationLevels: [...config.escalationLevels],
    resolutionStatuses: [...config.resolutionStatuses],
    currencies: [...config.currencies],
    capabilities: [...CAPRW_CAPABILITIES] as CaprwCapability[],
  };
}

export function buildEngineRecord(params: {
  operationalState: OperationalState;
  healthStatus: "healthy" | "degraded" | "failed";
  validationStatus: "passed" | "failed";
  totalRisks: number;
  totalReports: number;
  totalDashboards: number;
  lastBusinessId: string | null;
  lastReportingPeriod: string | null;
  handshakes: IntegrationHandshake[];
}): CapitalRiskWorkerEngineRecord {
  const deps = params.handshakes;
  const bound = (target: string) => deps.some((h) => h.target === target && h.status === "bound");
  return {
    engineRecordId: nextEngineRecordId(),
    timestamp: new Date().toISOString(),
    engineId: CAPITAL_RISK_WORKER_IDENTITY.workerId,
    engineVersion: "PILLOW-CAPRW-001",
    currentOperationalState: params.operationalState,
    healthStatus: params.healthStatus,
    validationStatus: params.validationStatus,
    supportedCapabilities: [...CAPRW_CAPABILITIES] as CaprwCapability[],
    totalRisks: params.totalRisks,
    totalReports: params.totalReports,
    totalDashboards: params.totalDashboards,
    lastBusinessId: params.lastBusinessId,
    lastReportingPeriod: params.lastReportingPeriod,
    dependencyPresence: {
      capitalFactoryCore: bound("capital_factory_core"),
      accountingWorker: bound("accounting_worker"),
      cashflowWorker: bound("cashflow_worker"),
      budgetPlanningWorker: bound("budget_planning_worker"),
      profitabilityWorker: bound("profitability_worker"),
      forecastingWorker: bound("forecasting_worker"),
      taxSupportWorker: bound("tax_support_worker"),
      investmentPlanningWorker: bound("investment_planning_worker"),
      financialReportingWorker: bound("financial_reporting_worker"),
    },
    metadataVersion: CAPRW_METADATA_VERSION,
  };
}
