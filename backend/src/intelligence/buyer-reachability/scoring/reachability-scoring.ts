import type { BuyerPersonaProfile } from "../../buyer-intelligence/persona-intelligence/contracts/buyer-persona-profile.js";
import {
  CHANNEL_TYPE_BY_NAME,
  REACHABILITY_CHANNEL_NAMES,
  type ReachabilityChannel,
  type ReachabilityChannelName,
} from "../models/reachability-channel.js";
import type { ReachabilityDimensions } from "../models/reachability-profile.js";
import type { ReachabilitySignal, ReachabilitySignalType } from "../models/reachability-signal.js";

export const REACHABILITY_SIGNAL_WEIGHTS: Record<ReachabilitySignalType, number> = {
  platform_preference: 0.25,
  interest_fit: 0.2,
  age_fit: 0.15,
  search_behavior: 0.2,
  urgency: 0.1,
  spending_power: 0.1,
};

const CHANNEL_PLATFORM_HINTS: Record<ReachabilityChannelName, string[]> = {
  "Google Search": ["web", "google", "search"],
  Amazon: ["amazon", "marketplace"],
  TikTok: ["tiktok", "social"],
  Instagram: ["instagram", "social"],
  Pinterest: ["pinterest", "social"],
  Reddit: ["reddit", "community"],
  YouTube: ["youtube", "video"],
  "Facebook Groups": ["facebook", "community", "groups"],
  "AI Search": ["ai", "chatgpt", "perplexity"],
  Forums: ["forum", "community", "niche"],
};

const CHANNEL_INTEREST_HINTS: Record<ReachabilityChannelName, string[]> = {
  "Google Search": ["research", "reviews", "comparison"],
  Amazon: ["shopping", "deals", "product research"],
  TikTok: ["trending", "viral", "gadgets", "beauty"],
  Instagram: ["lifestyle", "self care", "wellness", "beauty"],
  Pinterest: ["cooking", "decor", "organization", "home"],
  Reddit: ["tech", "gadgets", "niche", "community"],
  YouTube: ["reviews", "how-to", "cooking", "fitness"],
  "Facebook Groups": ["community", "home", "parenting", "local"],
  "AI Search": ["research", "comparison", "productivity"],
  Forums: ["niche", "hobby", "support", "enthusiast"],
};

export type ReachabilityScoreBreakdown = {
  dimensions: ReachabilityDimensions;
  channels: ReachabilityChannel[];
  topChannels: string[];
  confidence: number;
  signals: ReachabilitySignal[];
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function parseAgeMidpoint(ageRange: string): number {
  const matches = ageRange.match(/(\d+)\s*-\s*(\d+)/);
  if (!matches) return 35;
  return (Number(matches[1]) + Number(matches[2])) / 2;
}

function buildSignal(
  signalType: ReachabilitySignalType,
  score: number,
  detail: string,
): ReachabilitySignal {
  return {
    signalType,
    score: clampScore(score),
    weight: REACHABILITY_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function scorePlatformPreference(persona: BuyerPersonaProfile): ReachabilitySignal {
  const platformCount = persona.preferredPlatforms.length;
  const diversityScore = Math.min(100, 40 + platformCount * 15);
  return buildSignal(
    "platform_preference",
    diversityScore,
    `Persona prefers ${platformCount} platform(s): ${persona.preferredPlatforms.join(", ") || "none"}`,
  );
}

function scoreInterestFit(persona: BuyerPersonaProfile): ReachabilitySignal {
  const breadth = Math.min(100, 35 + persona.interests.length * 12);
  return buildSignal(
    "interest_fit",
    breadth,
    `Interest breadth across ${persona.interests.length} topics`,
  );
}

function scoreAgeFit(persona: BuyerPersonaProfile): ReachabilitySignal {
  const midpoint = parseAgeMidpoint(persona.ageRange);
  let score = 60;
  if (midpoint <= 28) score = 85;
  else if (midpoint <= 38) score = 75;
  else if (midpoint <= 48) score = 65;
  else score = 55;

  return buildSignal("age_fit", score, `Age midpoint ${midpoint} for range ${persona.ageRange}`);
}

function scoreSearchBehavior(persona: BuyerPersonaProfile): ReachabilitySignal {
  const patternScore = Math.min(100, 30 + persona.searchPatterns.length * 18);
  return buildSignal(
    "search_behavior",
    patternScore,
    `${persona.searchPatterns.length} active search patterns`,
  );
}

function scoreUrgency(persona: BuyerPersonaProfile): ReachabilitySignal {
  const urgencyMap = { low: 35, medium: 55, high: 78, critical: 92 };
  return buildSignal(
    "urgency",
    urgencyMap[persona.urgencyLevel],
    `Urgency level ${persona.urgencyLevel}`,
  );
}

function scoreSpendingPower(persona: BuyerPersonaProfile): ReachabilitySignal {
  const spendingMap = { budget: 40, moderate: 60, premium: 78, luxury: 90 };
  return buildSignal(
    "spending_power",
    spendingMap[persona.spendingPower],
    `Spending power ${persona.spendingPower}`,
  );
}

function channelPlatformFit(persona: BuyerPersonaProfile, channel: ReachabilityChannelName): number {
  const hints = CHANNEL_PLATFORM_HINTS[channel];
  const platforms = persona.preferredPlatforms.map(normalize);
  const matches = hints.filter((hint) => platforms.some((platform) => platform.includes(hint)));
  return clampScore(35 + matches.length * 25);
}

function channelInterestFit(persona: BuyerPersonaProfile, channel: ReachabilityChannelName): number {
  const hints = CHANNEL_INTEREST_HINTS[channel];
  const interests = persona.interests.map(normalize);
  const matches = hints.filter((hint) =>
    interests.some((interest) => interest.includes(hint) || hint.includes(interest)),
  );
  return clampScore(30 + matches.length * 18);
}

function channelAgeFit(persona: BuyerPersonaProfile, channel: ReachabilityChannelName): number {
  const midpoint = parseAgeMidpoint(persona.ageRange);
  const socialChannels: ReachabilityChannelName[] = ["TikTok", "Instagram"];
  const researchChannels: ReachabilityChannelName[] = ["Google Search", "AI Search", "YouTube"];
  const communityChannels: ReachabilityChannelName[] = ["Facebook Groups", "Forums", "Reddit"];

  if (socialChannels.includes(channel)) {
    return midpoint <= 34 ? 85 : midpoint <= 44 ? 65 : 45;
  }
  if (researchChannels.includes(channel)) {
    return midpoint >= 25 ? 80 : 60;
  }
  if (communityChannels.includes(channel)) {
    return midpoint >= 30 ? 75 : 55;
  }
  if (channel === "Amazon") return 70;
  if (channel === "Pinterest") return midpoint >= 25 && midpoint <= 50 ? 82 : 58;
  return 60;
}

function channelSearchFit(persona: BuyerPersonaProfile, channel: ReachabilityChannelName): number {
  const patterns = persona.searchPatterns.map(normalize).join(" ");
  if (channel === "Google Search" || channel === "AI Search") {
    return patterns.length > 0 ? 85 : 45;
  }
  if (channel === "Amazon") {
    return patterns.includes("best") || patterns.includes("review") ? 78 : 62;
  }
  if (channel === "YouTube") {
    return patterns.includes("review") || patterns.includes("how") ? 80 : 55;
  }
  return 50;
}

function scoreChannelOrganic(persona: BuyerPersonaProfile, channel: ReachabilityChannelName): number {
  const fit =
    channelPlatformFit(persona, channel) * 0.35 +
    channelInterestFit(persona, channel) * 0.25 +
    channelAgeFit(persona, channel) * 0.2 +
    channelSearchFit(persona, channel) * 0.2;
  const organicChannels: ReachabilityChannelName[] = [
    "Google Search",
    "YouTube",
    "Pinterest",
    "Reddit",
    "Forums",
  ];
  const boost = organicChannels.includes(channel) ? 8 : 0;
  return clampScore(fit + boost);
}

function scoreChannelPaid(persona: BuyerPersonaProfile, channel: ReachabilityChannelName): number {
  const spendingMap = { budget: 35, moderate: 55, premium: 75, luxury: 88 };
  const paidChannels: ReachabilityChannelName[] = [
    "Google Search",
    "Amazon",
    "TikTok",
    "Instagram",
    "Facebook Groups",
  ];
  const base = spendingMap[persona.spendingPower];
  const channelBoost = paidChannels.includes(channel) ? 12 : 0;
  const urgencyBoost = persona.urgencyLevel === "high" || persona.urgencyLevel === "critical" ? 10 : 0;
  return clampScore(base + channelBoost + urgencyBoost);
}

function expectedChannelCostCents(
  persona: BuyerPersonaProfile,
  channel: ReachabilityChannelName,
  paidScore: number,
): number {
  const baseCostMap: Record<ReachabilityChannelName, number> = {
    "Google Search": 250,
    Amazon: 180,
    TikTok: 120,
    Instagram: 150,
    Pinterest: 110,
    Reddit: 90,
    YouTube: 200,
    "Facebook Groups": 100,
    "AI Search": 160,
    Forums: 60,
  };
  const spendingMultiplier = { budget: 0.7, moderate: 1, premium: 1.35, luxury: 1.7 };
  const paidFactor = 1 + (100 - paidScore) / 200;
  return Math.round(baseCostMap[channel] * spendingMultiplier[persona.spendingPower] * paidFactor);
}

function buildDimensions(
  persona: BuyerPersonaProfile,
  channels: ReachabilityChannel[],
  signals: ReachabilitySignal[],
): ReachabilityDimensions {
  const organicReach = clampScore(
    channels.reduce((total, channel) => total + channel.organicScore, 0) / channels.length,
  );
  const paidReach = clampScore(
    channels.reduce((total, channel) => total + channel.paidScore, 0) / channels.length,
  );
  const communityReach = clampScore(
    averageScore(
      channels.filter((channel) =>
        ["Reddit", "Facebook Groups", "Forums"].includes(channel.channelName),
      ),
    ),
  );
  const marketplaceReach = clampScore(
    channels.find((channel) => channel.channelName === "Amazon")?.overallReachScore ?? 50,
  );
  const searchReach = clampScore(
    averageScore(
      channels.filter((channel) =>
        ["Google Search", "AI Search"].includes(channel.channelName),
      ),
    ),
  );
  const socialReach = clampScore(
    averageScore(
      channels.filter((channel) =>
        ["TikTok", "Instagram", "Pinterest", "YouTube"].includes(channel.channelName),
      ),
    ),
  );
  const aiSearchReach = clampScore(
    channels.find((channel) => channel.channelName === "AI Search")?.overallReachScore ?? 40,
  );

  const urgencySignal = signals.find((signal) => signal.signalType === "urgency")?.score ?? 50;
  const contentDifficulty = clampScore(100 - organicReach * 0.6 - urgencySignal * 0.2);
  const competitionLevel = clampScore(paidReach * 0.45 + marketplaceReach * 0.35 + 20);
  const expectedCost = Math.round(
    channels.reduce((total, channel) => total + channel.expectedCostCents, 0) / channels.length,
  );

  return {
    organicReach,
    paidReach,
    communityReach,
    marketplaceReach,
    searchReach,
    socialReach,
    aiSearchReach,
    contentDifficulty,
    competitionLevel,
    expectedCost,
  };
}

function averageScore(channels: ReachabilityChannel[]): number {
  if (channels.length === 0) return 0;
  return channels.reduce((total, channel) => total + channel.overallReachScore, 0) / channels.length;
}

function computeConfidence(persona: BuyerPersonaProfile, signals: ReachabilitySignal[]): number {
  const signalAverage =
    signals.reduce((total, signal) => total + signal.score, 0) / Math.max(signals.length, 1);
  return clampScore(signalAverage * 0.65 + persona.confidence * 0.35);
}

function rankChannels(channels: ReachabilityChannel[]): ReachabilityChannel[] {
  return [...channels]
    .sort(
      (left, right) =>
        right.overallReachScore - left.overallReachScore ||
        right.confidence - left.confidence,
    )
    .map((channel, index) => ({ ...channel, rank: index + 1 }));
}

/** Computes reachability dimensions and channel rankings for a buyer persona. */
export function scoreBuyerReachability(persona: BuyerPersonaProfile): ReachabilityScoreBreakdown {
  const signals = [
    scorePlatformPreference(persona),
    scoreInterestFit(persona),
    scoreAgeFit(persona),
    scoreSearchBehavior(persona),
    scoreUrgency(persona),
    scoreSpendingPower(persona),
  ];
  const confidence = computeConfidence(persona, signals);

  const channels = rankChannels(
    REACHABILITY_CHANNEL_NAMES.map((channelName) => {
      const organicScore = scoreChannelOrganic(persona, channelName);
      const paidScore = scoreChannelPaid(persona, channelName);
      const overallReachScore = clampScore(organicScore * 0.55 + paidScore * 0.45);
      return {
        channelName,
        channelType: CHANNEL_TYPE_BY_NAME[channelName],
        organicScore,
        paidScore,
        overallReachScore,
        expectedCostCents: expectedChannelCostCents(persona, channelName, paidScore),
        confidence,
        rank: 0,
      };
    }),
  );

  const dimensions = buildDimensions(persona, channels, signals);
  const topChannels = channels.slice(0, 3).map((channel) => channel.channelName);

  return {
    dimensions,
    channels,
    topChannels,
    confidence,
    signals,
  };
}

export const reachabilityScoring = {
  scoreBuyerReachability,
  weights: REACHABILITY_SIGNAL_WEIGHTS,
};
