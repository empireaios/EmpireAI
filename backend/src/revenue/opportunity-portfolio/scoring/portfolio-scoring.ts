import type { PortfolioState } from "../models/opportunity-portfolio.js";
import type {
  PortfolioEntryCreateInput,
  PriorityLevel,
  RiskLevel,
} from "../models/portfolio-entry.js";
import type { PortfolioSignal, PortfolioSignalType } from "../models/portfolio-signal.js";
import type { RevenueOpportunity } from "../../revenue-opportunity-synthesis/models/revenue-opportunity.js";

export const PORTFOLIO_SIGNAL_WEIGHTS: Record<PortfolioSignalType, number> = {
  expected_value: 0.3,
  confidence: 0.22,
  difficulty: 0.15,
  risk_exposure: 0.13,
  capital_priority: 0.08,
  attention_priority: 0.05,
  state_recommendation: 0.04,
  portfolio_composite: 0.03,
};

export type PortfolioRevenueOpportunityInput = Pick<
  RevenueOpportunity,
  | "opportunityId"
  | "productId"
  | "opportunityType"
  | "confidence"
  | "expectedValue"
  | "expectedDifficulty"
  | "reasons"
  | "risks"
>;

export type PortfolioScoringInput = {
  revenueOpportunity: PortfolioRevenueOpportunityInput;
  currentState?: PortfolioState | null;
};

export type PortfolioScoreBreakdown = Omit<
  PortfolioEntryCreateInput,
  "portfolioId" | "revenueOpportunityId" | "productId" | "opportunityType" | "state"
> & {
  recommendedState: PortfolioState;
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: PortfolioSignalType,
  score: number,
  detail: string,
): PortfolioSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: PORTFOLIO_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function resolvePriorityLevel(score: number): PriorityLevel {
  if (score >= 70) return "HIGH";
  if (score >= 45) return "MEDIUM";
  return "LOW";
}

function computeRiskLevel(
  expectedDifficulty: number,
  riskCount: number,
): RiskLevel {
  const exposure = expectedDifficulty * 0.7 + riskCount * 8;
  if (exposure >= 65) return "HIGH";
  if (exposure >= 40) return "MEDIUM";
  return "LOW";
}

function resolveRecommendedState(
  portfolioScore: number,
  confidence: number,
  expectedValue: number,
  expectedDifficulty: number,
  riskLevel: RiskLevel,
): PortfolioState {
  if (expectedValue < 30 || (riskLevel === "HIGH" && expectedValue < 45)) {
    return "RETIRED";
  }
  if (portfolioScore >= 80 && confidence >= 75 && expectedDifficulty <= 45) {
    return "SCALING";
  }
  if (portfolioScore >= 65 && confidence >= 60) {
    return "ACTIVE";
  }
  if (portfolioScore >= 45 || confidence >= 50) {
    return "WATCHLIST";
  }
  return "DISCOVERED";
}

/** Scores a revenue opportunity for portfolio management. */
export function scorePortfolioEntry(input: PortfolioScoringInput): PortfolioScoreBreakdown {
  const { revenueOpportunity } = input;
  const { confidence, expectedValue, expectedDifficulty, risks } = revenueOpportunity;

  const difficultyEase = clampScore(100 - expectedDifficulty);
  const riskExposure = clampScore(expectedDifficulty * 0.55 + risks.length * 10);
  const portfolioScore = clampScore(
    expectedValue * 0.42 + confidence * 0.33 + difficultyEase * 0.25,
  );

  const capitalPriority = resolvePriorityLevel(
    clampScore(expectedValue * 0.6 + confidence * 0.4),
  );
  const attentionPriority = resolvePriorityLevel(
    clampScore(riskExposure * 0.45 + (100 - portfolioScore) * 0.25 + risks.length * 8),
  );
  const riskLevel = computeRiskLevel(expectedDifficulty, risks.length);

  const recommendedState = resolveRecommendedState(
    portfolioScore,
    confidence,
    expectedValue,
    expectedDifficulty,
    riskLevel,
  );

  const signals: PortfolioSignal[] = [
    buildSignal("expected_value", expectedValue, `Expected value ${expectedValue}`),
    buildSignal("confidence", confidence, `Confidence ${confidence}`),
    buildSignal("difficulty", difficultyEase, `Execution ease ${difficultyEase}`),
    buildSignal("risk_exposure", riskExposure, `Risk exposure ${riskExposure}`),
    buildSignal(
      "capital_priority",
      capitalPriority === "HIGH" ? 85 : capitalPriority === "MEDIUM" ? 60 : 35,
      `Capital priority ${capitalPriority}`,
    ),
    buildSignal(
      "attention_priority",
      attentionPriority === "HIGH" ? 85 : attentionPriority === "MEDIUM" ? 60 : 35,
      `Attention priority ${attentionPriority}`,
    ),
    buildSignal(
      "state_recommendation",
      recommendedState === "SCALING"
        ? 92
        : recommendedState === "ACTIVE"
          ? 78
          : recommendedState === "WATCHLIST"
            ? 58
            : recommendedState === "RETIRED"
              ? 18
              : 40,
      `Recommended state ${recommendedState}`,
    ),
    buildSignal("portfolio_composite", portfolioScore, `Portfolio score ${portfolioScore}`),
  ];

  return {
    portfolioScore,
    capitalPriority,
    attentionPriority,
    riskLevel,
    recommendedState,
    signals,
  };
}

/** Ranks portfolio scoring inputs by portfolio score descending. */
export function rankPortfolioInputs(
  inputs: PortfolioScoringInput[],
): Array<PortfolioScoringInput & PortfolioScoreBreakdown> {
  return inputs
    .map((entry) => ({
      ...entry,
      ...scorePortfolioEntry(entry),
    }))
    .sort((left, right) => right.portfolioScore - left.portfolioScore);
}

export const portfolioScoring = {
  scorePortfolioEntry,
  rankPortfolioInputs,
  weights: PORTFOLIO_SIGNAL_WEIGHTS,
};

export type { PortfolioState };
