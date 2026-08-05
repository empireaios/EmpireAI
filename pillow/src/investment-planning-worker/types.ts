import type {
  AUDIT_STATUSES,
  CURRENCIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  IPW_CAPABILITIES,
  OPPORTUNITY_TYPES,
  OPERATIONAL_STATES,
  RECOMMENDATION_KINDS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { InvestmentPlanningWorkerConfiguration } from "./configuration.js";
import type { MoneyMinor } from "./money.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];
export type RecommendationKind = (typeof RECOMMENDATION_KINDS)[number];
export type Currency = (typeof CURRENCIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type IpwCapability = (typeof IPW_CAPABILITIES)[number];

export type InjectedLedgerLine = {
  accountId: string;
  debit: number;
  credit: number;
  currency?: string | null;
};

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

export type InjectedCashflowReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  netCashflow?: { currency: string; minorUnits: number } | null;
  closingCashBalance?: { currency: string; minorUnits: number } | null;
  openingCashBalance?: { currency: string; minorUnits: number } | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

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

export type InjectedForecastingReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  forecastPeriod?: string | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

export type InjectedTaxSupportReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  supportingEvidence?: string[];
  confidenceScore?: number | null;
  [key: string]: unknown;
};

export type InjectedBudgetReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  availableBudget?: { currency: string; minorUnits: number } | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

/**
 * Caller-supplied investment opportunity — projections must be documented;
 * this worker never invents ROI, payback, or recommendations without evidence.
 */
export type InvestmentOpportunityInput = {
  opportunityId: string;
  opportunityType: OpportunityType;
  businessOrProject: string;
  capitalRequiredMinor: number;
  currency: string;
  /** Caller-supplied projection in basis points (0–10000). */
  expectedRoiBps?: number | null;
  /** Caller-supplied payback horizon in periods (months). */
  expectedPaybackPeriods?: number | null;
  /** Caller-supplied strategic alignment in basis points. */
  strategicAlignmentBps?: number | null;
  /** Caller-supplied risk score in basis points — higher = riskier. */
  riskScoreBps?: number | null;
  operationalDependencies: string[];
  evidenceRefs: string[];
  /** Documented assumptions for projected ROI/payback — required when projections present. */
  assumptions: string[];
  /** Optional measured available capital context supplied by caller. */
  measuredAvailableCapitalMinor?: number | null;
  fabricated: false;
};

export type PaybackSource = "caller_supplied" | "projected_derived" | "not_available";

export type MeasuredVsProjectedFlags = {
  roiIsProjected: boolean;
  paybackIsProjected: boolean;
  paybackSource: PaybackSource;
  availableCapitalIsMeasured: boolean;
  capitalRequiredIsCallerSupplied: true;
};

export type EvaluatedOpportunity = {
  opportunityId: string;
  opportunityType: OpportunityType;
  businessOrProject: string;
  capitalRequiredMinor: number;
  currency: string;
  expectedRoiBps: number | null;
  expectedPaybackPeriods: number | null;
  strategicAlignmentBps: number | null;
  riskScoreBps: number | null;
  operationalDependencies: string[];
  evidenceRefs: string[];
  assumptions: string[];
  opportunityScore: number;
  recommendation: RecommendationKind;
  supportingEvidence: string[];
  measuredVsProjected: MeasuredVsProjectedFlags;
  capitalFit: boolean;
  fabricated: false;
};

export type CapitalAllocationRecommendation = {
  recommendationId: string;
  opportunityId: string;
  businessOrProject: string;
  recommendedCapitalMinor: number;
  currency: string;
  rank: number;
  opportunityScore: number;
  recommendation: RecommendationKind;
  /** Recommendation only — never execution or capital movement. */
  signalKind: "capital_allocation_recommendation";
  isExecution: false;
  isApproval: false;
  supportingEvidence: string[];
  fabricated: false;
};

export type RiskAssessmentSummary = {
  assessedOpportunityCount: number;
  elevatedRiskCount: number;
  averageRiskScoreBps: number;
  highestRiskOpportunityId: string | null;
  signalKind: "risk_assessment_summary";
  fabricated: false;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "bound" | "unavailable";
  timestamp: string;
  details: string;
};

export type ValidationResult = {
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
};

export type ExpectedRoiSummary = {
  opportunityCountWithRoi: number;
  averageExpectedRoiBps: number | null;
  highestExpectedRoiBps: number | null;
  highestRoiOpportunityId: string | null;
  /** All ROI values are caller projections — never measured returns. */
  recordKind: "projected_caller_supplied";
  fabricated: false;
};

export type PaybackSummary = {
  opportunityCountWithPayback: number;
  averagePaybackPeriods: number | null;
  shortestPaybackPeriods: number | null;
  shortestPaybackOpportunityId: string | null;
  callerSuppliedCount: number;
  projectedDerivedCount: number;
  recordKind: "mixed_projected_payback";
  fabricated: false;
};

export type StrategicAlignmentSummary = {
  opportunityCountWithAlignment: number;
  averageStrategicAlignmentBps: number | null;
  highestStrategicAlignmentBps: number | null;
  highestAlignmentOpportunityId: string | null;
  recordKind: "caller_supplied_alignment";
  fabricated: false;
};

export type InvestmentPlanningReport = {
  reportId: string;
  timestamp: string;
  capitalProjectId: string;
  /** Canonical evaluation period (alias of planningPeriod for mission report shape). */
  evaluationPeriod: string;
  planningPeriod: string;
  /** Mission alias for evaluatedOpportunities. */
  investmentOpportunities: EvaluatedOpportunity[];
  evaluatedOpportunities: EvaluatedOpportunity[];
  capitalAllocationRecommendations: CapitalAllocationRecommendation[];
  opportunityRankings: EvaluatedOpportunity[];
  rankedOpportunities: EvaluatedOpportunity[];
  expectedRoiSummary: ExpectedRoiSummary;
  paybackSummary: PaybackSummary;
  strategicAlignmentSummary: StrategicAlignmentSummary;
  riskAssessment: RiskAssessmentSummary;
  availableCapital: MoneyMinor | null;
  availableCapitalSource: "measured_cashflow" | "measured_input" | "not_available";
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: typeof import("./paths.js").IPW_METADATA_VERSION;
  reportVersion: typeof import("./paths.js").INVESTMENT_PLANNING_REPORT_VERSION;
  workerId: string;
  capitalBusinessId: string;
  currency: string;
  validation: ValidationResult;
  runTimestamp: string;
  consumableByQ909: true;
  submittedThroughExecutiveReportingRuntime: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  neverExecuteInvestments: true;
  neverApproveInvestments: true;
  neverMoveOrAllocateCapital: true;
  neverModifyAccountingRecords: true;
  neverFabricateRoiOrPaybackOrRecommendations: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ909OrLater: true;
  preserveCompleteTraceability: true;
  preserveInvestmentHistory: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  measuredDataDistinctFromProjections: true;
};

export type Q909ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "investment-planning-worker";
  missionId: "Q9-08";
  consumerMissionId: "Q9-09";
  exposedFields: string[];
  opportunityTypeCatalog: string[];
  recommendationKindCatalog: string[];
  currencyCatalog: string[];
  notes: string[];
  neverImplementQ909OrLater: true;
  structuralSignalOnly: true;
};

export type InvestmentPlanningWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-IPW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: IpwCapability[];
  totalOpportunities: number;
  totalReports: number;
  totalRecommendations: number;
  lastBusinessId: string | null;
  lastPlanningPeriod: string | null;
  dependencyPresence: {
    capitalFactoryCore: boolean;
    accountingWorker: boolean;
    cashflowWorker: boolean;
    budgetPlanningWorker: boolean;
    profitabilityWorker: boolean;
    forecastingWorker: boolean;
    taxSupportWorker: boolean;
  };
  metadataVersion: typeof import("./paths.js").IPW_METADATA_VERSION;
};

export type InvestmentPlanningWorkerCatalog = {
  catalogVersion: string;
  opportunityTypes: string[];
  recommendationKinds: string[];
  currencies: string[];
  capabilities: IpwCapability[];
  scoringWeightKeys: string[];
};

export type IpwInput = {
  capitalBusinessId?: string | null;
  capitalProjectId?: string | null;
  planningPeriod?: string | null;
  currency?: string | null;
  opportunities?: InvestmentOpportunityInput[] | null;
  /** Measured available capital when supplied by caller — never fabricated. */
  availableCapitalMinor?: number | null;
  validated?: boolean | null;
  forceFail?: boolean | null;
};

export type IpwAction =
  | "connect"
  | "consume_accounting"
  | "consume_cashflow"
  | "consume_profitability"
  | "consume_forecasting"
  | "consume_tax_support"
  | "consume_budget"
  | "evaluate_opportunities"
  | "compare_alternatives"
  | "rank_opportunities"
  | "assess_risks"
  | "produce_investment_planning_report"
  | "submit_report"
  | "list"
  | "validate"
  | "diagnostics";

export type IpwRunReport = {
  action: IpwAction;
  validation: ValidationResult;
  runTimestamp: string;
  capitalBusinessId?: string | null;
  planningPeriod?: string | null;
  evaluatedOpportunities?: EvaluatedOpportunity[] | null;
  rankedOpportunities?: EvaluatedOpportunity[] | null;
  capitalAllocationRecommendations?: CapitalAllocationRecommendation[] | null;
  riskAssessment?: RiskAssessmentSummary | null;
  investmentPlanningReport?: InvestmentPlanningReport | null;
  handshakes?: IntegrationHandshake[] | null;
  details?: string | null;
};

export type InvestmentPlanningWorkerState = {
  engineVersion: "PILLOW-IPW-001";
  missionId: "Q9-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: InvestmentPlanningWorkerConfiguration;
  latestReport: InvestmentPlanningReport | null;
  engineRecord: InvestmentPlanningWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalOpportunities: number;
    totalReports: number;
    totalRecommendations: number;
    lastBusinessId: string | null;
    notes: string[];
  };
};

export type InvestmentPlanningWorkerCockpitSnapshot = {
  missionId: "Q9-08";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalOpportunities: number;
  totalReports: number;
  totalRecommendations: number;
  latestCapitalBusinessId: string | null;
  workerId: string;
  neverExecuteInvestments: true;
  neverApproveInvestments: true;
  neverMoveOrAllocateCapital: true;
  neverModifyAccountingRecords: true;
  neverFabricateRoiOrPaybackOrRecommendations: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ909OrLater: true;
  consumableByQ909: true;
};
