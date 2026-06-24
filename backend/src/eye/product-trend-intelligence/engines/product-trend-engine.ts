import type { ProductEvidenceSummary } from "../../product-evidence-aggregation/models/product-evidence-summary.js";
import type { ProductTrendCreateInput } from "../models/product-trend.js";
import {
  scoreProductTrend,
  type ProductTrendAnalysisInput,
  type ProductTrendScoreBreakdown,
} from "../scoring/trend-scoring.js";

/** Analyzes product trend movement from current and historical evidence summaries. */
export class ProductTrendEngine {
  analyze(input: ProductTrendAnalysisInput): ProductTrendScoreBreakdown {
    return scoreProductTrend(input);
  }

  toTrendInput(input: ProductTrendAnalysisInput): ProductTrendCreateInput {
    return this.analyze(input);
  }
}

export const defaultProductTrendEngine = new ProductTrendEngine();
