import type { PortfolioState } from "../../opportunity-portfolio/models/opportunity-portfolio.js";
import type { RiskLevel } from "../../opportunity-portfolio/models/portfolio-entry.js";
import type { PortfolioEntry } from "../../opportunity-portfolio/models/portfolio-entry.js";
import type { RevenueOpportunity } from "../../revenue-opportunity-synthesis/models/revenue-opportunity.js";
import type { CapitalAllocationCreateInput } from "../models/capital-allocation.js";
import type { AllocationSignal, AllocationSignalType } from "../models/allocation-signal.js";

export const ALLOCATION_SIGNAL_WEIGHTS: Record<AllocationSignalType, number> = {
  portfolio_score: 0.22,
  confidence: 0.18,
  expected_value: 0.2,
  expected_difficulty: 0.12,
  risk_level: 0.1,
  portfolio_state: 0.1,
  allocation_weight: 0.05,
  risk_adjustment: 0.03,
};

export type AllocationPortfolioEntryInput = Pick<
  PortfolioEntry,
  | "entryId"
  | "revenueOpportunityId"
  | "productId"
  | "state"
  | "portfolioScore"
  | "capitalPriority"
  | "riskLevel"
>;

export type AllocationRevenueOpportunityInput = Pick<
  RevenueOpportunity,
  "opportunityId" | "productId" | "confidence" | "expectedValue" | "expectedDifficulty"
>;

export type CapitalAllocationEntryInput = {
  portfolioEntry: AllocationPortfolioEntryInput;
  revenueOpportunity: AllocationRevenueOpportunityInput;
};

export type CapitalAllocationPlanInput = {
  totalCapital: number;
  entries: CapitalAllocationEntryInput[];
};

export type CapitalAllocationBreakdown = Omit<
  CapitalAllocationCreateInput,
  "totalCapital"
>;

const PORTFOLIO_STATE_WEIGHTS: Record<PortfolioState, number> = {
  SCALING: 100,
  ACTIVE: 72,
  WATCHLIST: 35,
  DISCOVERED: 15,
  RETIRED: 0,
};

const RISK_MULTIPLIERS: Record<RiskLevel, number> = {
  LOW: 1,
  MEDIUM: 0.88,
  HIGH: 0.72,
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildSignal(
  signalType: AllocationSignalType,
  score: number,
  detail: string,
): AllocationSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: ALLOCATION_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function computeRawWeight(entry: CapitalAllocationEntryInput): number {
  const { portfolioEntry, revenueOpportunity } = entry;

  if (portfolioEntry.state === "RETIRED") {
    return 0;
  }

  const executionEase = clampScore(100 - revenueOpportunity.expectedDifficulty);
  const stateWeight = PORTFOLIO_STATE_WEIGHTS[portfolioEntry.state];

  return (
    portfolioEntry.portfolioScore * 0.28 +
    revenueOpportunity.confidence * 0.22 +
    revenueOpportunity.expectedValue * 0.25 +
    executionEase * 0.1 +
    stateWeight * 0.15
  );
}

function buildRationale(
  entry: CapitalAllocationEntryInput,
  allocationPercentage: number,
  riskLevel: RiskLevel,
): string {
  const { portfolioEntry, revenueOpportunity } = entry;
  return [
    `Allocated ${allocationPercentage.toFixed(1)}% based on ${portfolioEntry.state} portfolio state`,
    `portfolio score ${portfolioEntry.portfolioScore}`,
    `expected value ${revenueOpportunity.expectedValue}`,
    `${riskLevel.toLowerCase()} risk profile`,
  ].join("; ");
}

function scoreSingleAllocation(
  entry: CapitalAllocationEntryInput,
  allocationPercentage: number,
  allocationAmount: number,
  totalCapital: number,
): CapitalAllocationBreakdown {
  const { portfolioEntry, revenueOpportunity } = entry;
  const rawWeight = computeRawWeight(entry);
  const riskMultiplier = RISK_MULTIPLIERS[portfolioEntry.riskLevel];
  const riskAdjustedAllocation = roundCurrency(allocationAmount * riskMultiplier);
  const executionEase = clampScore(100 - revenueOpportunity.expectedDifficulty);
  const confidence = clampScore(
    revenueOpportunity.confidence * 0.45 +
      portfolioEntry.portfolioScore * 0.35 +
      executionEase * 0.2,
  );

  const signals: AllocationSignal[] = [
    buildSignal(
      "portfolio_score",
      portfolioEntry.portfolioScore,
      `Portfolio score ${portfolioEntry.portfolioScore}`,
    ),
    buildSignal(
      "confidence",
      revenueOpportunity.confidence,
      `Opportunity confidence ${revenueOpportunity.confidence}`,
    ),
    buildSignal(
      "expected_value",
      revenueOpportunity.expectedValue,
      `Expected value ${revenueOpportunity.expectedValue}`,
    ),
    buildSignal(
      "expected_difficulty",
      executionEase,
      `Execution ease ${executionEase}`,
    ),
    buildSignal(
      "risk_level",
      portfolioEntry.riskLevel === "HIGH"
        ? 78
        : portfolioEntry.riskLevel === "MEDIUM"
          ? 52
          : 24,
      `Risk level ${portfolioEntry.riskLevel}`,
    ),
    buildSignal(
      "portfolio_state",
      PORTFOLIO_STATE_WEIGHTS[portfolioEntry.state],
      `Portfolio state ${portfolioEntry.state}`,
    ),
    buildSignal(
      "allocation_weight",
      clampScore(rawWeight),
      `Raw allocation weight ${rawWeight.toFixed(1)}`,
    ),
    buildSignal(
      "risk_adjustment",
      clampScore(riskMultiplier * 100),
      `Risk multiplier ${riskMultiplier}`,
    ),
  ];

  return {
    portfolioEntryId: portfolioEntry.entryId,
    opportunityId: revenueOpportunity.opportunityId,
    productId: revenueOpportunity.productId,
    portfolioState: portfolioEntry.state,
    allocationPercentage: roundCurrency(allocationPercentage),
    allocationAmount: roundCurrency(allocationAmount),
    riskAdjustedAllocation,
    confidence,
    rationale: buildRationale(entry, allocationPercentage, portfolioEntry.riskLevel),
    signals,
  };
}

/** Allocates capital across portfolio opportunities. */
export function scoreCapitalAllocation(
  input: CapitalAllocationPlanInput,
): CapitalAllocationBreakdown[] {
  const rawWeights = input.entries.map((entry) => ({
    entry,
    rawWeight: computeRawWeight(entry),
  }));
  const totalWeight = rawWeights.reduce((sum, item) => sum + item.rawWeight, 0);

  if (totalWeight === 0) {
    return input.entries.map((entry) =>
      scoreSingleAllocation(entry, 0, 0, input.totalCapital),
    );
  }

  return rawWeights.map(({ entry, rawWeight }) => {
    const allocationPercentage = (rawWeight / totalWeight) * 100;
    const allocationAmount = (input.totalCapital * allocationPercentage) / 100;
    return scoreSingleAllocation(entry, allocationPercentage, allocationAmount, input.totalCapital);
  });
}

/** Ranks allocation breakdowns by risk-adjusted allocation descending. */
export function rankCapitalAllocations(
  allocations: CapitalAllocationBreakdown[],
): CapitalAllocationBreakdown[] {
  return [...allocations].sort(
    (left, right) => right.riskAdjustedAllocation - left.riskAdjustedAllocation,
  );
}

export const capitalAllocationScoring = {
  scoreCapitalAllocation,
  rankCapitalAllocations,
  weights: ALLOCATION_SIGNAL_WEIGHTS,
  portfolioStateWeights: PORTFOLIO_STATE_WEIGHTS,
  riskMultipliers: RISK_MULTIPLIERS,
};

export type { PortfolioState };
