import type { BuyerPersonaProfile } from "../../buyer-intelligence/persona-intelligence/contracts/buyer-persona-profile.js";
import { scoreBuyerProductMatch } from "../../buyer-product-matching/scoring/matching-scoring.js";
import type { ProductEntity } from "../../product-knowledge-graph/models/product-entity.js";
import { scoreBuyerReachability } from "../../buyer-reachability/scoring/reachability-scoring.js";
import { resolveOpportunityTier, type OpportunityTier } from "../models/product-opportunity.js";
import type { OpportunitySignal, OpportunitySignalType } from "../models/opportunity-signal.js";

export const OPPORTUNITY_SIGNAL_WEIGHTS: Record<OpportunitySignalType, number> = {
  buyer_demand: 0.15,
  buyer_product_match: 0.25,
  reachability: 0.15,
  competition: 0.15,
  content_difficulty: 0.1,
  supplier_availability: 0.1,
  confidence: 0.1,
};

export type OpportunityScoreBreakdown = {
  opportunityScore: number;
  opportunityTier: OpportunityTier;
  confidence: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  recommendedChannels: string[];
  signals: OpportunitySignal[];
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: OpportunitySignalType,
  score: number,
  detail: string,
): OpportunitySignal {
  return {
    signalType,
    score: clampScore(score),
    weight: OPPORTUNITY_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function scoreBuyerDemand(persona: BuyerPersonaProfile): OpportunitySignal {
  const urgencyMap = { low: 35, medium: 55, high: 78, critical: 92 };
  const urgencyScore = urgencyMap[persona.urgencyLevel];
  const triggerBoost = Math.min(15, persona.purchaseTriggers.length * 4);
  const score = clampScore(urgencyScore * 0.65 + persona.confidence * 0.25 + triggerBoost);
  return buildSignal(
    "buyer_demand",
    score,
    `Demand from ${persona.urgencyLevel} urgency and ${persona.purchaseTriggers.length} purchase triggers`,
  );
}

function scoreSupplierAvailability(product: ProductEntity): OpportunitySignal {
  const refCount = product.supplierRefs.length;
  const hasPrimary = product.supplierRefs.some((ref) => ref.isPrimary);
  const score = clampScore(25 + refCount * 25 + (hasPrimary ? 15 : 0));
  return buildSignal(
    "supplier_availability",
    score,
    refCount > 0
      ? `${refCount} supplier reference(s)${hasPrimary ? " with primary supplier" : ""}`
      : "No supplier references available",
  );
}

function buildStrengthsAndWeaknesses(signals: OpportunitySignal[]): {
  strengths: string[];
  weaknesses: string[];
} {
  const sorted = [...signals].sort((left, right) => right.score - left.score);
  const strengths = sorted
    .filter((signal) => signal.score >= 60)
    .slice(0, 3)
    .map((signal) => `${signal.signalType.replace(/_/g, " ")}: ${signal.detail}`);
  const weaknesses = sorted
    .filter((signal) => signal.score < 50)
    .slice(-2)
    .map((signal) => `${signal.signalType.replace(/_/g, " ")}: ${signal.detail}`);

  return {
    strengths: strengths.length > 0 ? strengths : ["Balanced opportunity profile across factors"],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["No major weaknesses detected"],
  };
}

function buildReasoning(
  product: ProductEntity,
  persona: BuyerPersonaProfile,
  opportunityScore: number,
  opportunityTier: OpportunityTier,
): string {
  return `${product.displayName} is a ${opportunityTier} opportunity (score ${opportunityScore}) for persona ${persona.name} based on buyer demand, product fit, reachability, and supply readiness.`;
}

/** Combines M023-M026 intelligence into a product opportunity score. */
export function scoreProductOpportunity(
  persona: BuyerPersonaProfile,
  product: ProductEntity,
): OpportunityScoreBreakdown {
  const matchBreakdown = scoreBuyerProductMatch(persona, product);
  const reachBreakdown = scoreBuyerReachability(persona);

  const reachabilityScore = clampScore(
    (reachBreakdown.dimensions.organicReach +
      reachBreakdown.dimensions.paidReach +
      reachBreakdown.dimensions.searchReach) /
      3,
  );
  const competitionScore = clampScore(100 - reachBreakdown.dimensions.competitionLevel);
  const competitionBoost = persona.purchaseTriggers.some((trigger) =>
    trigger.toLowerCase().includes("limited competition"),
  )
    ? 20
    : 0;
  const adjustedCompetitionScore = clampScore(competitionScore + competitionBoost);
  const contentDifficultyScore = clampScore(100 - reachBreakdown.dimensions.contentDifficulty);

  const confidenceScore = clampScore(
    matchBreakdown.confidence * 0.35 +
      reachBreakdown.confidence * 0.25 +
      product.confidence * 0.2 +
      persona.confidence * 0.2,
  );

  const signals = [
    scoreBuyerDemand(persona),
    buildSignal(
      "buyer_product_match",
      matchBreakdown.score,
      `Buyer-product match score ${matchBreakdown.score} (${matchBreakdown.matchTier})`,
    ),
    buildSignal(
      "reachability",
      reachabilityScore,
      `Reachability across organic, paid, and search channels (${reachabilityScore})`,
    ),
    buildSignal(
      "competition",
      adjustedCompetitionScore,
      `Competition inverse score ${adjustedCompetitionScore} (level ${reachBreakdown.dimensions.competitionLevel})`,
    ),
    buildSignal(
      "content_difficulty",
      contentDifficultyScore,
      `Content ease score ${contentDifficultyScore} (difficulty ${reachBreakdown.dimensions.contentDifficulty})`,
    ),
    scoreSupplierAvailability(product),
    buildSignal("confidence", confidenceScore, `Blended confidence score ${confidenceScore}`),
  ];

  const weightedScore = signals.reduce((total, signal) => total + signal.score * signal.weight, 0);
  const targeted = product.targetBuyerPersonaIds.includes(persona.personaId);
  const alignmentBoost =
    targeted && matchBreakdown.score >= 70 ? 10 : matchBreakdown.score >= 75 ? 5 : 0;
  const opportunityScore = clampScore(weightedScore + alignmentBoost);
  const opportunityTier = resolveOpportunityTier(opportunityScore);
  const { strengths, weaknesses } = buildStrengthsAndWeaknesses(signals);

  return {
    opportunityScore,
    opportunityTier,
    confidence: confidenceScore,
    reasoning: buildReasoning(product, persona, opportunityScore, opportunityTier),
    strengths,
    weaknesses,
    recommendedChannels: [...reachBreakdown.topChannels],
    signals,
  };
}

export const opportunityScoring = {
  scoreProductOpportunity,
  weights: OPPORTUNITY_SIGNAL_WEIGHTS,
};
