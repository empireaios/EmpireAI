import type { BuyerProductMatch } from "../../buyer-product-matching/models/buyer-product-match.js";
import type { ReachabilityProfile } from "../../buyer-reachability/models/reachability-profile.js";
import type { ProductOpportunity } from "../../product-opportunity/models/product-opportunity.js";
import type { SupplierOpportunityMatch } from "../../supplier-opportunity-matching/models/supplier-opportunity-match.js";
import {
  resolveLaunchDecision,
  type LaunchDecision,
} from "../models/commerce-launch-decision.js";
import type { LaunchDecisionSignal, LaunchDecisionSignalType } from "../models/launch-decision-signal.js";

export const LAUNCH_DECISION_SIGNAL_WEIGHTS: Record<LaunchDecisionSignalType, number> = {
  opportunity_score: 0.25,
  supplier_match_score: 0.2,
  buyer_match_score: 0.2,
  reachability_score: 0.15,
  risk_score: 0.1,
  confidence: 0.1,
};

export type CommerceLaunchDecisionInput = {
  opportunity: ProductOpportunity;
  supplierMatch: SupplierOpportunityMatch;
  buyerMatch: BuyerProductMatch;
  reachability: ReachabilityProfile;
};

export type LaunchDecisionScoreBreakdown = {
  launchScore: number;
  decision: LaunchDecision;
  confidence: number;
  reasons: string[];
  risks: string[];
  recommendedChannels: string[];
  suggestedTestBudget: number;
  expectedOutcome: string;
  signals: LaunchDecisionSignal[];
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: LaunchDecisionSignalType,
  score: number,
  detail: string,
): LaunchDecisionSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: LAUNCH_DECISION_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function computeReachabilityScore(reachability: ReachabilityProfile): number {
  const dimensions = reachability.dimensions;
  return clampScore(
    (dimensions.organicReach + dimensions.paidReach + dimensions.searchReach) / 3,
  );
}

function computeRiskScore(
  opportunity: ProductOpportunity,
  supplierMatch: SupplierOpportunityMatch,
  reachability: ReachabilityProfile,
): number {
  const competitionPenalty = reachability.dimensions.competitionLevel * 0.35;
  const contentPenalty = reachability.dimensions.contentDifficulty * 0.25;
  const supplierPenalty = supplierMatch.weaknesses.length * 8;
  const opportunityPenalty = opportunity.weaknesses.length * 6;
  const rawRisk = competitionPenalty + contentPenalty + supplierPenalty + opportunityPenalty;
  return clampScore(100 - rawRisk);
}

function mergeChannels(opportunity: ProductOpportunity, reachability: ReachabilityProfile): string[] {
  return [...new Set([...opportunity.recommendedChannels, ...reachability.topChannels])].slice(0, 5);
}

function buildReasons(signals: LaunchDecisionSignal[]): string[] {
  return signals
    .filter((signal) => signal.score >= 60)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((signal) => `${signal.signalType.replace(/_/g, " ")}: ${signal.detail}`);
}

function buildRisks(
  opportunity: ProductOpportunity,
  supplierMatch: SupplierOpportunityMatch,
  reachability: ReachabilityProfile,
  riskScore: number,
): string[] {
  const risks = [
    ...opportunity.weaknesses.slice(0, 2),
    ...supplierMatch.weaknesses.slice(0, 2),
  ];

  if (reachability.dimensions.competitionLevel >= 65) {
    risks.push(`High channel competition (${reachability.dimensions.competitionLevel})`);
  }
  if (reachability.dimensions.contentDifficulty >= 65) {
    risks.push(`High content difficulty (${reachability.dimensions.contentDifficulty})`);
  }
  if (riskScore < 45) {
    risks.push("Aggregate launch risk exceeds acceptable threshold");
  }

  return risks.length > 0 ? [...new Set(risks)].slice(0, 5) : ["No major launch risks identified"];
}

function computeSuggestedTestBudget(
  decision: LaunchDecision,
  reachability: ReachabilityProfile,
  opportunity: ProductOpportunity,
): number {
  const base = reachability.dimensions.expectedCost;
  if (decision === "REJECT") return 0;
  if (decision === "WATCH") return Math.round(base * 0.6);
  return Math.round(base * (1 + opportunity.opportunityScore / 200));
}

function buildExpectedOutcome(decision: LaunchDecision, launchScore: number): string {
  if (decision === "LAUNCH") {
    return `Strong launch candidate with ${launchScore} launch score; proceed with channel tests and initial inventory order.`;
  }
  if (decision === "WATCH") {
    return `Promising but not ready; monitor demand signals and rerun decision after more validation.`;
  }
  return `Not recommended for launch now; reject or deprioritize until scores improve.`;
}

/** Scores whether Grand King's Account should launch a product opportunity now. */
export function scoreCommerceLaunchDecision(
  input: CommerceLaunchDecisionInput,
): LaunchDecisionScoreBreakdown {
  const { opportunity, supplierMatch, buyerMatch, reachability } = input;

  const reachabilityScore = computeReachabilityScore(reachability);
  const riskScore = computeRiskScore(opportunity, supplierMatch, reachability);
  const confidenceScore = clampScore(
    opportunity.confidence * 0.25 +
      supplierMatch.confidence * 0.25 +
      buyerMatch.confidence * 0.25 +
      reachability.confidence * 0.25,
  );

  const signals = [
    buildSignal(
      "opportunity_score",
      opportunity.opportunityScore,
      `Product opportunity score ${opportunity.opportunityScore} (${opportunity.opportunityTier})`,
    ),
    buildSignal(
      "supplier_match_score",
      supplierMatch.matchScore,
      `Supplier match score ${supplierMatch.matchScore} (${supplierMatch.matchTier})`,
    ),
    buildSignal(
      "buyer_match_score",
      buyerMatch.score,
      `Buyer match score ${buyerMatch.score} (${buyerMatch.matchTier})`,
    ),
    buildSignal(
      "reachability_score",
      reachabilityScore,
      `Reachability score ${reachabilityScore} across key channels`,
    ),
    buildSignal("risk_score", riskScore, `Inverse risk score ${riskScore}`),
    buildSignal("confidence", confidenceScore, `Blended confidence ${confidenceScore}`),
  ];

  const launchScore = clampScore(
    signals.reduce((total, signal) => total + signal.score * signal.weight, 0),
  );
  const decision = resolveLaunchDecision(launchScore, riskScore);
  const reasons = buildReasons(signals);
  const risks = buildRisks(opportunity, supplierMatch, reachability, riskScore);
  const recommendedChannels = mergeChannels(opportunity, reachability);
  const suggestedTestBudget = computeSuggestedTestBudget(decision, reachability, opportunity);

  return {
    launchScore,
    decision,
    confidence: confidenceScore,
    reasons: reasons.length > 0 ? reasons : ["Insufficient positive signals for launch"],
    risks,
    recommendedChannels,
    suggestedTestBudget,
    expectedOutcome: buildExpectedOutcome(decision, launchScore),
    signals,
  };
}

export const launchDecisionScoring = {
  scoreCommerceLaunchDecision,
  weights: LAUNCH_DECISION_SIGNAL_WEIGHTS,
};
