import type { FinancialForecastRecord } from "../models/financial-forecast-record.js";
import type { FinancialForecastIntelligenceRepository } from "../repositories/financial-forecast-intelligence-repository.js";
import {
  generateFinancialForecast,
  type FinancialForecastInput,
} from "../scoring/financial-forecast-intelligence-scoring.js";

/** Generates financial forecast intelligence from brand and offer inputs. */
export class FinancialForecastIntelligenceEngine {
  constructor(private readonly repository: FinancialForecastIntelligenceRepository) {}

  generateForecast(input: FinancialForecastInput) {
    return generateFinancialForecast(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: FinancialForecastInput,
  ): Promise<FinancialForecastRecord> {
    const breakdown = generateFinancialForecast(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultFinancialForecastIntelligenceEngine = {
  generateForecast: generateFinancialForecast,
};

export type { FinancialForecastInput };
