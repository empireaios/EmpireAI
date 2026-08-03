import type {
  AUDIT_STATUSES,
  CURRENCIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  FORECAST_METRICS,
  FORECAST_MODELS,
  FRCW_CAPABILITIES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  SCENARIO_KINDS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ForecastingWorkerConfiguration } from "./configuration.js";
import type { MoneyMinor } from "./money.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type ForecastMetric = (typeof FORECAST_METRICS)[number];
export type ForecastModel = (typeof FORECAST_MODELS)[number];
export type ScenarioKind = (typeof SCENARIO_KINDS)[number];
export type Currency = (typeof CURRENCIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type FrcwCapability = (typeof FRCW_CAPABILITIES)[number];

/**
 * Minimal shape of a verified Accounting Worker (Q9-02) ledger line the
 * Forecasting Worker is willing to consume. Declared locally (rather than
 * imported from accounting-worker) to keep the modules decoupled — the
 * Forecasting Worker integrates with the Accounting Worker via dependency
 * injection only, and consumes it for traceability/context only. It is
 * never the substrate for a forecast's historical baseline.
 */
export type InjectedLedgerLine = {
  accountId: string;
  debit: number;
  credit: number;
  currency?: string | null;
};

/** Minimal shape of a verified, immutable Accounting Worker journal entry. */
export type InjectedAccountingEntry = {
  entryId: string;
  entryType: string;
  businessId: string;
  accountingPeriod: string;
  timestamp: string;
  currency: string;
  lines: InjectedLedgerLine[];
  traceabilityRefs?: string[];
};

/**
 * Minimal, DI-decoupled summary fields of a verified Cashflow Worker (Q9-03)
 * report consumed for contextual traceability only.
 */
export type InjectedCashflowReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  netCashflow?: { currency: string; minorUnits: number } | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

/**
 * Minimal, DI-decoupled summary fields of a verified Budget Planning Worker
 * (Q9-04) report consumed for contextual traceability only.
 */
export type InjectedBudgetReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  budgetPeriod?: string | null;
  plannedBudget?: { currency: string; minorUnits: number } | null;
  actualSpending?: { currency: string; minorUnits: number } | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

/**
 * Minimal, DI-decoupled summary fields of a verified Profitability Worker
 * (Q9-05) report consumed for contextual traceability only.
 */
export type InjectedProfitabilityReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  grossProfit?: { currency: string; minorUnits: number } | null;
  operatingProfit?: { currency: string; minorUnits: number } | null;
  netProfit?: { currency: string; minorUnits: number } | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

/**
 * A single, real, verified historical data point — the sole authoritative
 * substrate for every forecast's baseline. Must arrive already tagged with
 * a real `metric` by the verified upstream source (direct caller input or
 * config seed) — the Forecasting Worker never invents a historical point,
 * an amount, or a period.
 */
export type HistoricalPoint = {
  periodLabel: string;
  amountMinor: number;
  currency: string;
  metric: ForecastMetric;
  businessId?: string | null;
  sourceRef: string;
  isHistorical: true;
  fabricated: false;
};

/**
 * A single forecast data point. Always clearly separated from historical
 * data (`isForecast: true`, `isHistorical: false`) and never presented as a
 * guaranteed outcome — every point carries its `confidenceBps` and the
 * `assumptionRefs` it was derived from.
 */
export type ForecastPoint = {
  periodLabel: string;
  amountMinor: number;
  currency: string;
  metric: ForecastMetric;
  scenario: ScenarioKind;
  model: ForecastModel;
  isForecast: true;
  isHistorical: false;
  fabricated: false;
  assumptionRefs: string[];
  /** 0-10000 (basis points) — never a guaranteed outcome. */
  confidenceBps: number;
};

/** A single, evidence-based (or explicitly-flagged-derived) forecasting assumption — never fabricated. */
export type ForecastAssumption = {
  assumptionId: string;
  key: ForecastModel | string;
  description: string;
  valueBps?: number | null;
  valueMinor?: number | null;
  source: string;
  fabricated: false;
};

/** A full forecast series for one metric+scenario across the requested horizon. */
export type ForecastSeries = {
  seriesId: string;
  metric: ForecastMetric;
  scenario: ScenarioKind;
  model: ForecastModel;
  currency: string;
  businessId: string;
  growthRateBps: number;
  horizonPeriods: number;
  points: ForecastPoint[];
  assumptionRefs: string[];
  isForecast: true;
  fabricated: false;
};

/** The four core forecast series produced together for a single forecasting run. */
export type ForecastBundle = {
  revenue: ForecastSeries;
  cost: ForecastSeries;
  cashflow: ForecastSeries;
  profit: ForecastSeries;
  fabricated: false;
};

export type CashRunwayStatus = "burning" | "surplus" | "breakeven";

/**
 * Cash-runway estimate — clearly labelled as forecast, never a guaranteed
 * outcome. `runwayMonths`/`runwayDays` are `null` exactly when the business
 * is in indefinite surplus (net-positive average cashflow), never a
 * fabricated ceiling.
 */
export type CashRunwayEstimate = {
  estimateId: string;
  capitalBusinessId: string;
  openingCashMinor: MoneyMinor;
  /** Magnitude of monthly net cash outflow while burning; zero when not burning. */
  monthlyNetBurnMinor: MoneyMinor;
  /** Magnitude of monthly net cash inflow while in surplus; zero when not in surplus. */
  monthlySurplusMinor: MoneyMinor;
  runwayStatus: CashRunwayStatus;
  /** Integer months of runway, or null exactly when runwayStatus is "surplus" (indefinite). */
  runwayMonths: number | null;
  runwayDays: number | null;
  currency: string;
  scenario: ScenarioKind;
  assumptions: ForecastAssumption[];
  supportingEvidence: string[];
  isForecast: true;
  fabricated: false;
};

/** A structural reinvestment suggestion — never an executed instruction. */
export type ReinvestmentOption = {
  optionId: string;
  label: string;
  recommendedAmountMinor: MoneyMinor;
  rationale: string;
  expectedImpact: string;
  riskNotes: string[];
  evidenceRefs: string[];
  isForecast: true;
  fabricated: false;
};

export type ScenarioComparisonEntry = {
  scenario: ScenarioKind;
  growthRateBps: number;
  endingRevenueMinor: MoneyMinor;
  endingCostMinor: MoneyMinor;
  endingCashflowMinor: MoneyMinor;
  endingProfitMinor: MoneyMinor;
  runwayMonths: number | null;
};

/** Best/expected/worst-case comparison across the same forecasting horizon. */
export type ScenarioComparison = {
  comparisonId: string;
  currency: string;
  capitalBusinessId: string;
  horizonPeriods: number;
  scenarios: ScenarioComparisonEntry[];
  assumptionRefs: string[];
  isForecast: true;
  fabricated: false;
};

export type ConfidenceAssessment = {
  /** 0-10000 (basis points). */
  overallConfidenceBps: number;
  notes: string[];
  limitingFactors: string[];
  fabricated: false;
};

/** The verified historical baseline underlying a Forecasting Report — always clearly separated from forecast content. */
export type HistoricalBaseline = {
  currency: string;
  capitalBusinessId: string;
  points: HistoricalPoint[];
  sourceRefs: string[];
  periodsCovered: number;
  isHistorical: true;
  fabricated: false;
};

export type FrcwValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/** Machine-readable Forecasting Report (Q9-06) — consumable by Q9-07 (Tax Support Worker) and later. */
export type ForecastingReport = {
  reportId: string;
  timestamp: string;
  capitalProjectId: string | null;
  forecastPeriod: string;
  revenueForecast: ForecastSeries;
  costForecast: ForecastSeries;
  cashflowForecast: ForecastSeries;
  cashRunway: CashRunwayEstimate;
  profitForecast: ForecastSeries;
  reinvestmentOptions: ReinvestmentOption[];
  forecastAssumptions: ForecastAssumption[];
  confidenceAssessment: ConfidenceAssessment;
  scenarioComparison: ScenarioComparison;
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  capitalBusinessId: string;
  historicalBaseline: HistoricalBaseline;
  validation: FrcwValidationReport | null;
  runTimestamp: string;
  consumableByQ907: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveForecastHistory: true;
  neverPresentForecastsAsGuaranteedOutcomes: true;
  neverFabricateHistoricalFinancialData: true;
  neverExecuteInvestments: true;
  neverApproveBudgets: true;
  neverReplaceInvestmentPlanningWorker: true;
  neverModifyAccountingRecords: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ907OrLater: true;
};

export type FrcwInput = {
  capitalBusinessId?: string | null;
  businessId?: string | null;
  capitalProjectId?: string | null;
  projectId?: string | null;
  forecastPeriod?: string | null;
  /** Number of future periods to project forward, e.g. 3/6/12. */
  horizonPeriods?: number | null;
  currency?: Currency | string | null;
  scenario?: ScenarioKind | string | null;
  model?: ForecastModel | string | null;
  /** Verified historical points — the sole substrate for a forecast baseline; never fabricated. */
  historicalSeries?: HistoricalPoint[] | null;
  growthRateBps?: number | null;
  costGrowthRateBps?: number | null;
  /** Spread applied to derive best_case/worst_case from the expected growth rate; defaults to 500 bps when absent. */
  sensitivityDeltaBps?: number | null;
  openingCashMinor?: number | null;
  /**
   * Caller-supplied override for the *forecast* (never historical) expected
   * ending revenue value. Forbidden to be treated as, or to invent, history
   * — it only ever adjusts a forecast point, always tagged `isForecast: true`.
   */
  revenueForecastOverrideMinor?: number | null;
  /** Verified Q9-05 Profitability Worker reports — dependency injection or direct input; traceability/context only. */
  profitabilityReports?: InjectedProfitabilityReport[] | null;
  /** Verified Q9-03 Cashflow Worker reports — dependency injection or direct input; traceability/context only. */
  cashflowReports?: InjectedCashflowReport[] | null;
  /** Verified Q9-04 Budget Planning Worker reports — dependency injection or direct input; traceability/context only. */
  budgetReports?: InjectedBudgetReport[] | null;
  /** Verified Q9-02 Accounting Worker entries — dependency injection or direct input; traceability/context only. */
  accountingEntries?: InjectedAccountingEntry[] | null;
  pillowCommandConfirmed?: boolean | null;
  validated?: boolean;
  missionId?: string | null;
  /** Forbidden boundary attempts — always rejected. */
  fabricateHistoricalFinancialData?: boolean;
  presentForecastsAsGuaranteedOutcomes?: boolean;
  executeInvestments?: boolean;
  approveBudgets?: boolean;
  replaceInvestmentPlanningWorker?: boolean;
  modifyAccountingRecords?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  implementQ907OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget | string;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type ForecastingWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  forecastModels: string[];
  scenarioKinds: string[];
  forecastMetrics: string[];
  currencies: string[];
  historicalPointCount: number;
  forecastSeries: ForecastSeries[];
  runwayEstimates: CashRunwayEstimate[];
  reinvestmentOptions: ReinvestmentOption[];
  scenarioComparisons: ScenarioComparison[];
  reports: ForecastingReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateHistoricalFinancialData: true;
  neverPresentForecastsAsGuaranteedOutcomes: true;
  neverExecuteInvestments: true;
  neverApproveBudgets: true;
  neverReplaceInvestmentPlanningWorker: true;
  neverModifyAccountingRecords: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ907OrLater: true;
};

export type ForecastingWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-FRCW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: FrcwCapability[];
  totalForecastSeries: number;
  totalRunwayEstimates: number;
  totalReports: number;
  lastScenario: ScenarioKind | null;
  lastBusinessId: string | null;
  lastReportId: string | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

/** Structural, non-binding consumable contract for the Tax Support Worker (Q9-07). */
export type Q907ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "forecasting-worker";
  missionId: "Q9-06";
  consumerMissionId: "Q9-07";
  exposedFields: string[];
  forecastModelCatalog: string[];
  scenarioKindCatalog: string[];
  forecastMetricCatalog: string[];
  currencyCatalog: string[];
  notes: string[];
  neverImplementQ907OrLater: true;
  structuralSignalOnly: true;
};

export type FrcwRunReport = {
  frcwRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "consume_accounting_records"
    | "consume_cashflow_reports"
    | "consume_budget_reports"
    | "consume_profitability_reports"
    | "forecast_revenue"
    | "forecast_costs"
    | "forecast_cashflow"
    | "estimate_cash_runway"
    | "forecast_profitability"
    | "recommend_reinvestment_options"
    | "compare_scenarios"
    | "run_sensitivity_analysis"
    | "produce_forecasting_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: ForecastingWorkerEngineRecord;
  catalog: ForecastingWorkerCatalog | null;
  historicalBaseline: HistoricalBaseline | null;
  revenueForecast: ForecastSeries | null;
  costForecast: ForecastSeries | null;
  cashflowForecast: ForecastSeries | null;
  profitForecast: ForecastSeries | null;
  cashRunway: CashRunwayEstimate | null;
  reinvestmentOptions: ReinvestmentOption[];
  scenarioComparison: ScenarioComparison | null;
  forecastAssumptions: ForecastAssumption[];
  latestReport: ForecastingReport | null;
  integrations: IntegrationHandshake[];
  validation: FrcwValidationReport;
  durationMs: number;
  metadataVersion: string;
  notes: string[];
};

export type ForecastingWorkerState = {
  engineVersion: "PILLOW-FRCW-001";
  missionId: "Q9-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: ForecastingWorkerConfiguration;
  latestReport: FrcwRunReport | null;
  engineRecord: ForecastingWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalForecastSeries: number;
    totalRunwayEstimates: number;
    lastScenario: ScenarioKind | null;
    lastBusinessId: string | null;
    notes: string[];
  };
};

export type ForecastingWorkerCockpitSnapshot = {
  missionId: "Q9-06";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalForecastSeries: number;
  totalRunwayEstimates: number;
  lastScenario: ScenarioKind | null;
  latestCapitalBusinessId: string | null;
  workerId: string;
  neverFabricateHistoricalFinancialData: true;
  neverPresentForecastsAsGuaranteedOutcomes: true;
  neverExecuteInvestments: true;
  neverApproveBudgets: true;
  neverReplaceInvestmentPlanningWorker: true;
  neverModifyAccountingRecords: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ907OrLater: true;
  consumableByQ907: true;
};

export type WorkerIdentity = {
  workerId: string;
  workerName: string;
  workerType: string;
  department: string;
  factory: string;
  role: string;
  reportingLine: string[];
  skillProfile: string[];
  approvedTools: string[];
  authorityLevel: string;
};
