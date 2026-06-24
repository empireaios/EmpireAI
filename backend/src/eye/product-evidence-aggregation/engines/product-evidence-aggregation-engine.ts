import type { GlobalProductSignal } from "../../global-product-signals/models/product-signal.js";
import type { ProductEvidenceSummaryCreateInput } from "../models/product-evidence-summary.js";
import {
  aggregateProductEvidence,
  type EvidenceAggregationScoreBreakdown,
} from "../scoring/evidence-aggregation-scoring.js";

/** Aggregates global product signals into product evidence summaries. */
export class ProductEvidenceAggregationEngine {
  aggregate(productId: string, signals: GlobalProductSignal[]): EvidenceAggregationScoreBreakdown {
    return aggregateProductEvidence(productId, signals);
  }

  summarize(productId: string, signals: GlobalProductSignal[]): ProductEvidenceSummaryCreateInput {
    return this.aggregate(productId, signals);
  }
}

export const defaultProductEvidenceAggregationEngine = new ProductEvidenceAggregationEngine();
