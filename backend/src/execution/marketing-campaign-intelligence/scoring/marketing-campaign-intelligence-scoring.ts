import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { AudienceIntelligence } from "../models/audience-intelligence.js";
import type { BudgetIntelligence } from "../models/budget-intelligence.js";
import type {
  CampaignObjective,
  CampaignObjectiveIntelligence,
} from "../models/campaign-objective.js";
import { CAMPAIGN_OBJECTIVES } from "../models/campaign-objective.js";
import type { CampaignRecommendation } from "../models/campaign-recommendation.js";
import type { CampaignRiskAssessment } from "../models/campaign-risk.js";
import type {
  CampaignIntelligenceSignal,
  CampaignIntelligenceSignalType,
} from "../models/campaign-intelligence-signal.js";
import type { CampaignStrategy, CampaignStrategyTier } from "../models/campaign-strategy.js";
import { CAMPAIGN_STRATEGY_TIERS } from "../models/campaign-strategy.js";
import type { ChannelRecommendation, MarketingChannel } from "../models/channel-recommendation.js";
import {
  MARKETING_CHANNELS,
  marketingChannelLabel,
} from "../models/channel-recommendation.js";
import type { MarketingCampaignIntelligenceCreateInput } from "../models/marketing-campaign-intelligence.js";

export const CAMPAIGN_INTELLIGENCE_SIGNAL_WEIGHTS: Record<
  CampaignIntelligenceSignalType,
  number
> = {
  objective_fit: 0.2,
  channel_fit: 0.18,
  audience_clarity: 0.16,
  budget_efficiency: 0.16,
  strategy_alignment: 0.12,
  risk_adjusted: 0.1,
  intelligence_composite: 0.08,
};

export type CampaignIntelligenceBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type CampaignIntelligenceOfferInput = {
  offerTitle: string;
  headline: string;
  valueProposition: string;
  keyBenefits: string[];
  callToAction: string;
  confidence?: number;
};

export type MarketingCampaignIntelligenceInput = {
  brand: CampaignIntelligenceBrandInput;
  offer: CampaignIntelligenceOfferInput;
  storeId?: string;
  launchConfidence?: number;
  opportunityType?: string;
};

export type MarketingCampaignIntelligenceBreakdown = MarketingCampaignIntelligenceCreateInput;

const CHANNEL_OBJECTIVE_FIT: Record<CampaignObjective, MarketingChannel[]> = {
  SALES: ["GOOGLE_SHOPPING", "META_FACEBOOK", "META_INSTAGRAM", "GOOGLE_SEARCH"],
  TRAFFIC: ["GOOGLE_SEARCH", "META_FACEBOOK", "REDDIT", "PINTEREST"],
  LEADS: ["GOOGLE_SEARCH", "META_FACEBOOK", "YOUTUBE"],
  AWARENESS: ["TIKTOK", "YOUTUBE", "META_INSTAGRAM", "REDDIT"],
  ENGAGEMENT: ["TIKTOK", "META_INSTAGRAM", "REDDIT", "YOUTUBE"],
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildSignal(
  signalType: CampaignIntelligenceSignalType,
  score: number,
  detail: string,
): CampaignIntelligenceSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: CAMPAIGN_INTELLIGENCE_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function resolveLaunchConfidence(input: MarketingCampaignIntelligenceInput): number {
  const offerConfidence = input.offer.confidence ?? 78;
  const explicit = input.launchConfidence;
  if (explicit !== undefined) {
    return clampScore(explicit * 0.4 + input.brand.confidence * 0.35 + offerConfidence * 0.25);
  }
  return clampScore(input.brand.confidence * 0.55 + offerConfidence * 0.45);
}

/** Phase 077A — determine optimal campaign objective. */
function buildObjectiveIntelligence(
  input: MarketingCampaignIntelligenceInput,
  launchConfidence: number,
): CampaignObjectiveIntelligence {
  const niche = normalize(input.brand.niche);
  const audience = normalize(input.brand.targetAudience);
  const offerConfidence = input.offer.confidence ?? 78;
  const opportunity = normalize(input.opportunityType ?? "launch");

  const baseScores: Record<CampaignObjective, number> = {
    SALES: 72,
    TRAFFIC: 68,
    LEADS: 58,
    AWARENESS: 64,
    ENGAGEMENT: 62,
  };

  if (niche.includes("ecommerce") || niche.includes("commerce") || niche.includes("dtc")) {
    baseScores.SALES += 12;
    baseScores.TRAFFIC += 4;
  }
  if (niche.includes("premium") || niche.includes("appliance") || niche.includes("kitchen")) {
    baseScores.SALES += 8;
    baseScores.LEADS += 4;
  }
  if (audience.includes("young") || audience.includes("gen z") || audience.includes("trend")) {
    baseScores.ENGAGEMENT += 14;
    baseScores.AWARENESS += 8;
  }
  if (audience.includes("search") || audience.includes("intent") || audience.includes("shopper")) {
    baseScores.SALES += 10;
    baseScores.TRAFFIC += 6;
  }
  if (input.offer.keyBenefits.length >= 3) {
    baseScores.SALES += 4;
  }
  if (launchConfidence >= 80) {
    baseScores.SALES += 6;
  } else if (launchConfidence < 65) {
    baseScores.AWARENESS += 10;
    baseScores.ENGAGEMENT += 6;
  }
  if (opportunity.includes("launch") || opportunity.includes("new")) {
    baseScores.AWARENESS += 6;
  }
  if (offerConfidence >= 82) {
    baseScores.SALES += 5;
  }

  const objectiveScores = CAMPAIGN_OBJECTIVES.map((objective) => ({
    objective,
    score: clampScore(baseScores[objective]),
    rationale: `${objective} scored for ${input.brand.niche} targeting ${input.brand.targetAudience.slice(0, 40)}`,
  })).sort((left, right) => right.score - left.score || left.objective.localeCompare(right.objective));

  const recommendedObjective = objectiveScores[0]!.objective;

  return {
    recommendedObjective,
    objectiveScores,
    rationale: `${recommendedObjective} is optimal given ${launchConfidence}% launch confidence, ${input.brand.niche} niche, and ${input.offer.offerTitle} offer positioning.`,
  };
}

/** Phase 077B — score and rank advertising channels. */
function scoreChannel(
  channel: MarketingChannel,
  input: MarketingCampaignIntelligenceInput,
  objective: CampaignObjective,
): ChannelRecommendation {
  const niche = normalize(input.brand.niche);
  const audience = normalize(input.brand.targetAudience);

  const baseScores: Record<MarketingChannel, number> = {
    META_FACEBOOK: 78,
    META_INSTAGRAM: 80,
    TIKTOK: 74,
    GOOGLE_SEARCH: 82,
    GOOGLE_SHOPPING: 84,
    YOUTUBE: 76,
    PINTEREST: 70,
    REDDIT: 68,
  };

  let score = baseScores[channel];

  if (channel === "GOOGLE_SHOPPING" && (niche.includes("ecommerce") || niche.includes("product"))) {
    score += 8;
  }
  if (channel === "GOOGLE_SEARCH" && audience.includes("search")) {
    score += 10;
  }
  if (channel === "TIKTOK" && (audience.includes("young") || niche.includes("trend"))) {
    score += 12;
  }
  if (channel === "META_INSTAGRAM" && (niche.includes("lifestyle") || niche.includes("premium"))) {
    score += 8;
  }
  if (channel === "META_FACEBOOK" && niche.includes("ecommerce")) {
    score += 6;
  }
  if (channel === "YOUTUBE" && input.offer.keyBenefits.length >= 3) {
    score += 5;
  }
  if (channel === "PINTEREST" && niche.includes("home")) {
    score += 8;
  }
  if (channel === "REDDIT" && niche.includes("niche")) {
    score += 6;
  }

  const fitForObjective = CHANNEL_OBJECTIVE_FIT[objective].includes(channel);
  if (fitForObjective) {
    score += 6;
  }

  score = clampScore(score);
  const confidence = clampScore(score * 0.85 + (input.brand.confidence + (input.offer.confidence ?? 78)) / 4);

  return {
    channel,
    rank: 0,
    score,
    confidence,
    rationale: `${marketingChannelLabel(channel)} fits ${objective} campaigns for ${input.brand.brandName}.`,
    fitForObjective,
  };
}

function buildChannelRecommendations(
  input: MarketingCampaignIntelligenceInput,
  objective: CampaignObjective,
): ChannelRecommendation[] {
  return MARKETING_CHANNELS.map((channel) => scoreChannel(channel, input, objective))
    .sort((left, right) => right.score - left.score || left.channel.localeCompare(right.channel))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/** Phase 077C — generate audience intelligence. */
function buildAudienceIntelligence(input: MarketingCampaignIntelligenceInput): AudienceIntelligence {
  const niche = input.brand.niche;
  const audience = input.brand.targetAudience;

  const countries =
    niche.toLowerCase().includes("global")
      ? ["US", "CA", "GB", "AU"]
      : ["US", "CA", "GB"];

  const ageRanges = audience.toLowerCase().includes("young")
    ? ["18-24", "25-34"]
    : audience.toLowerCase().includes("professional")
      ? ["25-44", "45-54"]
      : ["25-34", "35-44", "45-54"];

  const genders = ["All"];

  const interests = [
    niche,
    input.offer.offerTitle,
    ...input.offer.keyBenefits.slice(0, 2).map((benefit) => benefit.slice(0, 40)),
    input.brand.positioning.slice(0, 48),
  ];

  const behaviors = [
    "Online shoppers",
    "Engaged shoppers",
    "Recently searched related products",
    `${niche} enthusiasts`,
  ];

  return {
    countries,
    ageRanges,
    genders,
    interests,
    behaviors,
    lookalikeRecommendation: `Build a 1% lookalike from website purchasers and add-to-cart events for ${input.brand.brandName}.`,
    customAudienceRecommendation: `Retarget ${audience} who viewed ${input.offer.offerTitle} landing pages within 14 days.`,
  };
}

/** Phase 077D — budget and performance estimates. */
function buildBudgetIntelligence(
  input: MarketingCampaignIntelligenceInput,
  topChannel: MarketingChannel,
  launchConfidence: number,
): BudgetIntelligence {
  const nicheFactor = normalize(input.brand.niche).includes("premium") ? 1.15 : 1;
  const channelFactor =
    topChannel === "GOOGLE_SHOPPING" || topChannel === "GOOGLE_SEARCH" ? 1.1 : 1;
  const confidenceFactor = launchConfidence / 100;

  const minimumTestBudget = clampScore(50 * nicheFactor * channelFactor);
  const recommendedBudget = clampScore(minimumTestBudget * (2.5 + confidenceFactor));
  const aggressiveBudget = clampScore(recommendedBudget * 2.2);

  const expectedCpc = Number((0.85 * nicheFactor * channelFactor).toFixed(2));
  const expectedCpm = Number((12.5 * nicheFactor).toFixed(2));
  const expectedCtr = Number((2.4 + confidenceFactor * 0.8).toFixed(2));
  const expectedCpa = Number((28 * nicheFactor / Math.max(confidenceFactor, 0.5)).toFixed(2));
  const estimatedRoas = Number((2.2 + confidenceFactor * 1.4).toFixed(2));
  const estimatedBreakeven = Number((expectedCpa / Math.max(estimatedRoas, 0.1)).toFixed(2));

  return {
    minimumTestBudget,
    recommendedBudget,
    aggressiveBudget,
    currency: "USD",
    expectedCpc,
    expectedCpm,
    expectedCtr,
    expectedCpa,
    estimatedRoas,
    estimatedBreakeven,
  };
}

/** Phase 077E — generate three campaign strategies. */
function buildStrategies(
  input: MarketingCampaignIntelligenceInput,
  objective: CampaignObjective,
  channels: ChannelRecommendation[],
  budget: BudgetIntelligence,
): CampaignStrategy[] {
  const topChannels = channels.slice(0, 3).map((entry) => entry.channel);

  const tierConfig: Record<
    CampaignStrategyTier,
    { multiplier: number; channelCount: number; tone: string }
  > = {
    CONSERVATIVE: {
      multiplier: 1,
      channelCount: 2,
      tone: "Validate messaging with minimal spend before scaling.",
    },
    BALANCED: {
      multiplier: 1.6,
      channelCount: 3,
      tone: "Blend prospecting and retargeting across proven channels.",
    },
    AGGRESSIVE: {
      multiplier: 2.4,
      channelCount: 4,
      tone: "Maximize reach and conversion velocity with broader channel mix.",
    },
  };

  return CAMPAIGN_STRATEGY_TIERS.map((tier) => {
    const config = tierConfig[tier];
    const primaryChannels = topChannels.slice(0, config.channelCount);
    const spend = clampScore(budget.minimumTestBudget * config.multiplier);

    return {
      tier,
      objective,
      primaryChannels,
      budgetMultiplier: config.multiplier,
      rationale: `${tier} strategy for ${input.brand.brandName}: ${config.tone} Recommended test spend ~$${spend}.`,
      expectedOutcome:
        tier === "CONSERVATIVE"
          ? "Validate CTR and CPA benchmarks with controlled learning spend."
          : tier === "BALANCED"
            ? "Achieve stable ROAS while expanding audience reach."
            : "Accelerate revenue capture with higher spend and broader channel coverage.",
    };
  });
}

/** Phase 077F — campaign risk assessment. */
function buildRiskAssessment(
  input: MarketingCampaignIntelligenceInput,
  launchConfidence: number,
  budget: BudgetIntelligence,
): CampaignRiskAssessment {
  const niche = normalize(input.brand.niche);
  const competitionLevel = clampScore(
    niche.includes("ecommerce") ? 72 : niche.includes("premium") ? 58 : 64,
  );
  const marketSaturation = clampScore(
    niche.includes("kitchen") || niche.includes("appliance") ? 68 : 52,
  );
  const creativeFatigueRisk = clampScore(
    input.offer.keyBenefits.length >= 3 ? 48 : 62,
  );
  const budgetRisk = clampScore(
    budget.recommendedBudget >= 200 ? 58 : 42,
  );
  const expectedLearningPeriodDays =
    launchConfidence >= 80 ? 7 : launchConfidence >= 70 ? 10 : 14;

  const overallRiskScore = clampScore(
    average([competitionLevel, marketSaturation, creativeFatigueRisk, budgetRisk]) *
      (launchConfidence >= 75 ? 0.85 : 1),
  );

  const riskTier =
    overallRiskScore >= 70 ? "HIGH" : overallRiskScore >= 50 ? "MODERATE" : "LOW";

  return {
    marketSaturation,
    competitionLevel,
    creativeFatigueRisk,
    budgetRisk,
    expectedLearningPeriodDays,
    overallRiskScore,
    riskTier,
    summary: `${riskTier} risk profile for ${input.brand.niche} — ${expectedLearningPeriodDays}-day learning period expected before optimization.`,
  };
}

/** Phase 077G — synthesize final recommendation. */
function buildRecommendation(
  input: MarketingCampaignIntelligenceInput,
  objectiveIntel: CampaignObjectiveIntelligence,
  channels: ChannelRecommendation[],
  audience: AudienceIntelligence,
  budget: BudgetIntelligence,
  strategies: CampaignStrategy[],
  risk: CampaignRiskAssessment,
  launchConfidence: number,
): CampaignRecommendation {
  const topChannel = channels[0]!;
  const recommendedStrategy: CampaignStrategyTier =
    risk.riskTier === "HIGH"
      ? "CONSERVATIVE"
      : launchConfidence >= 80
        ? "BALANCED"
        : launchConfidence >= 70
          ? "BALANCED"
          : "CONSERVATIVE";

  const confidenceScore = clampScore(
    launchConfidence * 0.3 +
      topChannel.confidence * 0.25 +
      objectiveIntel.objectiveScores[0]!.score * 0.2 +
      (100 - risk.overallRiskScore) * 0.15 +
      budget.estimatedRoas * 10,
  );

  return {
    recommendedStrategy,
    recommendedChannel: topChannel.channel,
    recommendedAudience: audience,
    recommendedBudget: budget,
    expectedOutcome: `${recommendedStrategy} ${objectiveIntel.recommendedObjective} campaign on ${marketingChannelLabel(topChannel.channel)} targeting ${audience.countries.join(", ")} with ~$${budget.recommendedBudget} recommended budget and ${budget.estimatedRoas}x estimated ROAS.`,
    confidenceScore,
  };
}

function buildSignals(
  input: MarketingCampaignIntelligenceInput,
  objectiveIntel: CampaignObjectiveIntelligence,
  channels: ChannelRecommendation[],
  audience: AudienceIntelligence,
  budget: BudgetIntelligence,
  strategies: CampaignStrategy[],
  risk: CampaignRiskAssessment,
  confidence: number,
): CampaignIntelligenceSignal[] {
  return [
    buildSignal(
      "objective_fit",
      objectiveIntel.objectiveScores[0]!.score,
      `Recommended objective ${objectiveIntel.recommendedObjective}`,
    ),
    buildSignal(
      "channel_fit",
      channels[0]!.score,
      `Top channel ${channels[0]!.channel} score ${channels[0]!.score}`,
    ),
    buildSignal(
      "audience_clarity",
      input.brand.targetAudience.length >= 20 ? 86 : 68,
      `${audience.interests.length} interest targets defined`,
    ),
    buildSignal(
      "budget_efficiency",
      clampScore(budget.estimatedRoas * 30),
      `Estimated ROAS ${budget.estimatedRoas}x at $${budget.recommendedBudget} budget`,
    ),
    buildSignal(
      "strategy_alignment",
      average(strategies.map((strategy) => (strategy.tier === "BALANCED" ? 84 : 72))),
      `${strategies.length} strategy tiers generated`,
    ),
    buildSignal(
      "risk_adjusted",
      100 - risk.overallRiskScore,
      `${risk.riskTier} risk tier with ${risk.expectedLearningPeriodDays}-day learning period`,
    ),
    buildSignal("intelligence_composite", confidence, `Intelligence confidence ${confidence}`),
  ];
}

function buildCampaignName(brand: CampaignIntelligenceBrandInput, offer: CampaignIntelligenceOfferInput): string {
  return `${brand.brandName} — ${offer.offerTitle} Intelligence`;
}

/** Generates full marketing campaign intelligence — intelligence only, no live ads. */
export function generateMarketingCampaignIntelligence(
  input: MarketingCampaignIntelligenceInput,
): MarketingCampaignIntelligenceBreakdown {
  const launchConfidence = resolveLaunchConfidence(input);
  const objectiveIntelligence = buildObjectiveIntelligence(input, launchConfidence);
  const channelRecommendations = buildChannelRecommendations(
    input,
    objectiveIntelligence.recommendedObjective,
  );
  const audienceIntelligence = buildAudienceIntelligence(input);
  const budgetIntelligence = buildBudgetIntelligence(
    input,
    channelRecommendations[0]!.channel,
    launchConfidence,
  );
  const strategies = buildStrategies(
    input,
    objectiveIntelligence.recommendedObjective,
    channelRecommendations,
    budgetIntelligence,
  );
  const riskAssessment = buildRiskAssessment(input, launchConfidence, budgetIntelligence);

  const provisionalRecommendation = buildRecommendation(
    input,
    objectiveIntelligence,
    channelRecommendations,
    audienceIntelligence,
    budgetIntelligence,
    strategies,
    riskAssessment,
    launchConfidence,
  );

  const confidence = provisionalRecommendation.confidenceScore;
  const signals = buildSignals(
    input,
    objectiveIntelligence,
    channelRecommendations,
    audienceIntelligence,
    budgetIntelligence,
    strategies,
    riskAssessment,
    confidence,
  );

  const recommendation = buildRecommendation(
    input,
    objectiveIntelligence,
    channelRecommendations,
    audienceIntelligence,
    budgetIntelligence,
    strategies,
    riskAssessment,
    launchConfidence,
  );

  return {
    brandId: input.brand.brandId,
    storeId: input.storeId ?? null,
    campaignName: buildCampaignName(input.brand, input.offer),
    objectiveIntelligence,
    channelRecommendations,
    audienceIntelligence,
    budgetIntelligence,
    strategies,
    riskAssessment,
    recommendation,
    confidence,
    signals,
    intelligenceOnly: true,
    liveAdvertisingEnabled: false,
  };
}

export const marketingCampaignIntelligenceScoring = {
  generateMarketingCampaignIntelligence,
  weights: CAMPAIGN_INTELLIGENCE_SIGNAL_WEIGHTS,
};
