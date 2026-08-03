import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  FORECAST_METRICS,
  FORECAST_MODELS,
  FORECASTING_WORKER_IDENTITY,
  INTEGRATION_TARGETS,
  SCENARIO_KINDS,
} from "./paths.js";
import type { HistoricalPoint } from "./types.js";

export type ForecastingWorkerConfiguration = {
  enabled: boolean;
  forecastingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  forecastModels: string[];
  scenarioKinds: string[];
  forecastMetrics: string[];
  currencies: string[];
  defaultCurrency: string;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedHistoricalPoints: HistoricalPoint[];
  /** Default number of future periods projected forward when the caller omits horizonPeriods. */
  defaultHorizonPeriods: number;
  /** Default spread (basis points) applied to derive best_case/worst_case from the expected growth rate. */
  defaultSensitivityDeltaBps: number;
  /** Basis-point tiers (of the monthly surplus) offered as structural reinvestment suggestions. */
  reinvestmentTierBps: number[];
  /** Minimum runway (months) — or indefinite surplus — required before reinvestment options are recommended. */
  healthyRunwayMonthsThreshold: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q9-06 hard boundaries — force-locked true. */
  neverFabricateHistoricalFinancialData: true;
  neverPresentForecastsAsGuaranteedOutcomes: true;
  neverExecuteInvestments: true;
  neverApproveBudgets: true;
  neverReplaceInvestmentPlanningWorker: true;
  neverModifyAccountingRecords: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ907OrLater: true;
  preserveCompleteTraceability: true;
  preserveForecastHistory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_FORECASTING_WORKER_CONFIGURATION: ForecastingWorkerConfiguration = {
  enabled: true,
  forecastingRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  forecastModels: [...FORECAST_MODELS],
  scenarioKinds: [...SCENARIO_KINDS],
  forecastMetrics: [...FORECAST_METRICS],
  currencies: [...CURRENCIES],
  defaultCurrency: DEFAULT_CURRENCY,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: FORECASTING_WORKER_IDENTITY.workerId,
  workerName: FORECASTING_WORKER_IDENTITY.workerName,
  factory: FORECASTING_WORKER_IDENTITY.factory,
  department: FORECASTING_WORKER_IDENTITY.department,
  role: FORECASTING_WORKER_IDENTITY.role,
  reportingLine: [...FORECASTING_WORKER_IDENTITY.reportingLine],
  seedHistoricalPoints: [],
  defaultHorizonPeriods: 3,
  defaultSensitivityDeltaBps: 500,
  reinvestmentTierBps: [2500, 5000, 7500],
  healthyRunwayMonthsThreshold: 6,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateHistoricalFinancialData: true,
  neverPresentForecastsAsGuaranteedOutcomes: true,
  neverExecuteInvestments: true,
  neverApproveBudgets: true,
  neverReplaceInvestmentPlanningWorker: true,
  neverModifyAccountingRecords: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ907OrLater: true,
  preserveCompleteTraceability: true,
  preserveForecastHistory: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildForecastingWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ForecastingWorkerConfiguration> = {},
): ForecastingWorkerConfiguration {
  let file: Partial<ForecastingWorkerConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "forecasting-worker.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.FORECASTING_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.FORECASTING_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "forecastModels" | "scenarioKinds" | "forecastMetrics" | "currencies" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_FORECASTING_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_FORECASTING_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    forecastModels: mergeList("forecastModels"),
    scenarioKinds: mergeList("scenarioKinds"),
    forecastMetrics: mergeList("forecastMetrics"),
    currencies: mergeList("currencies"),
    integrationTargets: mergeList("integrationTargets"),
    defaultCurrency:
      overrides.defaultCurrency ?? file.defaultCurrency ?? DEFAULT_FORECASTING_WORKER_CONFIGURATION.defaultCurrency,
    reportingLine: [
      ...(overrides.reportingLine ?? file.reportingLine ?? DEFAULT_FORECASTING_WORKER_CONFIGURATION.reportingLine),
    ],
    reinvestmentTierBps: [
      ...(overrides.reinvestmentTierBps ??
        file.reinvestmentTierBps ??
        DEFAULT_FORECASTING_WORKER_CONFIGURATION.reinvestmentTierBps),
    ],
    seedHistoricalPoints: (overrides.seedHistoricalPoints ?? file.seedHistoricalPoints ?? []).map(lockHistoricalPoint),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverFabricateHistoricalFinancialData: true,
    neverPresentForecastsAsGuaranteedOutcomes: true,
    neverExecuteInvestments: true,
    neverApproveBudgets: true,
    neverReplaceInvestmentPlanningWorker: true,
    neverModifyAccountingRecords: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ907OrLater: true,
    preserveCompleteTraceability: true,
    preserveForecastHistory: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockHistoricalPoint(point: HistoricalPoint): HistoricalPoint {
  return { ...point, isHistorical: true, fabricated: false };
}
