import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { AdAngle } from "../models/ad-angle.js";
import type { CampaignGenesisSignal, CampaignGenesisSignalType } from "../models/campaign-genesis-signal.js";
import type { CreativeIdea } from "../models/creative-idea.js";
import type { MarketingCampaignCreateInput } from "../models/marketing-campaign.js";
import type { MarketingPlatform } from "../models/marketing-platform.js";
import { MARKETING_PLATFORMS, marketingPlatformLabel } from "../models/marketing-platform.js";
import type { PlatformRecommendation } from "../models/platform-recommendation.js";

export const CAMPAIGN_GENESIS_SIGNAL_WEIGHTS: Record<CampaignGenesisSignalType, number> = {
  brand_alignment: 0.22,
  audience_clarity: 0.18,
  angle_strength: 0.18,
  creative_coverage: 0.16,
  platform_fit: 0.16,
  campaign_composite: 0.1,
};

export type CampaignGenesisBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type CampaignGenesisOfferInput = {
  offerTitle: string;
  headline: string;
  valueProposition: string;
  keyBenefits: string[];
  callToAction: string;
  confidence?: number;
};

export type MarketingCampaignGenesisInput = {
  brand: CampaignGenesisBrandInput;
  offer: CampaignGenesisOfferInput;
  storeId?: string;
  heroProductName?: string;
};

export type MarketingCampaignGenesisBreakdown = MarketingCampaignCreateInput & {
  brandId: string;
  storeId: string | null;
};

const PLATFORM_OBJECTIVES: Record<MarketingPlatform, string> = {
  FACEBOOK: "Prospecting and retargeting with broad interest targeting",
  INSTAGRAM: "Visual discovery and lifestyle-led conversion",
  TIKTOK: "Short-form awareness and viral product demos",
  GOOGLE: "High-intent search capture and branded demand",
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function buildSignal(
  signalType: CampaignGenesisSignalType,
  score: number,
  detail: string,
): CampaignGenesisSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: CAMPAIGN_GENESIS_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function buildCampaignName(brand: CampaignGenesisBrandInput, offer: CampaignGenesisOfferInput): string {
  return `${brand.brandName} — ${offer.offerTitle} Launch`;
}

function buildTargetAudience(brand: CampaignGenesisBrandInput): string {
  return `${brand.targetAudience} interested in ${brand.niche} and responsive to ${brand.positioning.toLowerCase()}.`;
}

function buildAdAngles(
  brand: CampaignGenesisBrandInput,
  offer: CampaignGenesisOfferInput,
): AdAngle[] {
  const benefitAngles = offer.keyBenefits.slice(0, 2).map((benefit, index) => ({
    angleId: randomUUID(),
    title: `Benefit-led: ${benefit.slice(0, 48)}`,
    hook: `${benefit} — ${brand.brandName}`,
    rationale: `Leads with a concrete buyer benefit from the ${offer.offerTitle} offer.`,
    priority: index + 1,
  }));

  return [
    {
      angleId: randomUUID(),
      title: "Problem-solution",
      hook: offer.headline,
      rationale: `Addresses the core buyer problem with ${brand.brandName}'s positioning.`,
      priority: 1,
    },
    {
      angleId: randomUUID(),
      title: "Value proposition",
      hook: offer.valueProposition,
      rationale: "Centers the campaign on the primary offer promise.",
      priority: 2,
    },
    ...benefitAngles.map((angle, offset) => ({
      ...angle,
      priority: offset + 3,
    })),
    {
      angleId: randomUUID(),
      title: "Social proof launch",
      hook: `Join shoppers choosing ${brand.brandName} for ${brand.niche}.`,
      rationale: "Uses niche authority and launch momentum to reduce purchase hesitation.",
      priority: benefitAngles.length + 3,
    },
  ];
}

function buildCreativeIdeas(
  brand: CampaignGenesisBrandInput,
  offer: CampaignGenesisOfferInput,
): CreativeIdea[] {
  const product = brand.brandName;
  const ideas: Array<Omit<CreativeIdea, "ideaId">> = [
    {
      format: "Short-form video",
      concept: `15-second demo showing the hero benefit of ${offer.offerTitle} with on-screen captions.`,
      platform: "TIKTOK",
      callToAction: offer.callToAction,
    },
    {
      format: "Reels / Story",
      concept: `Before-and-after lifestyle clip featuring ${product} in everyday ${brand.niche} use.`,
      platform: "INSTAGRAM",
      callToAction: offer.callToAction,
    },
    {
      format: "Carousel ad",
      concept: `Three-slide carousel: problem, solution, and top benefits from ${offer.offerTitle}.`,
      platform: "FACEBOOK",
      callToAction: offer.callToAction,
    },
    {
      format: "Search ad",
      concept: `Responsive search copy pairing "${offer.headline}" with ${brand.slogan}.`,
      platform: "GOOGLE",
      callToAction: offer.callToAction,
    },
    {
      format: "Static image",
      concept: `Clean product hero shot with ${offer.valueProposition} as primary overlay text.`,
      platform: "INSTAGRAM",
      callToAction: offer.callToAction,
    },
  ];

  return ideas.map((idea) => ({
    ideaId: randomUUID(),
    ...idea,
  }));
}

function scorePlatform(
  platform: MarketingPlatform,
  brand: CampaignGenesisBrandInput,
  offer: CampaignGenesisOfferInput,
): PlatformRecommendation {
  const niche = normalize(brand.niche);
  const audience = normalize(brand.targetAudience);

  const baseScores: Record<MarketingPlatform, number> = {
    FACEBOOK: 82,
    INSTAGRAM: 80,
    TIKTOK: 76,
    GOOGLE: 84,
  };

  let score = baseScores[platform];

  if (platform === "TIKTOK" && (niche.includes("trend") || audience.includes("young"))) {
    score += 8;
  }
  if (platform === "INSTAGRAM" && (niche.includes("lifestyle") || niche.includes("premium"))) {
    score += 6;
  }
  if (platform === "GOOGLE" && audience.includes("search")) {
    score += 10;
  }
  if (platform === "FACEBOOK" && niche.includes("ecommerce")) {
    score += 5;
  }
  if (offer.keyBenefits.length >= 3) {
    score += 2;
  }

  score = clampScore(score);
  const budgetTier = score >= 88 ? "HIGH" : score >= 75 ? "MEDIUM" : "LOW";

  return {
    platform,
    score,
    rationale: `${marketingPlatformLabel(platform)} fits ${brand.niche} launch for ${offer.offerTitle}.`,
    budgetTier,
    objective: PLATFORM_OBJECTIVES[platform],
  };
}

function buildPlatformRecommendations(
  brand: CampaignGenesisBrandInput,
  offer: CampaignGenesisOfferInput,
): PlatformRecommendation[] {
  return MARKETING_PLATFORMS.map((platform) => scorePlatform(platform, brand, offer)).sort(
    (left, right) => right.score - left.score || left.platform.localeCompare(right.platform),
  );
}

function computeConfidence(
  brand: CampaignGenesisBrandInput,
  offer: CampaignGenesisOfferInput,
  adAngles: AdAngle[],
  creativeIdeas: CreativeIdea[],
  platformRecommendations: PlatformRecommendation[],
  signals: CampaignGenesisSignal[],
): number {
  return clampScore(
    brand.confidence * 0.25 +
      (offer.confidence ?? 78) * 0.2 +
      (adAngles.length >= 4 ? 86 : 68) * 0.15 +
      (creativeIdeas.length >= 4 ? 88 : 65) * 0.15 +
      average(platformRecommendations.map((entry) => entry.score)) * 0.15 +
      average(signals.map((signal) => signal.score)) * 0.1,
  );
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildSignals(
  brand: CampaignGenesisBrandInput,
  offer: CampaignGenesisOfferInput,
  adAngles: AdAngle[],
  creativeIdeas: CreativeIdea[],
  platformRecommendations: PlatformRecommendation[],
  confidence: number,
): CampaignGenesisSignal[] {
  return [
    buildSignal(
      "brand_alignment",
      brand.confidence,
      `Brand ${brand.brandName} aligned with ${offer.offerTitle}`,
    ),
    buildSignal(
      "audience_clarity",
      brand.targetAudience.length >= 20 ? 86 : 68,
      `Target audience ${brand.targetAudience.slice(0, 60)}`,
    ),
    buildSignal(
      "angle_strength",
      adAngles.length >= 4 ? 88 : 70,
      `${adAngles.length} ad angles generated`,
    ),
    buildSignal(
      "creative_coverage",
      creativeIdeas.length >= 4 ? 90 : 66,
      `${creativeIdeas.length} creative ideas across platforms`,
    ),
    buildSignal(
      "platform_fit",
      average(platformRecommendations.map((entry) => entry.score)),
      `Top platform ${platformRecommendations[0]!.platform} score ${platformRecommendations[0]!.score}`,
    ),
    buildSignal("campaign_composite", confidence, `Campaign confidence ${confidence}`),
  ];
}

/** Generates a launch marketing campaign from brand and offer inputs. */
export function generateMarketingCampaign(
  input: MarketingCampaignGenesisInput,
): MarketingCampaignGenesisBreakdown {
  const { brand, offer, storeId } = input;
  const campaignName = buildCampaignName(brand, offer);
  const targetAudience = buildTargetAudience(brand);
  const adAngles = buildAdAngles(brand, offer);
  const creativeIdeas = buildCreativeIdeas(brand, offer);
  const platformRecommendations = buildPlatformRecommendations(brand, offer);

  const provisionalSignals = buildSignals(
    brand,
    offer,
    adAngles,
    creativeIdeas,
    platformRecommendations,
    0,
  );
  const confidence = computeConfidence(
    brand,
    offer,
    adAngles,
    creativeIdeas,
    platformRecommendations,
    provisionalSignals,
  );
  const signals = buildSignals(
    brand,
    offer,
    adAngles,
    creativeIdeas,
    platformRecommendations,
    confidence,
  );

  return {
    brandId: brand.brandId,
    storeId: storeId ?? null,
    campaignName,
    targetAudience,
    adAngles,
    creativeIdeas,
    platformRecommendations,
    confidence,
    signals,
  };
}

export const marketingCampaignGenesisScoring = {
  generateMarketingCampaign,
  weights: CAMPAIGN_GENESIS_SIGNAL_WEIGHTS,
};
