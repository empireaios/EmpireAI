import { randomUUID } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import { productIntelligenceEngine } from "../pie-engine.js";
import type { PieScoreDimension } from "../types.js";
import { buildScoutInput, SCOUT_MOCK_PRODUCTS } from "./mock-products.js";
import { invertForEmpire, productScoutGuard } from "./product-scout-guard.js";
import {
  SCOUT_EMPIRE_WEIGHTS,
  type ProductScoutEvaluation,
  type ProductScoutPortfolioScan,
  type ProductScoutScoreInput,
} from "./types.js";

function signalScore(
  signals: ProductScoutScoreInput["signals"],
  dimension: PieScoreDimension | "trend" | "brandability",
  fallback = 50,
): number {
  return signals?.[dimension]?.score ?? fallback;
}

function buildWhy(
  evaluation: Omit<ProductScoutEvaluation, "why" | "explanation" | "guardianVerdict" | "recommendation">,
  signals: ProductScoutScoreInput["signals"],
): string[] {
  const entries: Array<{ label: string; score: number; evidence: string[] }> = [
    { label: "Demand", score: evaluation.demandScore, evidence: signals?.demand?.evidence ?? [] },
    { label: "Margin", score: evaluation.marginScore, evidence: signals?.margin?.evidence ?? [] },
    { label: "Trend", score: evaluation.trendScore, evidence: signals?.trend?.evidence ?? [] },
    { label: "Brandability", score: evaluation.brandabilityScore, evidence: signals?.brandability?.evidence ?? [] },
    { label: "Refund risk", score: evaluation.refundRiskScore, evidence: signals?.refundRisk?.evidence ?? [] },
  ];

  return entries
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => {
      const hint = entry.evidence[0] ? ` — ${entry.evidence[0]}` : "";
      return `${entry.label} (${entry.score}/100)${hint}`;
    });
}

/** AI Product Scout — extends PIE with Empire scoring, Guardian verdicts, and portfolio scans. */
export class ProductScoutEngine {
  evaluate(input: ProductScoutScoreInput): ProductScoutEvaluation {
    const signals = input.signals ?? {};
    const pieDimensions: Partial<
      Record<PieScoreDimension, { score: number; evidence?: string[] }>
    > = {};

    for (const dimension of Object.keys(SCOUT_EMPIRE_WEIGHTS) as Array<
      keyof typeof SCOUT_EMPIRE_WEIGHTS
    >) {
      if (dimension === "trend" || dimension === "brandability") continue;
      const signal = signals[dimension];
      if (signal) {
        pieDimensions[dimension] = signal;
      }
    }

    const pieScore = productIntelligenceEngine.score({
      workspaceId: input.workspaceId,
      productId: input.productId,
      productName: input.productName,
      signals: pieDimensions,
    });

    const demandScore = signalScore(signals, "demand");
    const competitionScore = invertForEmpire(signalScore(signals, "competition"));
    const marginScore = signalScore(signals, "margin");
    const shippingScore = signalScore(signals, "shipping");
    const supplierReliabilityScore = signalScore(signals, "supplierReliability");
    const adDifficultyScore = signalScore(signals, "adDifficulty");
    const refundRiskScore = signalScore(signals, "refundRisk");
    const trendScore = signalScore(signals, "trend", demandScore);
    const brandabilityScore = signalScore(signals, "brandability", 55);

    const finalEmpireScore = Math.round(
      demandScore * SCOUT_EMPIRE_WEIGHTS.demand +
        competitionScore * SCOUT_EMPIRE_WEIGHTS.competition +
        marginScore * SCOUT_EMPIRE_WEIGHTS.margin +
        shippingScore * SCOUT_EMPIRE_WEIGHTS.shipping +
        supplierReliabilityScore * SCOUT_EMPIRE_WEIGHTS.supplierReliability +
        invertForEmpire(adDifficultyScore) * SCOUT_EMPIRE_WEIGHTS.adDifficulty +
        invertForEmpire(refundRiskScore) * SCOUT_EMPIRE_WEIGHTS.refundRisk +
        trendScore * SCOUT_EMPIRE_WEIGHTS.trend +
        brandabilityScore * SCOUT_EMPIRE_WEIGHTS.brandability,
    );

    const confidenceScore = Math.max(
      pieScore.confidence,
      Math.round(
        (Object.values(signals).filter((s) => (s?.evidence?.length ?? 0) > 0).length /
          Math.max(Object.keys(signals).length, 1)) *
          100,
      ) || 35,
    );

    const baseEvaluation = {
      productId: input.productId,
      productName: input.productName,
      workspaceId: input.workspaceId,
      demandScore,
      competitionScore,
      marginScore,
      shippingScore,
      supplierReliabilityScore,
      adDifficultyScore,
      refundRiskScore,
      trendScore,
      brandabilityScore,
      confidenceScore,
      finalEmpireScore,
      evaluatedAt: new Date().toISOString(),
    };

    const why = buildWhy(baseEvaluation, signals);
    const evaluationForGuard = { ...baseEvaluation, why };

    const guardianVerdict = productScoutGuard.assess(baseEvaluation);
    const guarded = productScoutGuard.applyGuardianVerdict(evaluationForGuard, guardianVerdict);

    return {
      ...evaluationForGuard,
      ...guarded,
    };
  }

  evaluateMock(workspaceId: string, productIdOrIndex?: string | number): ProductScoutEvaluation {
    return this.evaluate(buildScoutInput(workspaceId, productIdOrIndex));
  }

  scanPortfolio(workspaceId: string, limit = SCOUT_MOCK_PRODUCTS.length): ProductScoutPortfolioScan {
    const evaluations = SCOUT_MOCK_PRODUCTS.slice(0, limit).map((product) =>
      this.evaluate({
        workspaceId,
        productId: product.productId,
        productName: product.productName,
        signals: product.signals,
      }),
    );

    const sortedEvaluations = [...evaluations].sort(
      (a, b) => b.finalEmpireScore - a.finalEmpireScore,
    );
    const approved = evaluations.filter((e) => e.recommendation === "APPROVE");
    const review = evaluations.filter((e) => e.recommendation === "REVIEW");
    const ranked = [...approved, ...review].sort(
      (a, b) => b.finalEmpireScore - a.finalEmpireScore,
    );
    const topPick = ranked[0] ?? sortedEvaluations[0];

    return {
      workspaceId,
      scannedCount: evaluations.length,
      topPick,
      evaluations: sortedEvaluations,
      scannedAt: new Date().toISOString(),
    };
  }

  recommend(workspaceId: string): ProductScoutEvaluation | undefined {
    return this.scanPortfolio(workspaceId).topPick;
  }

  persist(evaluation: ProductScoutEvaluation): void {
    const db = getDatabase();
    if (evaluation.productId) {
      const existing = db
        .prepare(
          `SELECT id FROM product_scout_evaluations
           WHERE workspace_id = @workspaceId AND product_id = @productId`,
        )
        .get({ workspaceId: evaluation.workspaceId, productId: evaluation.productId }) as
        | { id: string }
        | undefined;

      if (existing) {
        db.prepare(
          `UPDATE product_scout_evaluations SET
            product_name = @productName,
            scores = @scores,
            final_empire_score = @finalEmpireScore,
            recommendation = @recommendation,
            explanation = @explanation,
            guardian_verdict = @guardianVerdict,
            created_at = @createdAt
           WHERE id = @id`,
        ).run({
          id: existing.id,
          productName: evaluation.productName,
          scores: JSON.stringify({
            demandScore: evaluation.demandScore,
            competitionScore: evaluation.competitionScore,
            marginScore: evaluation.marginScore,
            shippingScore: evaluation.shippingScore,
            supplierReliabilityScore: evaluation.supplierReliabilityScore,
            adDifficultyScore: evaluation.adDifficultyScore,
            refundRiskScore: evaluation.refundRiskScore,
            trendScore: evaluation.trendScore,
            brandabilityScore: evaluation.brandabilityScore,
            confidenceScore: evaluation.confidenceScore,
            why: evaluation.why,
          }),
          finalEmpireScore: evaluation.finalEmpireScore,
          recommendation: evaluation.recommendation,
          explanation: evaluation.explanation,
          guardianVerdict: JSON.stringify(evaluation.guardianVerdict),
          createdAt: evaluation.evaluatedAt,
        });
        return;
      }
    }

    db.prepare(
      `INSERT INTO product_scout_evaluations
        (id, workspace_id, product_id, product_name, scores, final_empire_score,
         recommendation, explanation, guardian_verdict, created_at)
       VALUES (@id, @workspaceId, @productId, @productName, @scores, @finalEmpireScore,
         @recommendation, @explanation, @guardianVerdict, @createdAt)`,
    ).run({
      id: randomUUID(),
      workspaceId: evaluation.workspaceId,
      productId: evaluation.productId ?? null,
      productName: evaluation.productName,
      scores: JSON.stringify({
        demandScore: evaluation.demandScore,
        competitionScore: evaluation.competitionScore,
        marginScore: evaluation.marginScore,
        shippingScore: evaluation.shippingScore,
        supplierReliabilityScore: evaluation.supplierReliabilityScore,
        adDifficultyScore: evaluation.adDifficultyScore,
        refundRiskScore: evaluation.refundRiskScore,
        trendScore: evaluation.trendScore,
        brandabilityScore: evaluation.brandabilityScore,
        confidenceScore: evaluation.confidenceScore,
        why: evaluation.why,
      }),
      finalEmpireScore: evaluation.finalEmpireScore,
      recommendation: evaluation.recommendation,
      explanation: evaluation.explanation,
      guardianVerdict: JSON.stringify(evaluation.guardianVerdict),
      createdAt: evaluation.evaluatedAt,
    });
  }
}

export const productScoutEngine = new ProductScoutEngine();
