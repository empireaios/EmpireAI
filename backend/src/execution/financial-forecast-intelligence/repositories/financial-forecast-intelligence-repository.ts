import type {
  FinancialForecastRecord,
  FinancialForecastRecordCreateInput,
} from "../models/financial-forecast-record.js";

export type FinancialForecastIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for financial forecast intelligence records. */
export type FinancialForecastIntelligenceRepository = {
  save(
    workspaceId: string,
    input: FinancialForecastRecordCreateInput,
  ): Promise<FinancialForecastRecord>;
  getById(workspaceId: string, recordId: string): Promise<FinancialForecastRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<FinancialForecastRecord | null>;
  list(query: FinancialForecastIntelligenceRepositoryQuery): Promise<FinancialForecastRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
