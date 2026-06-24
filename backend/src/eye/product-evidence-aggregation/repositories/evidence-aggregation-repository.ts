import type {
  ProductEvidenceSummary,
  ProductEvidenceSummaryCreateInput,
  ProductEvidenceSummaryUpdateInput,
} from "../models/product-evidence-summary.js";

export type EvidenceAggregationListQuery = {
  workspaceId: string;
  productId?: string;
  minEvidenceScore?: number;
  limit?: number;
  offset?: number;
};

/** Persistence contract for product evidence aggregation summaries. */
export interface EvidenceAggregationRepository {
  save(
    workspaceId: string,
    input: ProductEvidenceSummaryCreateInput,
  ): Promise<ProductEvidenceSummary>;
  getById(workspaceId: string, id: string): Promise<ProductEvidenceSummary | null>;
  getByProductId(workspaceId: string, productId: string): Promise<ProductEvidenceSummary | null>;
  update(
    workspaceId: string,
    id: string,
    input: ProductEvidenceSummaryUpdateInput,
  ): Promise<ProductEvidenceSummary>;
  delete(workspaceId: string, id: string): Promise<boolean>;
  list(query: EvidenceAggregationListQuery): Promise<ProductEvidenceSummary[]>;
}
