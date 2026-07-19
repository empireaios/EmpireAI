/** X1-02 — Opportunity Discovery Engine (record store). */

import { BOD_METADATA_VERSION } from "./paths.js";
import type { OpportunityCategory, OpportunityRecord } from "./types.js";

export class OpportunityDiscoveryEngine {
  private readonly records = new Map<string, OpportunityRecord>();

  create(input: {
    opportunityCategory: OpportunityCategory;
    industry: string;
    marketReference: string;
    opportunityScore: number;
    estimatedProfitability: number;
    confidenceScore: number;
  }): OpportunityRecord {
    const record: OpportunityRecord = {
      opportunityId: `bod-opp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      opportunityCategory: input.opportunityCategory,
      industry: input.industry,
      marketReference: input.marketReference,
      opportunityScore: input.opportunityScore,
      estimatedProfitability: input.estimatedProfitability,
      confidenceScore: input.confidenceScore,
      ranking: null,
      structuralSignalOnly: true,
      fabricatedMarketInformation: false,
      validationStatus: "pending",
      metadataVersion: BOD_METADATA_VERSION,
    };
    this.records.set(record.opportunityId, record);
    return { ...record };
  }

  persist(record: OpportunityRecord): OpportunityRecord {
    const next = {
      ...record,
      structuralSignalOnly: true as const,
      fabricatedMarketInformation: false as const,
    };
    this.records.set(next.opportunityId, next);
    return { ...next };
  }

  get(id: string): OpportunityRecord | null {
    const found = this.records.get(id);
    return found ? { ...found } : null;
  }

  list(): OpportunityRecord[] {
    return [...this.records.values()].map((r) => ({ ...r }));
  }

  averageScore(): number {
    const all = this.list();
    if (all.length === 0) return 0;
    return Math.round(all.reduce((s, r) => s + r.opportunityScore, 0) / all.length);
  }

  resetForTesting(): void {
    this.records.clear();
  }
}
