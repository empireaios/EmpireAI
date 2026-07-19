/** X1-03 — Market Demand Analyzer (structural signals). */

import type { MarketValidationRecord } from "./types.js";

export class MarketDemandAnalyzer {
  analyzeDemand(record: MarketValidationRecord, demandScore: number): MarketValidationRecord {
    return {
      ...record,
      marketDemandScore: demandScore,
      structuralSignalOnly: true,
      fabricatedValidationResults: false,
      timestamp: new Date().toISOString(),
    };
  }

  analyzeMarketSize(record: MarketValidationRecord, sizeScore: number): MarketValidationRecord {
    return {
      ...record,
      marketSizeScore: sizeScore,
      structuralSignalOnly: true,
      fabricatedValidationResults: false,
      timestamp: new Date().toISOString(),
    };
  }
}
