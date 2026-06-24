import type { ProductOpportunity } from "../../../intelligence/product-opportunity/models/product-opportunity.js";
import type { ProductTrendForecast } from "../../product-trend-forecasting/models/product-trend-forecast.js";
import type { SourceTrustProfile } from "../../source-trust-intelligence/models/source-trust-profile.js";
import type { InvestigationTargetInput } from "../models/investigation-target.js";
import {
  resolvePriorityLevel,
  type InvestigationPriorityCreateInput,
  type PriorityLevel,
} from "../models/investigation-priority.js";
import type { PrioritySignal, PrioritySignalType } from "../models/priority-signal.js";

export const PRIORITY_SCORING_WEIGHTS: Record<PrioritySignalType, number> = {
  opportunity: 0.22,
  trend_forecast: 0.22,
  source_trust: 0.1,
  urgency: 0.2,
  uncertainty: 0.18,
  priority_composite: 1,
};

export type InvestigationOpportunityInput = Pick<
  ProductOpportunity,
  "productId" | "opportunityScore" | "opportunityTier" | "confidence" | "weaknesses" | "strengths"
> & {
  buyerPersonaId?: string;
};

export type InvestigationForecastInput = Pick<
  ProductTrendForecast,
  | "productId"
  | "forecastDirection"
  | "forecastConfidence"
  | "momentumProjection"
  | "riskProjection"
  | "opportunityProjection"
  | "recommendedAction"
>;

export type InvestigationTrustInput = Pick<
  SourceTrustProfile,
  "source" | "trustScore" | "trustTier" | "manipulationRisk" | "noiseLevel"
>;

export type InvestigationPriorityAnalysisInput = {
  target: InvestigationTargetInput;
  opportunity: InvestigationOpportunityInput;
  forecast: InvestigationForecastInput;
  trustProfiles: InvestigationTrustInput[];
};

export type InvestigationPriorityScoreBreakdown = Omit<
  InvestigationPriorityCreateInput,
  "targetId"
>;

const FORECAST_DIRECTION_SCORES: Record<ProductTrendForecast["forecastDirection"], number> = {
  STRONGLY_RISING: 95,
  RISING: 82,
  STABLE: 55,
  DECLINING: 32,
  STRONGLY_DECLINING: 15,
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildSignal(
  signalType: PrioritySignalType,
  score: number,
  detail: string,
): PrioritySignal {
  return {
    signalType,
    score: clampScore(score),
    weight: PRIORITY_SCORING_WEIGHTS[signalType],
    detail,
  };
}

function computeTrendForecastScore(forecast: InvestigationForecastInput): number {
  const directionBase = FORECAST_DIRECTION_SCORES[forecast.forecastDirection];
  return clampScore(
    directionBase * 0.45 +
      forecast.opportunityProjection * 0.25 +
      forecast.momentumProjection * 0.15 +
      forecast.forecastConfidence * 0.15,
  );
}

function computeTrustScore(trustProfiles: InvestigationTrustInput[]): number {
  if (trustProfiles.length === 0) return 50;
  return clampScore(average(trustProfiles.map((profile) => profile.trustScore)));
}

function computeUrgencyScore(
  opportunity: InvestigationOpportunityInput,
  forecast: InvestigationForecastInput,
): number {
  let score = opportunity.opportunityScore * 0.4;

  if (forecast.recommendedAction === "ACCUMULATE") {
    score += 18;
  } else if (forecast.recommendedAction === "WATCH") {
    score += 8;
  }

  if (
    forecast.forecastDirection === "STRONGLY_RISING" ||
    forecast.forecastDirection === "RISING"
  ) {
    score += 16;
  }

  if (forecast.riskProjection >= 65) {
    score += 10;
  }

  if (opportunity.opportunityTier === "high") {
    score += 12;
  } else if (opportunity.opportunityTier === "medium") {
    score += 5;
  }

  return clampScore(score);
}

function computeUncertaintyScore(
  opportunity: InvestigationOpportunityInput,
  forecast: InvestigationForecastInput,
  trustProfiles: InvestigationTrustInput[],
): number {
  let score =
    (100 - opportunity.confidence) * 0.35 + (100 - forecast.forecastConfidence) * 0.25;

  if (trustProfiles.length > 0) {
    score += average(trustProfiles.map((profile) => profile.manipulationRisk)) * 0.18;
    score += average(trustProfiles.map((profile) => profile.noiseLevel)) * 0.12;
    const trustValues = trustProfiles.map((profile) => profile.trustScore);
    score += (Math.max(...trustValues) - Math.min(...trustValues)) * 0.1;
  } else {
    score += 22;
  }

  if (opportunity.weaknesses.length >= 3) {
    score += 8;
  }

  if (forecast.riskProjection >= 60) {
    score += 6;
  }

  return clampScore(score);
}

function computeInvestigationPriorityScore(
  opportunityScore: number,
  trendForecastScore: number,
  trustScore: number,
  urgencyScore: number,
  uncertaintyScore: number,
  opportunity: InvestigationOpportunityInput,
  forecast: InvestigationForecastInput,
): number {
  const trustGapBoost =
    opportunityScore - trustScore > 30 ? Math.min(12, (opportunityScore - trustScore) * 0.15) : 0;

  let actionBonus = 0;
  if (forecast.recommendedAction === "ACCUMULATE" && opportunityScore >= 75) {
    actionBonus += 8;
  }
  if (forecast.forecastDirection === "STRONGLY_RISING") {
    actionBonus += 5;
  }
  if (forecast.recommendedAction === "AVOID") {
    actionBonus -= 10;
  }

  return clampScore(
    opportunityScore * PRIORITY_SCORING_WEIGHTS.opportunity +
      trendForecastScore * PRIORITY_SCORING_WEIGHTS.trend_forecast +
      urgencyScore * PRIORITY_SCORING_WEIGHTS.urgency +
      uncertaintyScore * PRIORITY_SCORING_WEIGHTS.uncertainty +
      trustScore * PRIORITY_SCORING_WEIGHTS.source_trust +
      trustGapBoost +
      actionBonus,
  );
}

function buildRationale(
  priorityLevel: PriorityLevel,
  opportunity: InvestigationOpportunityInput,
  forecast: InvestigationForecastInput,
  trustScore: number,
  uncertaintyScore: number,
): string {
  return [
    `${priorityLevel} investigation priority for ${opportunity.productId}.`,
    `Opportunity ${opportunity.opportunityScore} (${opportunity.opportunityTier}).`,
    `Forecast ${forecast.forecastDirection} with action ${forecast.recommendedAction}.`,
    `Average source trust ${trustScore}; uncertainty ${uncertaintyScore}.`,
  ].join(" ");
}

/** Scores investigation priority from opportunity, forecast, and trust inputs. */
export function scoreInvestigationPriority(
  input: InvestigationPriorityAnalysisInput,
): InvestigationPriorityScoreBreakdown {
  const { target, opportunity, forecast, trustProfiles } = input;

  if (opportunity.productId !== forecast.productId) {
    throw new Error("Opportunity and forecast productId must match");
  }
  if (target.productId !== opportunity.productId) {
    throw new Error("Target productId must match opportunity productId");
  }

  const opportunityScore = clampScore(opportunity.opportunityScore);
  const trendForecastScore = computeTrendForecastScore(forecast);
  const trustScore = computeTrustScore(trustProfiles);
  const urgencyScore = computeUrgencyScore(opportunity, forecast);
  const uncertaintyScore = computeUncertaintyScore(opportunity, forecast, trustProfiles);
  const investigationPriorityScore = computeInvestigationPriorityScore(
    opportunityScore,
    trendForecastScore,
    trustScore,
    urgencyScore,
    uncertaintyScore,
    opportunity,
    forecast,
  );
  const priorityLevel = resolvePriorityLevel(
    investigationPriorityScore,
    urgencyScore,
    uncertaintyScore,
  );

  const signals = [
    buildSignal("opportunity", opportunityScore, `Opportunity score ${opportunityScore}`),
    buildSignal(
      "trend_forecast",
      trendForecastScore,
      `Trend forecast score ${trendForecastScore}`,
    ),
    buildSignal("source_trust", trustScore, `Average source trust ${trustScore}`),
    buildSignal("urgency", urgencyScore, `Urgency score ${urgencyScore}`),
    buildSignal("uncertainty", uncertaintyScore, `Uncertainty score ${uncertaintyScore}`),
    buildSignal(
      "priority_composite",
      investigationPriorityScore,
      `Investigation priority ${investigationPriorityScore}`,
    ),
  ];

  return {
    productId: target.productId,
    opportunityScore,
    trendForecastScore,
    trustScore,
    urgencyScore,
    uncertaintyScore,
    investigationPriorityScore,
    priorityLevel,
    rationale: buildRationale(
      priorityLevel,
      opportunity,
      forecast,
      trustScore,
      uncertaintyScore,
    ),
    signals,
  };
}

export const priorityScoring = {
  scoreInvestigationPriority,
  resolvePriorityLevel,
  weights: PRIORITY_SCORING_WEIGHTS,
};

export type { PriorityLevel };
