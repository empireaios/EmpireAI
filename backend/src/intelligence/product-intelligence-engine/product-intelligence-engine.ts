import { randomUUID } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import { deriveRecommendation } from "./recommendation-engine.js";
import { computeAllScores, computeConfidence } from "./score-computers.js";
import type {
  ProductIntelligenceEvaluation,
  ProductIntelligenceInput,
  ProductIntelligenceScores,
} from "./types.js";
import { PIE_EVALUATION_WEIGHTS } from "./types.js";

function computeOverallScore(scores: ProductIntelligenceScores): number {
  const weighted =
    scores.demandScore * PIE_EVALUATION_WEIGHTS.demandScore +
    scores.competitionScore * PIE_EVALUATION_WEIGHTS.competitionScore +
    scores.marginScore * PIE_EVALUATION_WEIGHTS.marginScore +
    scores.shippingScore * PIE_EVALUATION_WEIGHTS.shippingScore +
    scores.supplierReliability * PIE_EVALUATION_WEIGHTS.supplierReliability;

  return Math.max(0, Math.min(100, Math.round(weighted)));
}

/**
 * Product Intelligence Engine (Mission 005) — standalone product evaluation service.
 * Distinct from Product Scout (Empire scoring + Guardian gates) and legacy pie-engine framework scorer.
 */
export class ProductIntelligenceEvaluationEngine {
  /** Single public entry point — evaluates a product from structured input signals. */
  evaluateProduct(input: ProductIntelligenceInput): ProductIntelligenceEvaluation {
    const scores = computeAllScores(input);
    const overallScore = computeOverallScore(scores);
    const confidence = computeConfidence(input);

    const { recommendation, explanation } = deriveRecommendation({
      scores,
      overallScore,
      confidence,
      productTitle: input.productTitle,
    });

    return {
      ...scores,
      overallScore,
      recommendation,
      explanation,
      confidence,
      productTitle: input.productTitle,
      category: input.category,
      evaluatedAt: new Date().toISOString(),
    };
  }

  persist(evaluation: ProductIntelligenceEvaluation, workspaceId: string, productId?: string): void {
    const db = getDatabase();
    const scoresJson = JSON.stringify({
      demandScore: evaluation.demandScore,
      competitionScore: evaluation.competitionScore,
      marginScore: evaluation.marginScore,
      shippingScore: evaluation.shippingScore,
      supplierReliability: evaluation.supplierReliability,
    });

    if (productId) {
      const existing = db
        .prepare(
          `SELECT id FROM product_intelligence_evaluations
           WHERE workspace_id = @workspaceId AND product_id = @productId`,
        )
        .get({ workspaceId, productId }) as { id: string } | undefined;

      if (existing) {
        db.prepare(
          `UPDATE product_intelligence_evaluations SET
            product_title = @productTitle,
            category = @category,
            scores = @scores,
            overall_score = @overallScore,
            recommendation = @recommendation,
            explanation = @explanation,
            confidence = @confidence,
            created_at = @createdAt
           WHERE id = @id`,
        ).run({
          id: existing.id,
          productTitle: evaluation.productTitle,
          category: evaluation.category,
          scores: scoresJson,
          overallScore: evaluation.overallScore,
          recommendation: evaluation.recommendation,
          explanation: evaluation.explanation,
          confidence: evaluation.confidence,
          createdAt: evaluation.evaluatedAt,
        });
        return;
      }
    }

    db.prepare(
      `INSERT INTO product_intelligence_evaluations
        (id, workspace_id, product_id, product_title, category, scores, overall_score,
         recommendation, explanation, confidence, created_at)
       VALUES (@id, @workspaceId, @productId, @productTitle, @category, @scores, @overallScore,
         @recommendation, @explanation, @confidence, @createdAt)`,
    ).run({
      id: randomUUID(),
      workspaceId,
      productId: productId ?? null,
      productTitle: evaluation.productTitle,
      category: evaluation.category,
      scores: scoresJson,
      overallScore: evaluation.overallScore,
      recommendation: evaluation.recommendation,
      explanation: evaluation.explanation,
      confidence: evaluation.confidence,
      createdAt: evaluation.evaluatedAt,
    });
  }
}

export const evaluateProduct = (
  input: ProductIntelligenceInput,
): ProductIntelligenceEvaluation =>
  productIntelligenceEvaluationEngine.evaluateProduct(input);

export const productIntelligenceEvaluationEngine = new ProductIntelligenceEvaluationEngine();
