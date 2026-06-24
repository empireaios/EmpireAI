import { randomUUID } from "node:crypto";
import { getDatabase } from "../brain/database.js";
import {
  PIE_DIMENSION_LABELS,
  PIE_DIMENSION_WEIGHTS,
  type PieDimensionScore,
  type PieRecommendation,
  type PieScoreDimension,
  type ProductIntelligenceScore,
} from "./types.js";

export type PieScoreInput = {
  workspaceId: string;
  productId?: string;
  productName: string;
  signals?: Partial<Record<PieScoreDimension, { score: number; evidence?: string[] }>>;
};

function recommend(composite: number, refundRisk: number): PieRecommendation {
  if (refundRisk >= 75) return "reject";
  if (composite >= 85) return "strong_buy";
  if (composite >= 70) return "buy";
  if (composite >= 50) return "watch";
  return "avoid";
}

function buildDimension(
  dimension: PieScoreDimension,
  score: number,
  evidence: string[] = [],
): PieDimensionScore {
  const clamped = Math.max(0, Math.min(100, score));
  return {
    dimension,
    score: clamped,
    weight: PIE_DIMENSION_WEIGHTS[dimension],
    rationale: `${PIE_DIMENSION_LABELS[dimension]} scored ${clamped}/100 based on available signals.`,
    evidence,
  };
}

/** Product Intelligence Engine — framework scorer with explainability. */
export class ProductIntelligenceEngine {
  score(input: PieScoreInput): ProductIntelligenceScore {
    const signals = input.signals ?? {};
    const dimensions: PieDimensionScore[] = (
      Object.keys(PIE_DIMENSION_WEIGHTS) as PieScoreDimension[]
    ).map((dimension) =>
      buildDimension(
        dimension,
        signals[dimension]?.score ?? 50,
        signals[dimension]?.evidence ?? ["Framework default — awaiting live connector data"],
      ),
    );

    const compositeScore = Math.round(
      dimensions.reduce((sum, d) => sum + d.score * d.weight, 0),
    );
    const confidence = Math.min(
      100,
      Math.round(
        (dimensions.filter((d) => (signals[d.dimension]?.evidence?.length ?? 0) > 0).length /
          dimensions.length) *
          100,
      ) || 35,
    );

    const refund = dimensions.find((d) => d.dimension === "refundRisk")?.score ?? 50;
    const recommendation = recommend(compositeScore, refund);

    const why = dimensions
      .sort((a, b) => b.weight * b.score - a.weight * a.score)
      .slice(0, 4)
      .map((d) => `${PIE_DIMENSION_LABELS[d.dimension]} (${d.score}/100): ${d.rationale}`);

    return {
      productId: input.productId,
      productName: input.productName,
      workspaceId: input.workspaceId,
      dimensions,
      compositeScore,
      confidence,
      recommendation,
      summary: `${input.productName} received a composite score of ${compositeScore}/100 with ${recommendation.replace("_", " ")} recommendation.`,
      why,
      scoredAt: new Date().toISOString(),
    };
  }

  persist(score: ProductIntelligenceScore): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO pie_product_scores
        (id, workspace_id, product_id, product_name, scores, recommendation, rationale, confidence, created_at)
       VALUES (@id, @workspaceId, @productId, @productName, @scores, @recommendation, @rationale, @confidence, @createdAt)`,
    ).run({
      id: randomUUID(),
      workspaceId: score.workspaceId,
      productId: score.productId ?? null,
      productName: score.productName,
      scores: JSON.stringify(score.dimensions),
      recommendation: score.recommendation,
      rationale: JSON.stringify(score.why),
      confidence: score.confidence,
      createdAt: score.scoredAt,
    });
  }
}

export const productIntelligenceEngine = new ProductIntelligenceEngine();
