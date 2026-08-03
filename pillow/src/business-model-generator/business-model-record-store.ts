/** X1-04 — Business model record store. */

import { BMG_METADATA_VERSION } from "./paths.js";
import type { BusinessModelRecord, RevenueModelType } from "./types.js";

export class BusinessModelRecordStore {
  private readonly records = new Map<string, BusinessModelRecord>();

  create(input: {
    opportunityReference: string;
    revenueModel: RevenueModelType;
    customerSegment: string;
    valueProposition: string;
    costStructure: string;
    distributionChannels: string;
    partnershipStrategy: string;
    operationalModel: string;
    businessModelScore: number;
  }): BusinessModelRecord {
    const record: BusinessModelRecord = {
      businessModelId: `bmg-mdl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      opportunityReference: input.opportunityReference,
      revenueModel: input.revenueModel,
      customerSegment: input.customerSegment,
      valueProposition: input.valueProposition,
      costStructure: input.costStructure,
      distributionChannels: input.distributionChannels,
      partnershipStrategy: input.partnershipStrategy,
      operationalModel: input.operationalModel,
      businessModelScore: input.businessModelScore,
      structuralSignalOnly: true,
      fabricatedValidationResults: false,
      validationStatus: "pending",
      metadataVersion: BMG_METADATA_VERSION,
    };
    this.records.set(record.businessModelId, record);
    return { ...record };
  }

  persist(record: BusinessModelRecord): BusinessModelRecord {
    const next = {
      ...record,
      structuralSignalOnly: true as const,
      fabricatedValidationResults: false as const,
    };
    this.records.set(next.businessModelId, next);
    return { ...next };
  }

  get(id: string): BusinessModelRecord | null {
    const found = this.records.get(id);
    return found ? { ...found } : null;
  }

  list(): BusinessModelRecord[] {
    return [...this.records.values()].map((r) => ({ ...r }));
  }

  averageScore(): number {
    const all = this.list();
    if (all.length === 0) return 0;
    return Math.round(all.reduce((s, r) => s + r.businessModelScore, 0) / all.length);
  }

  resetForTesting(): void {
    this.records.clear();
  }
}
