import type {
  PricingIntelligenceRecord,
  PricingIntelligenceRecordCreateInput,
} from "../models/pricing-intelligence-record.js";

export type PricingIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for pricing intelligence records. */
export type PricingIntelligenceRepository = {
  save(
    workspaceId: string,
    input: PricingIntelligenceRecordCreateInput,
  ): Promise<PricingIntelligenceRecord>;
  getById(workspaceId: string, recordId: string): Promise<PricingIntelligenceRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<PricingIntelligenceRecord | null>;
  list(query: PricingIntelligenceRepositoryQuery): Promise<PricingIntelligenceRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
