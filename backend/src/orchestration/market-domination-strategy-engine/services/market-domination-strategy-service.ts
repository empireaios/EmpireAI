import { captureSoulRuntimeEvent } from "../../../foundation/soul-runtime/services/soul-runtime-engine.js";
import {
  getBusinessOpportunityRepository,
  listBusinessOpportunities,
} from "../../business-opportunity-workspace/index.js";
import { getBusinessPreviewRepository } from "../../business-preview-studio/index.js";
import type {
  MarketDominationStrategyDocument,
  MarketStrategyComparison,
  MarketStrategyDashboard,
  MarketStrategySummary,
} from "../models/market-domination-strategy.js";
import {
  getMarketStrategyRepository,
  resetMarketStrategyRepository,
} from "../repositories/sqlite-market-strategy-repository.js";
import { generateMarketDominationStrategy } from "./market-strategy-generator.js";

export { getMarketStrategyRepository, resetMarketStrategyRepository };

const APPROVED_OPPORTUNITY_STATUSES = new Set(["APPROVED", "READY_FOR_BUILD"]);
const RECOMMENDATION_RANK: Record<string, number> = {
  DO_NOT_BUILD: 0,
  BUILD_WITH_CAUTION: 1,
  BUILD: 2,
  HIGH_PRIORITY_BUILD: 3,
};

export class MarketStrategyNotFoundError extends Error {
  constructor(strategyId: string) {
    super(`Market domination strategy not found: ${strategyId}`);
    this.name = "MarketStrategyNotFoundError";
  }
}

export class MarketStrategyBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarketStrategyBlockedError";
  }
}

function captureStrategySoulRuntime(
  workspaceId: string,
  title: string,
  summary: string,
  actor: string,
  payload: Record<string, unknown>,
) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "businessMilestones",
      title,
      summary,
      source: "system",
      actor,
      payload,
    });
  } catch {
    // best-effort
  }
}

function requireApprovedOpportunity(businessOpportunityId: string) {
  const opportunity = getBusinessOpportunityRepository().getOpportunity(businessOpportunityId);
  if (!opportunity) {
    throw new MarketStrategyBlockedError(`Business opportunity not found: ${businessOpportunityId}`);
  }
  if (!APPROVED_OPPORTUNITY_STATUSES.has(opportunity.status)) {
    throw new MarketStrategyBlockedError(
      `Strategy requires approved business opportunity — current status: ${opportunity.status}`,
    );
  }
  return opportunity;
}

/** Generates market domination strategy — mandatory before build, no execution. */
export function generateMarketStrategyForOpportunity(
  businessOpportunityId: string,
  actor?: string,
): MarketDominationStrategyDocument {
  const opportunity = requireApprovedOpportunity(businessOpportunityId);
  const preview = getBusinessPreviewRepository().getLatestByOpportunity(businessOpportunityId);
  const strategy = generateMarketDominationStrategy(opportunity, preview);
  const saved = getMarketStrategyRepository().saveStrategy(strategy);

  captureStrategySoulRuntime(
    opportunity.workspaceId,
    "Market domination strategy generated",
    `${opportunity.brand.businessName} — ${saved.grandKingRecommendation.recommendation}`,
    actor ?? "market-domination-strategy-engine",
    { strategyId: saved.strategyId, businessOpportunityId },
  );

  return saved;
}

export function listMarketStrategies(
  workspaceId: string,
  companyId: string,
): MarketDominationStrategyDocument[] {
  return getMarketStrategyRepository().listStrategies(workspaceId, companyId);
}

export function getMarketStrategy(strategyId: string): MarketDominationStrategyDocument | null {
  return getMarketStrategyRepository().getStrategy(strategyId);
}

function compareWinner(a: number, b: number): "A" | "B" | "TIE" {
  if (Math.abs(a - b) < 0.5) return "TIE";
  return a > b ? "A" : "B";
}

export function compareMarketStrategies(
  strategyIdA: string,
  strategyIdB: string,
): MarketStrategyComparison {
  const strategyA = getMarketStrategyRepository().getStrategy(strategyIdA);
  const strategyB = getMarketStrategyRepository().getStrategy(strategyIdB);

  if (!strategyA) throw new MarketStrategyNotFoundError(strategyIdA);
  if (!strategyB) throw new MarketStrategyNotFoundError(strategyIdB);

  const pricingA = strategyA.competitiveAdvantages.find((entry) => entry.name === "Pricing Advantage")?.strength ?? 0;
  const pricingB = strategyB.competitiveAdvantages.find((entry) => entry.name === "Pricing Advantage")?.strength ?? 0;

  const riskA = strategyA.riskAssessment.topRisks.length;
  const riskB = strategyB.riskAssessment.topRisks.length;

  const highlights = {
    higherConfidence: compareWinner(strategyA.overallConfidence, strategyB.overallConfidence),
    strongerRecommendation: compareWinner(
      RECOMMENDATION_RANK[strategyA.grandKingRecommendation.recommendation] ?? 0,
      RECOMMENDATION_RANK[strategyB.grandKingRecommendation.recommendation] ?? 0,
    ),
    betterPricingAdvantage: compareWinner(pricingA, pricingB),
    strongerBattlefield: compareWinner(
      strategyA.battlefield.primaryMarketplace === strategyB.battlefield.primaryMarketplace
        ? strategyA.overallConfidence
        : strategyA.overallConfidence,
      strategyB.overallConfidence,
    ),
    lowerRisk: compareWinner(riskB, riskA),
  };

  const winsA = Object.values(highlights).filter((value) => value === "A").length;
  const winsB = Object.values(highlights).filter((value) => value === "B").length;
  const summary =
    winsA > winsB
      ? `${strategyA.businessName} leads ${winsA} of 5 strategy dimensions.`
      : winsB > winsA
        ? `${strategyB.businessName} leads ${winsB} of 5 strategy dimensions.`
        : "Both strategies are evenly matched across key dimensions.";

  return { strategyA, strategyB, highlights, summary };
}

export function buildMarketStrategySummary(
  workspaceId: string,
  companyId: string,
): MarketStrategySummary {
  const strategies = listMarketStrategies(workspaceId, companyId);
  const highPriorityBuilds = strategies.filter(
    (entry) => entry.grandKingRecommendation.recommendation === "HIGH_PRIORITY_BUILD",
  ).length;
  const buildRecommendations = strategies.filter((entry) =>
    ["BUILD", "HIGH_PRIORITY_BUILD"].includes(entry.grandKingRecommendation.recommendation),
  ).length;
  const doNotBuildCount = strategies.filter(
    (entry) => entry.grandKingRecommendation.recommendation === "DO_NOT_BUILD",
  ).length;
  const averageConfidence =
    strategies.length === 0
      ? 0
      : Math.round(strategies.reduce((sum, entry) => sum + entry.overallConfidence, 0) / strategies.length);

  const topStrategy = [...strategies].sort((a, b) => {
    const rankDiff =
      (RECOMMENDATION_RANK[b.grandKingRecommendation.recommendation] ?? 0) -
      (RECOMMENDATION_RANK[a.grandKingRecommendation.recommendation] ?? 0);
    if (rankDiff !== 0) return rankDiff;
    return b.overallConfidence - a.overallConfidence;
  })[0];

  return {
    workspaceId,
    companyId,
    totalStrategies: strategies.length,
    highPriorityBuilds,
    buildRecommendations,
    doNotBuildCount,
    averageConfidence,
    topStrategy,
    computedAt: new Date().toISOString(),
  };
}

export function buildMarketStrategyDashboard(
  workspaceId: string,
  companyId: string,
): MarketStrategyDashboard {
  const summary = buildMarketStrategySummary(workspaceId, companyId);
  const latest = summary.topStrategy ?? listMarketStrategies(workspaceId, companyId)[0] ?? null;

  const approvedWithoutStrategy = listBusinessOpportunities(workspaceId, companyId).filter(
    (entry) =>
      APPROVED_OPPORTUNITY_STATUSES.has(entry.status) &&
      !getMarketStrategyRepository().getLatestByOpportunity(entry.businessOpportunityId),
  );

  if (!latest) {
    return {
      mission: approvedWithoutStrategy.length > 0
        ? "Generate market domination strategy before any business build."
        : "Approve a business opportunity to begin strategy generation.",
      winningStrategy: "No strategy generated yet.",
      competitiveAdvantages: [],
      primaryBattlefield: "—",
      launchRecommendation: undefined,
      overallConfidence: 0,
      computedAt: new Date().toISOString(),
    };
  }

  const topAdvantages = latest.competitiveAdvantages
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 4)
    .map((entry) => entry.name);

  return {
    mission: latest.identity.businessMission,
    winningStrategy: latest.winningStrategySummary,
    competitiveAdvantages: topAdvantages,
    primaryBattlefield: latest.battlefield.primaryMarketplace,
    launchRecommendation: latest.grandKingRecommendation.recommendation,
    overallConfidence: latest.overallConfidence,
    latestStrategyId: latest.strategyId,
    computedAt: new Date().toISOString(),
  };
}
