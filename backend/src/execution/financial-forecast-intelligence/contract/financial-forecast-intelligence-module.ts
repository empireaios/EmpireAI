/**
 * Financial Forecast Intelligence module — revenue/profit forecasts without auto-apply.
 */

import {
  FinancialForecastIntelligenceEngine,
  defaultFinancialForecastIntelligenceEngine,
  type FinancialForecastInput,
} from "../engines/financial-forecast-intelligence-engine.js";
import type { FinancialForecastRecord } from "../models/financial-forecast-record.js";
import {
  generateFinancialForecast,
  financialForecastIntelligenceScoring,
  type FinancialForecastBrandInput,
  type FinancialForecastOfferInput,
} from "../scoring/financial-forecast-intelligence-scoring.js";
import type {
  FinancialForecastIntelligenceRepository,
  FinancialForecastIntelligenceRepositoryQuery,
} from "../repositories/financial-forecast-intelligence-repository.js";
import { createInMemoryFinancialForecastIntelligenceRepository } from "../repositories/in-memory-financial-forecast-intelligence-repository.js";

export const FINANCIAL_FORECAST_INTELLIGENCE_MODULE_ID = "financial-forecast-intelligence" as const;
export type FinancialForecastIntelligenceModuleId =
  typeof FINANCIAL_FORECAST_INTELLIGENCE_MODULE_ID;

export const FINANCIAL_FORECAST_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type FinancialForecastIntelligenceCapability =
  | "financial-forecast-intelligence.forecast"
  | "financial-forecast-intelligence.score"
  | "financial-forecast-intelligence.persist"
  | "financial-forecast-intelligence.list";

export const FINANCIAL_FORECAST_INTELLIGENCE_CAPABILITIES: readonly FinancialForecastIntelligenceCapability[] =
  [
    "financial-forecast-intelligence.forecast",
    "financial-forecast-intelligence.score",
    "financial-forecast-intelligence.persist",
    "financial-forecast-intelligence.list",
  ] as const;

export type FinancialForecastIntelligenceModuleContract = {
  moduleId: FinancialForecastIntelligenceModuleId;
  version: string;
  capabilities: readonly FinancialForecastIntelligenceCapability[];
};

export const FINANCIAL_FORECAST_INTELLIGENCE_MODULE_CONTRACT: FinancialForecastIntelligenceModuleContract =
  {
    moduleId: FINANCIAL_FORECAST_INTELLIGENCE_MODULE_ID,
    version: FINANCIAL_FORECAST_INTELLIGENCE_MODULE_VERSION,
    capabilities: FINANCIAL_FORECAST_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates financial forecast generation and persistence. */
export class FinancialForecastIntelligenceModule {
  readonly contract = FINANCIAL_FORECAST_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: FinancialForecastIntelligenceEngine;

  constructor(
    private readonly repository: FinancialForecastIntelligenceRepository,
    engine?: FinancialForecastIntelligenceEngine,
  ) {
    this.engine = engine ?? new FinancialForecastIntelligenceEngine(repository);
  }

  generateFinancialForecast = generateFinancialForecast;
  scoring = financialForecastIntelligenceScoring;

  generateForecast(input: FinancialForecastInput) {
    return this.engine.generateForecast(input);
  }

  async persistForecast(
    workspaceId: string,
    input: FinancialForecastInput,
  ): Promise<FinancialForecastRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getForecastRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<FinancialForecastRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getForecastByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<FinancialForecastRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listForecastRecords(
    workspaceId: string,
    filters: Omit<FinancialForecastIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<FinancialForecastRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a financial forecast intelligence module. */
export function createFinancialForecastIntelligenceModule(
  repository: FinancialForecastIntelligenceRepository = createInMemoryFinancialForecastIntelligenceRepository(),
  engine?: FinancialForecastIntelligenceEngine,
): FinancialForecastIntelligenceModule {
  return new FinancialForecastIntelligenceModule(
    repository,
    engine ?? new FinancialForecastIntelligenceEngine(repository),
  );
}

export const financialForecastIntelligenceModule = createFinancialForecastIntelligenceModule();

export type { FinancialForecastInput, FinancialForecastBrandInput, FinancialForecastOfferInput };

export { defaultFinancialForecastIntelligenceEngine };
