import type {
  ProductScoutEvaluation,
  ProductScoutGuardFlag,
  ProductScoutGuardVerdict,
  ProductScoutRecommendation,
} from "./types.js";

export const SCOUT_GUARD_THRESHOLDS = {
  refundRiskReject: 75,
  supplierReliabilityFlag: 50,
  marginFlag: 45,
  adDifficultyFlag: 70,
  approveScore: 72,
  reviewScore: 52,
} as const;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Guardian checks for Product Scout evaluations — audit flags and verdict metadata. */
export class ProductScoutGuard {
  assess(scores: {
    demandScore: number;
    competitionScore: number;
    marginScore: number;
    shippingScore: number;
    supplierReliabilityScore: number;
    adDifficultyScore: number;
    refundRiskScore: number;
    trendScore: number;
    brandabilityScore: number;
    finalEmpireScore: number;
  }): ProductScoutGuardVerdict {
    const flags: ProductScoutGuardFlag[] = [];
    const reasons: string[] = [];

    if (scores.refundRiskScore >= SCOUT_GUARD_THRESHOLDS.refundRiskReject) {
      flags.push("extreme_refund_risk");
      reasons.push(
        `Refund risk ${scores.refundRiskScore}/100 exceeds reject threshold (${SCOUT_GUARD_THRESHOLDS.refundRiskReject})`,
      );
    }

    if (scores.supplierReliabilityScore < SCOUT_GUARD_THRESHOLDS.supplierReliabilityFlag) {
      flags.push("poor_supplier_reliability");
      reasons.push(
        `Supplier reliability ${scores.supplierReliabilityScore}/100 below ${SCOUT_GUARD_THRESHOLDS.supplierReliabilityFlag}`,
      );
    }

    if (scores.marginScore < SCOUT_GUARD_THRESHOLDS.marginFlag) {
      flags.push("low_margin");
      reasons.push(
        `Margin score ${scores.marginScore}/100 below ${SCOUT_GUARD_THRESHOLDS.marginFlag}`,
      );
    }

    if (scores.adDifficultyScore >= SCOUT_GUARD_THRESHOLDS.adDifficultyFlag) {
      flags.push("high_ad_difficulty");
      reasons.push(
        `Ad difficulty ${scores.adDifficultyScore}/100 at or above ${SCOUT_GUARD_THRESHOLDS.adDifficultyFlag}`,
      );
    }

    const recommendation = this.resolveRecommendation(scores.finalEmpireScore, flags);
    const allowed = recommendation !== "REJECT";

    if (allowed && flags.length > 0) {
      reasons.push(`Guardian flagged ${flags.length} risk signal(s) — routed to ${recommendation}`);
    } else if (allowed) {
      reasons.push(`Guardian approved — Empire score ${scores.finalEmpireScore}/100`);
    }

    return {
      allowed,
      recommendation,
      flags,
      reasons,
      auditedAt: new Date().toISOString(),
    };
  }

  applyGuardianVerdict(
    evaluation: Omit<ProductScoutEvaluation, "guardianVerdict" | "recommendation" | "explanation">,
    guardianVerdict: ProductScoutGuardVerdict,
  ): Pick<ProductScoutEvaluation, "recommendation" | "explanation" | "guardianVerdict"> {
    const explanation =
      guardianVerdict.reasons.length > 0
        ? guardianVerdict.reasons.join("; ")
        : `${evaluation.productName} scored ${evaluation.finalEmpireScore}/100 on Empire index.`;

    return {
      recommendation: guardianVerdict.recommendation,
      explanation,
      guardianVerdict,
    };
  }

  private resolveRecommendation(
    finalEmpireScore: number,
    flags: ProductScoutGuardFlag[],
  ): ProductScoutRecommendation {
    if (flags.includes("extreme_refund_risk")) {
      return "REJECT";
    }

    if (finalEmpireScore < SCOUT_GUARD_THRESHOLDS.reviewScore) {
      return "REJECT";
    }

    if (
      flags.length > 0 ||
      finalEmpireScore < SCOUT_GUARD_THRESHOLDS.approveScore
    ) {
      return "REVIEW";
    }

    return "APPROVE";
  }
}

export const productScoutGuard = new ProductScoutGuard();

export function invertForEmpire(dimensionScore: number): number {
  return clampScore(100 - dimensionScore);
}
