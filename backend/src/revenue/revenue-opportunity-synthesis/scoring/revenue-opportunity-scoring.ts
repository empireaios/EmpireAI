import type { CommerceLaunchDecision } from "../../../intelligence/commerce-launch-decision/models/commerce-launch-decision.js";
import type { ProductOpportunity } from "../../../intelligence/product-opportunity/models/product-opportunity.js";
import type { ProductTrendForecast } from "../../../eye/product-trend-forecasting/models/product-trend-forecast.js";
import type { SourceTrustProfile } from "../../../eye/source-trust-intelligence/models/source-trust-profile.js";
import type { InvestigationLearningRecord } from "../../../eye/investigation-learning/models/investigation-learning-record.js";
import type {
  RevenueOpportunityCreateInput,
  RevenueOpportunityType,
} from "../models/revenue-opportunity.js";
import type { RevenueSignal, RevenueSignalType } from "../models/revenue-signal.js";

export const REVENUE_SIGNAL_WEIGHTS: Record<RevenueSignalType, number> = {
  product_opportunity: 0.22,
  launch_decision: 0.2,
  trend_forecast: 0.18,
  source_trust: 0.12,
  investigation_learning: 0.1,
  value_projection: 0.08,
  difficulty_projection: 0.05,
  confidence_composite: 0.05,
};

export type RevenueOpportunityInput = Pick<
  ProductOpportunity,
  | "productId"
  | "opportunityScore"
  | "opportunityTier"
  | "confidence"
  | "weaknesses"
  | "strengths"
  | "recommendedChannels"
>;

export type RevenueLaunchDecisionInput = Pick<
  CommerceLaunchDecision,
  | "productId"
  | "decision"
  | "launchScore"
  | "confidence"
  | "reasons"
  | "risks"
  | "recommendedChannels"
  | "expectedOutcome"
>;

export type RevenueForecastInput = Pick<
  ProductTrendForecast,
  | "productId"
  | "forecastDirection"
  | "forecastConfidence"
  | "momentumProjection"
  | "riskProjection"
  | "opportunityProjection"
  | "recommendedAction"
>;

export type RevenueTrustInput = Pick<
  SourceTrustProfile,
  "source" | "trustScore" | "trustTier" | "manipulationRisk" | "noiseLevel"
>;

export type RevenueLearningInput = Pick<
  InvestigationLearningRecord,
  | "productId"
  | "executionStatus"
  | "confidenceAdjustment"
  | "investigationRecommendations"
  | "repeatedFailures"
  | "repeatedSuccesses"
>;

export type RevenueOpportunitySynthesisInput = {
  productId: string;
  opportunity: RevenueOpportunityInput;
  launch: RevenueLaunchDecisionInput;
  forecast: RevenueForecastInput;
  trustProfiles: RevenueTrustInput[];
  learning?: RevenueLearningInput | null;
};

export type RevenueOpportunityScoreBreakdown = RevenueOpportunityCreateInput;

const FORECAST_DIRECTION_SCORES: Record<ProductTrendForecast["forecastDirection"], number> = {
  STRONGLY_RISING: 92,
  RISING: 78,
  STABLE: 52,
  DECLINING: 30,
  STRONGLY_DECLINING: 12,
};

const RECOMMENDED_ACTIONS: Record<RevenueOpportunityType, string> = {
  DROPSHIPPING:
    "Launch a low-budget dropshipping test on the highest-confidence marketplace channels",
  AFFILIATE: "Promote through affiliate placements and partner content partnerships",
  CONTENT: "Build a content funnel around rising trend and social proof signals",
  LEAD_GENERATION: "Capture qualified leads before committing to full inventory or launch spend",
  DIGITAL_PRODUCT: "Package validated demand into a digital product or info offer",
};

const CONTENT_CHANNEL_PATTERN = /content|youtube|tiktok|pinterest|blog|social|instagram/i;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildSignal(
  signalType: RevenueSignalType,
  score: number,
  detail: string,
): RevenueSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: REVENUE_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function computeTrustScore(trustProfiles: RevenueTrustInput[]): number {
  if (trustProfiles.length === 0) return 50;
  return clampScore(
    average(trustProfiles.map((profile) => profile.trustScore)) -
      average(trustProfiles.map((profile) => profile.manipulationRisk)) * 0.2 -
      average(trustProfiles.map((profile) => profile.noiseLevel)) * 0.1,
  );
}

function resolveOpportunityType(input: RevenueOpportunitySynthesisInput): RevenueOpportunityType {
  const { opportunity, launch, forecast, trustProfiles } = input;
  const avgTrust = computeTrustScore(trustProfiles);
  const hasContentChannel = launch.recommendedChannels.some((channel) =>
    CONTENT_CHANNEL_PATTERN.test(channel),
  );

  if (launch.decision === "LAUNCH" && opportunity.opportunityScore >= 70) {
    return "DROPSHIPPING";
  }

  if (
    (forecast.forecastDirection === "RISING" ||
      forecast.forecastDirection === "STRONGLY_RISING") &&
    opportunity.opportunityTier !== "low" &&
    hasContentChannel
  ) {
    return "CONTENT";
  }

  if (
    launch.decision === "WATCH" &&
    opportunity.opportunityScore >= 55 &&
    opportunity.opportunityScore < 75
  ) {
    return "AFFILIATE";
  }

  if (
    launch.decision === "WATCH" &&
    avgTrust >= 60 &&
    opportunity.opportunityTier === "medium"
  ) {
    return "LEAD_GENERATION";
  }

  if (
    launch.decision === "REJECT" ||
    opportunity.weaknesses.some((weakness) =>
      /supplier|fulfillment|inventory|shipping/i.test(weakness),
    )
  ) {
    if (launch.decision === "REJECT" || opportunity.opportunityScore >= 40) {
      return "DIGITAL_PRODUCT";
    }
  }

  if (opportunity.opportunityScore >= 75) return "DROPSHIPPING";
  if (opportunity.opportunityScore >= 55) return "AFFILIATE";
  if (opportunity.opportunityScore >= 40) return "CONTENT";
  return "LEAD_GENERATION";
}

function computeExpectedValue(input: RevenueOpportunitySynthesisInput): number {
  const { opportunity, launch, forecast, learning } = input;
  let value =
    opportunity.opportunityScore * 0.35 +
    forecast.opportunityProjection * 0.25 +
    launch.launchScore * 0.25;

  if (learning) {
    value += learning.confidenceAdjustment.adjustedConfidence * 0.15;
  } else {
    value += opportunity.confidence * 0.15;
  }

  if (launch.decision === "LAUNCH") {
    value += 12;
  } else if (launch.decision === "REJECT") {
    value -= 25;
  }

  if (learning?.executionStatus === "COMPLETED") {
    value += 6;
  } else if (learning?.executionStatus === "FAILED") {
    value -= 8;
  }

  return clampScore(value);
}

function computeExpectedDifficulty(input: RevenueOpportunitySynthesisInput): number {
  const { opportunity, launch, forecast, trustProfiles, learning } = input;
  const avgTrust = computeTrustScore(trustProfiles);

  let difficulty =
    forecast.riskProjection * 0.28 +
    (100 - avgTrust) * 0.22 +
    opportunity.weaknesses.length * 6 +
    launch.risks.length * 8;

  if (launch.decision === "REJECT") {
    difficulty += 20;
  }
  if (learning) {
    difficulty += learning.repeatedFailures.length * 10;
    difficulty -= learning.repeatedSuccesses.length * 4;
  }
  if (forecast.recommendedAction === "AVOID") {
    difficulty += 15;
  }

  return clampScore(difficulty);
}

function computeConfidence(input: RevenueOpportunitySynthesisInput): number {
  const { opportunity, launch, forecast, trustProfiles, learning } = input;
  const trustScore = computeTrustScore(trustProfiles);

  let confidence =
    opportunity.confidence * 0.28 +
    launch.confidence * 0.22 +
    forecast.forecastConfidence * 0.2 +
    trustScore * 0.15;

  if (learning) {
    confidence += learning.confidenceAdjustment.adjustedConfidence * 0.15;
  } else {
    confidence += opportunity.confidence * 0.15;
  }

  if (launch.decision === "REJECT") {
    confidence -= 12;
  }
  if (learning?.repeatedFailures.length) {
    confidence -= learning.repeatedFailures.length * 5;
  }

  return clampScore(confidence);
}

function buildReasons(input: RevenueOpportunitySynthesisInput): string[] {
  const { opportunity, launch, forecast, learning } = input;
  const reasons = [
    ...opportunity.strengths.slice(0, 2),
    ...launch.reasons.slice(0, 2),
    `Trend forecast ${forecast.forecastDirection} with ${forecast.forecastConfidence}% confidence`,
    launch.expectedOutcome,
  ];

  if (learning?.repeatedSuccesses.length) {
    reasons.push(
      `Investigation learning confirmed ${learning.repeatedSuccesses.length} repeated success pattern(s)`,
    );
  }

  return [...new Set(reasons.filter(Boolean))].slice(0, 6);
}

function buildRisks(input: RevenueOpportunitySynthesisInput): string[] {
  const { opportunity, launch, forecast, trustProfiles, learning } = input;
  const risks = [
    ...opportunity.weaknesses.slice(0, 2),
    ...launch.risks.slice(0, 2),
  ];

  if (forecast.recommendedAction === "AVOID") {
    risks.push("Trend forecast recommends avoiding aggressive accumulation");
  }
  if (forecast.riskProjection >= 65) {
    risks.push(`Elevated trend risk projection at ${forecast.riskProjection}`);
  }

  for (const profile of trustProfiles.filter((entry) => entry.trustTier === "LOW_TRUST")) {
    risks.push(`Low trust source ${profile.source} may distort signals`);
  }

  if (learning?.repeatedFailures.length) {
    for (const pattern of learning.repeatedFailures.slice(0, 2)) {
      risks.push(pattern.description);
    }
  }

  return [...new Set(risks.filter(Boolean))].slice(0, 8);
}

/** Synthesizes Eye intelligence into a concrete revenue opportunity. */
export function scoreRevenueOpportunity(
  input: RevenueOpportunitySynthesisInput,
): RevenueOpportunityScoreBreakdown {
  const opportunityType = resolveOpportunityType(input);
  const expectedValue = computeExpectedValue(input);
  const expectedDifficulty = computeExpectedDifficulty(input);
  const confidence = computeConfidence(input);
  const reasons = buildReasons(input);
  const risks = buildRisks(input);
  const trustScore = computeTrustScore(input.trustProfiles);
  const forecastDirectionScore = FORECAST_DIRECTION_SCORES[input.forecast.forecastDirection];

  const signals: RevenueSignal[] = [
    buildSignal(
      "product_opportunity",
      input.opportunity.opportunityScore,
      `Opportunity tier ${input.opportunity.opportunityTier}`,
    ),
    buildSignal(
      "launch_decision",
      input.launch.launchScore,
      `Launch decision ${input.launch.decision}`,
    ),
    buildSignal(
      "trend_forecast",
      forecastDirectionScore,
      `Forecast ${input.forecast.forecastDirection}`,
    ),
    buildSignal("source_trust", trustScore, `Trust composite ${trustScore}`),
  ];

  if (input.learning) {
    signals.push(
      buildSignal(
        "investigation_learning",
        input.learning.confidenceAdjustment.adjustedConfidence,
        input.learning.confidenceAdjustment.reason,
      ),
    );
  }

  signals.push(
    buildSignal("value_projection", expectedValue, `Expected value ${expectedValue}`),
    buildSignal(
      "difficulty_projection",
      expectedDifficulty,
      `Expected difficulty ${expectedDifficulty}`,
    ),
    buildSignal("confidence_composite", confidence, `Composite confidence ${confidence}`),
  );

  return {
    productId: input.productId,
    opportunityType,
    confidence,
    expectedValue,
    expectedDifficulty,
    recommendedAction: RECOMMENDED_ACTIONS[opportunityType],
    reasons,
    risks,
    signals,
  };
}

export const revenueOpportunityScoring = {
  scoreRevenueOpportunity,
  weights: REVENUE_SIGNAL_WEIGHTS,
  recommendedActions: RECOMMENDED_ACTIONS,
};

export type { RevenueOpportunityType };
