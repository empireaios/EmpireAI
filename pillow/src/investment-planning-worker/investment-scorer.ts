import type { ScoringWeights } from "./configuration.js";
import type {
  InvestmentOpportunityInput,
  PaybackSource,
  RecommendationKind,
} from "./types.js";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Deterministic opportunity score (0–10000 basis points).
 *
 * Formula:
 * - roiComponent = clamp(expectedRoiBps, 0, 10000)
 * - alignmentComponent = clamp(strategicAlignmentBps, 0, 10000)
 * - paybackComponent = expectedPaybackPeriods <= 0
 *     ? 0
 *     : clamp(round(10000 * (12 / expectedPaybackPeriods)), 0, 10000)  // shorter payback → higher
 * - riskAdjustedComponent = clamp(10000 - riskScoreBps, 0, 10000)
 * - weighted = (roi*wRoi + align*wAlign + payback*wPay + riskAdj*wRisk) / 100
 * - capitalFitPenalty: if capitalRequired > availableCapital,
 *     subtract min(3000, excessRatio * 3000)
 */
export function scoreOpportunity(
  opp: Pick<
    InvestmentOpportunityInput,
    "expectedRoiBps" | "strategicAlignmentBps" | "expectedPaybackPeriods" | "riskScoreBps" | "capitalRequiredMinor"
  >,
  weights: ScoringWeights,
  availableCapitalMinor: number | null,
): number {
  const roiComponent = clamp(opp.expectedRoiBps ?? 0, 0, 10000);
  const alignmentComponent = clamp(opp.strategicAlignmentBps ?? 0, 0, 10000);
  const paybackPeriods = opp.expectedPaybackPeriods ?? 0;
  const paybackComponent =
    paybackPeriods <= 0 ? 0 : clamp(Math.round(10000 * (12 / paybackPeriods)), 0, 10000);
  const riskAdjustedComponent = clamp(10000 - (opp.riskScoreBps ?? 0), 0, 10000);

  let weighted =
    (roiComponent * weights.roiBps +
      alignmentComponent * weights.strategicAlignmentBps +
      paybackComponent * weights.paybackBps +
      riskAdjustedComponent * weights.riskAdjustedBps) /
    100;

  if (
    availableCapitalMinor !== null &&
    availableCapitalMinor >= 0 &&
    opp.capitalRequiredMinor > availableCapitalMinor
  ) {
    const excessRatio =
      (opp.capitalRequiredMinor - availableCapitalMinor) / Math.max(opp.capitalRequiredMinor, 1);
    weighted -= Math.min(3000, excessRatio * 3000);
  }

  return clamp(Math.round(weighted), 0, 10000);
}

export function rankOpportunities<T extends { opportunityScore: number; opportunityId: string }>(
  opportunities: readonly T[],
): T[] {
  return [...opportunities].sort((a, b) => {
    if (b.opportunityScore !== a.opportunityScore) return b.opportunityScore - a.opportunityScore;
    return a.opportunityId.localeCompare(b.opportunityId);
  });
}

export function recommendFromScore(
  score: number,
  capitalFit: boolean,
  recommendThresholdBps: number,
  deferThresholdBps: number,
): RecommendationKind {
  if (score >= recommendThresholdBps) {
    return capitalFit ? "recommend" : "monitor";
  }
  if (score >= deferThresholdBps) return "defer";
  if (score >= 2000) return "monitor";
  return "reject";
}

/**
 * Derive payback periods from caller-supplied ROI ONLY when payback was not supplied.
 * Result is labelled projected_derived — never measured.
 */
export function estimatePaybackPeriods(
  expectedRoiBps: number | null | undefined,
  callerSuppliedPayback: number | null | undefined,
): { paybackPeriods: number | null; paybackSource: PaybackSource } {
  if (callerSuppliedPayback != null && callerSuppliedPayback > 0) {
    return { paybackPeriods: callerSuppliedPayback, paybackSource: "caller_supplied" };
  }
  if (expectedRoiBps != null && expectedRoiBps > 0) {
    return {
      paybackPeriods: Math.round(10000 / expectedRoiBps),
      paybackSource: "projected_derived",
    };
  }
  return { paybackPeriods: null, paybackSource: "not_available" };
}

export function computeCapitalFit(
  capitalRequiredMinor: number,
  availableCapitalMinor: number | null,
): boolean {
  if (availableCapitalMinor === null) return true;
  return capitalRequiredMinor <= availableCapitalMinor;
}

export function computeConfidenceScore(params: {
  opportunityCount: number;
  evidenceRefCount: number;
  measuredCapitalAvailable: boolean;
  recommendationCount: number;
}): number {
  if (params.opportunityCount === 0) return 15;
  let score = 40;
  score += Math.min(25, params.opportunityCount * 5);
  score += Math.min(20, params.evidenceRefCount * 2);
  if (params.measuredCapitalAvailable) score += 10;
  score += Math.min(10, params.recommendationCount * 2);
  return clamp(score, 0, 100);
}

export function buildRiskAssessmentSummary(
  opportunities: readonly { opportunityId: string; riskScoreBps: number | null }[],
): {
  assessedOpportunityCount: number;
  elevatedRiskCount: number;
  averageRiskScoreBps: number;
  highestRiskOpportunityId: string | null;
} {
  if (opportunities.length === 0) {
    return {
      assessedOpportunityCount: 0,
      elevatedRiskCount: 0,
      averageRiskScoreBps: 0,
      highestRiskOpportunityId: null,
    };
  }
  const risks = opportunities.map((o) => o.riskScoreBps ?? 0);
  const elevatedRiskCount = risks.filter((r) => r >= 7000).length;
  const averageRiskScoreBps = Math.round(risks.reduce((a, b) => a + b, 0) / risks.length);
  let highestRisk = opportunities[0]!;
  for (const opp of opportunities) {
    if ((opp.riskScoreBps ?? 0) > (highestRisk.riskScoreBps ?? 0)) highestRisk = opp;
  }
  return {
    assessedOpportunityCount: opportunities.length,
    elevatedRiskCount,
    averageRiskScoreBps,
    highestRiskOpportunityId: highestRisk.opportunityId,
  };
}
