/** X1-03 — Opportunity Validation Engine (record store). */

import { MVE_METADATA_VERSION } from "./paths.js";
import type { InvestmentRecommendation, MarketRisk, MarketValidationRecord } from "./types.js";

export class OpportunityValidationEngine {
  private readonly records = new Map<string, MarketValidationRecord>();

  create(input: {
    opportunityReference: string;
    industry: string;
    marketDemandScore: number;
    competitionScore: number;
    profitabilityScore: number;
    marketSizeScore: number;
    customerInterestScore: number;
    validationConfidence: number;
    investmentRecommendation: InvestmentRecommendation;
    identifiedRisks: MarketRisk[];
  }): MarketValidationRecord {
    const record: MarketValidationRecord = {
      validationId: `mve-vld-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      opportunityReference: input.opportunityReference,
      industry: input.industry,
      marketDemandScore: input.marketDemandScore,
      competitionScore: input.competitionScore,
      profitabilityScore: input.profitabilityScore,
      marketSizeScore: input.marketSizeScore,
      customerInterestScore: input.customerInterestScore,
      validationConfidence: input.validationConfidence,
      investmentRecommendation: input.investmentRecommendation,
      identifiedRisks: [...input.identifiedRisks],
      structuralSignalOnly: true,
      fabricatedValidationResults: false,
      validationStatus: "pending",
      metadataVersion: MVE_METADATA_VERSION,
    };
    this.records.set(record.validationId, record);
    return { ...record, identifiedRisks: [...record.identifiedRisks] };
  }

  persist(record: MarketValidationRecord): MarketValidationRecord {
    const next = {
      ...record,
      identifiedRisks: [...record.identifiedRisks],
      structuralSignalOnly: true as const,
      fabricatedValidationResults: false as const,
    };
    this.records.set(next.validationId, next);
    return { ...next, identifiedRisks: [...next.identifiedRisks] };
  }

  get(id: string): MarketValidationRecord | null {
    const found = this.records.get(id);
    return found ? { ...found, identifiedRisks: [...found.identifiedRisks] } : null;
  }

  list(): MarketValidationRecord[] {
    return [...this.records.values()].map((r) => ({
      ...r,
      identifiedRisks: [...r.identifiedRisks],
    }));
  }

  averageConfidence(): number {
    const all = this.list();
    if (all.length === 0) return 0;
    return Math.round(all.reduce((s, r) => s + r.validationConfidence, 0) / all.length);
  }

  resetForTesting(): void {
    this.records.clear();
  }
}
