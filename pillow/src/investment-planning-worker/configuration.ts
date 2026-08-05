import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  INTEGRATION_TARGETS,
  INVESTMENT_PLANNING_WORKER_IDENTITY,
  OPPORTUNITY_TYPES,
  RECOMMENDATION_KINDS,
  SCORING_WEIGHT_KEYS,
} from "./paths.js";

export type ScoringWeights = {
  roiBps: number;
  strategicAlignmentBps: number;
  paybackBps: number;
  riskAdjustedBps: number;
};

export type InvestmentPlanningWorkerConfiguration = {
  enabled: boolean;
  investmentPlanningRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  opportunityTypes: string[];
  recommendationKinds: string[];
  currencies: string[];
  defaultCurrency: string;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  scoringWeights: ScoringWeights;
  recommendThresholdBps: number;
  deferThresholdBps: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
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
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  measuredDataDistinctFromProjections: true;
};

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  roiBps: 35,
  strategicAlignmentBps: 25,
  paybackBps: 20,
  riskAdjustedBps: 20,
};

export const DEFAULT_INVESTMENT_PLANNING_WORKER_CONFIGURATION: InvestmentPlanningWorkerConfiguration = {
  enabled: true,
  investmentPlanningRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  opportunityTypes: [...OPPORTUNITY_TYPES],
  recommendationKinds: [...RECOMMENDATION_KINDS],
  currencies: [...CURRENCIES],
  defaultCurrency: DEFAULT_CURRENCY,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: INVESTMENT_PLANNING_WORKER_IDENTITY.workerId,
  workerName: INVESTMENT_PLANNING_WORKER_IDENTITY.workerName,
  factory: INVESTMENT_PLANNING_WORKER_IDENTITY.factory,
  department: INVESTMENT_PLANNING_WORKER_IDENTITY.department,
  role: INVESTMENT_PLANNING_WORKER_IDENTITY.role,
  reportingLine: [...INVESTMENT_PLANNING_WORKER_IDENTITY.reportingLine],
  scoringWeights: { ...DEFAULT_SCORING_WEIGHTS },
  recommendThresholdBps: 6000,
  deferThresholdBps: 4000,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
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
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  measuredDataDistinctFromProjections: true,
};

export function buildInvestmentPlanningWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<InvestmentPlanningWorkerConfiguration> = {},
): InvestmentPlanningWorkerConfiguration {
  let file: Partial<InvestmentPlanningWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "investment-planning-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.INVESTMENT_PLANNING_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.INVESTMENT_PLANNING_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (
    key: "opportunityTypes" | "recommendationKinds" | "currencies" | "integrationTargets",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_INVESTMENT_PLANNING_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  const fileWeights: Partial<ScoringWeights> = file.scoringWeights ?? {};
  const overrideWeights: Partial<ScoringWeights> = overrides.scoringWeights ?? {};

  return {
    ...DEFAULT_INVESTMENT_PLANNING_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    opportunityTypes: mergeList("opportunityTypes"),
    recommendationKinds: mergeList("recommendationKinds"),
    currencies: mergeList("currencies"),
    integrationTargets: mergeList("integrationTargets"),
    defaultCurrency:
      overrides.defaultCurrency ?? file.defaultCurrency ?? DEFAULT_INVESTMENT_PLANNING_WORKER_CONFIGURATION.defaultCurrency,
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_INVESTMENT_PLANNING_WORKER_CONFIGURATION.reportingLine),
    ],
    scoringWeights: {
      roiBps: overrideWeights.roiBps ?? fileWeights.roiBps ?? DEFAULT_SCORING_WEIGHTS.roiBps,
      strategicAlignmentBps:
        overrideWeights.strategicAlignmentBps ??
        fileWeights.strategicAlignmentBps ??
        DEFAULT_SCORING_WEIGHTS.strategicAlignmentBps,
      paybackBps: overrideWeights.paybackBps ?? fileWeights.paybackBps ?? DEFAULT_SCORING_WEIGHTS.paybackBps,
      riskAdjustedBps:
        overrideWeights.riskAdjustedBps ?? fileWeights.riskAdjustedBps ?? DEFAULT_SCORING_WEIGHTS.riskAdjustedBps,
    },
    recommendThresholdBps:
      overrides.recommendThresholdBps ??
      file.recommendThresholdBps ??
      DEFAULT_INVESTMENT_PLANNING_WORKER_CONFIGURATION.recommendThresholdBps,
    deferThresholdBps:
      overrides.deferThresholdBps ??
      file.deferThresholdBps ??
      DEFAULT_INVESTMENT_PLANNING_WORKER_CONFIGURATION.deferThresholdBps,
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
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
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    measuredDataDistinctFromProjections: true,
  };
}

export { SCORING_WEIGHT_KEYS };
