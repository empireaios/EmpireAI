import { randomUUID } from "node:crypto";

import type { OpportunityRankingInput, OpportunityRankingResult, RankedCountry, RankedMarketplace } from "../models/opportunity-ranking.js";
import { OpportunityRankingInputSchema } from "../models/opportunity-ranking.js";
import {
  buildGlobalCommerceRegistry,
  computeOnboardingReadiness,
  getMarketplacesByCountry,
} from "../../global-commerce/index.js";
import { computeExpansionIntelligenceScore } from "./expansion-intelligence-score-service.js";
import { getCountryIntelligenceProfile } from "./country-intelligence-service.js";
import { getGlobalCommerceIntelligenceRepository } from "../repositories/sqlite-global-commerce-intelligence-repository.js";

const CATEGORY_AFFINITY: Record<string, string[]> = {
  electronics: ["US", "SG", "JP", "KR", "DE", "GB"],
  fashion: ["US", "GB", "FR", "IN", "BR", "VN"],
  home: ["US", "DE", "AU", "GB", "MX"],
  beauty: ["US", "KR", "JP", "SG", "FR"],
  general: ["US", "SG", "GB", "AU", "MY"],
};

const ROI_TIER: Record<string, RankedCountry["expectedRoi"]> = {
  US: "VERY_HIGH", SG: "HIGH", GB: "HIGH", DE: "HIGH", AU: "HIGH",
  MY: "MEDIUM", TH: "MEDIUM", PH: "MEDIUM", VN: "MEDIUM", IN: "HIGH",
  JP: "HIGH", KR: "HIGH", BR: "MEDIUM", MX: "MEDIUM", ID: "MEDIUM",
  FR: "HIGH", CN: "VERY_HIGH", ZA: "MEDIUM", NG: "MEDIUM",
};

function riskFromScore(score: number, regulatory: number): RankedCountry["risk"] {
  const combined = (100 - score) * 0.5 + regulatory * 0.5;
  if (combined >= 75) return "VERY_HIGH";
  if (combined >= 55) return "HIGH";
  if (combined >= 35) return "MEDIUM";
  return "LOW";
}

function effortFromReadiness(readiness: number): RankedCountry["effort"] {
  if (readiness >= 70) return "LOW";
  if (readiness >= 40) return "MEDIUM";
  return "HIGH";
}

function estimateLaunchDays(readiness: number, complexity: number): number {
  const base = 14 + complexity * 0.3;
  const readinessFactor = (100 - readiness) * 0.5;
  return Math.round(base + readinessFactor);
}

function estimateManualHours(effort: RankedCountry["effort"], marketplaceCount: number): number {
  const base = effort === "LOW" ? 8 : effort === "MEDIUM" ? 24 : 48;
  return base + marketplaceCount * 4;
}

function buildCountryWhy(
  countryCode: string,
  expansionScore: number,
  category: string,
  affinity: boolean,
): string {
  const intel = getCountryIntelligenceProfile(countryCode);
  const parts: string[] = [];
  if (affinity) parts.push(`strong ${category} category fit`);
  if (expansionScore >= 75) parts.push("high expansion intelligence score");
  if (intel && intel.dimensions.marketGrowth >= 80) parts.push("rapid market growth");
  if (intel && intel.dimensions.crossBorderFriendliness >= 75) parts.push("cross-border friendly");
  return parts.length ? parts.join("; ") : "balanced expansion opportunity";
}

function rankMarketplaces(
  workspaceId: string,
  companyId: string,
  countryCode: string,
  max: number,
  category: string,
): RankedMarketplace[] {
  const marketplaces = getMarketplacesByCountry(countryCode);
  return marketplaces
    .map((mp, index) => {
      const onboarding = computeOnboardingReadiness(workspaceId, companyId, countryCode, mp.providerId);
      const score = Math.round(onboarding.readinessScore * 0.4 + (mp.runtimePluginId ? 30 : 10) + (100 - index * 5) * 0.3);
      const effort = effortFromReadiness(onboarding.readinessScore);
      const roi = ROI_TIER[countryCode] ?? "MEDIUM";
      return {
        providerId: mp.providerId,
        displayName: mp.displayName,
        countryCode,
        rank: 0,
        score,
        why: `${mp.displayName}: ${onboarding.status.toLowerCase().replace(/_/g, " ")} for ${category}`,
        confidence: Math.min(95, Math.round(score * 0.85 + 10)),
        risk: riskFromScore(onboarding.readinessScore, getCountryIntelligenceProfile(countryCode)?.dimensions.regulatoryDifficulty ?? 50),
        effort,
        expectedRoi: roi,
        expectedTimeToLaunchDays: estimateLaunchDays(onboarding.readinessScore, getCountryIntelligenceProfile(countryCode)?.dimensions.regulatoryDifficulty ?? 50),
        expectedManualWorkHours: estimateManualHours(effort, 1),
        hasRuntimePlugin: Boolean(mp.runtimePluginId),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((m, i) => ({ ...m, rank: i + 1 }));
}

/** B-014 — Opportunity Ranking Engine. */
export function rankGlobalOpportunities(
  workspaceId: string,
  companyId: string,
  input: OpportunityRankingInput,
): OpportunityRankingResult {
  const parsed = OpportunityRankingInputSchema.parse(input);
  const registry = buildGlobalCommerceRegistry();
  const category = parsed.productCategory.toLowerCase();
  const affinity = CATEGORY_AFFINITY[category] ?? CATEGORY_AFFINITY.general!;

  const scored = registry.countries.map((country) => {
    const expansion = computeExpansionIntelligenceScore(workspaceId, companyId, country.countryCode);
    const expansionScore = expansion?.expansionScore ?? 40;
    const affinityBonus = affinity.includes(country.countryCode) ? 15 : 0;
    const supplierBonus = parsed.supplierAvailable ? 8 : 0;
    const langBonus = parsed.preferredLanguages?.some((l) => country.languages.includes(l)) ? 5 : 0;
    const totalScore = expansionScore + affinityBonus + supplierBonus + langBonus;
    const marketplaces = rankMarketplaces(
      workspaceId,
      companyId,
      country.countryCode,
      parsed.maxMarketplacesPerCountry,
      category,
    );
    const avgReadiness = marketplaces.length
      ? marketplaces.reduce((s, m) => s + m.score, 0) / marketplaces.length
      : 0;

    return { country, expansionScore, totalScore, marketplaces, avgReadiness };
  })
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, parsed.maxCountries);

  const rankedCountries: RankedCountry[] = scored.map((entry, index) => {
    const intel = getCountryIntelligenceProfile(entry.country.countryCode);
    const readiness = entry.avgReadiness;
    const effort = effortFromReadiness(readiness);
    const roi = ROI_TIER[entry.country.countryCode] ?? "MEDIUM";
    const regulatory = intel?.dimensions.regulatoryDifficulty ?? 50;

    return {
      countryCode: entry.country.countryCode,
      displayName: entry.country.displayName,
      rank: index + 1,
      expansionScore: entry.expansionScore,
      why: buildCountryWhy(entry.country.countryCode, entry.expansionScore, category, affinity.includes(entry.country.countryCode)),
      confidence: Math.min(95, Math.round(entry.totalScore * 0.9)),
      risk: riskFromScore(entry.expansionScore, regulatory),
      effort,
      expectedRoi: roi,
      expectedTimeToLaunchDays: estimateLaunchDays(readiness, regulatory),
      expectedManualWorkHours: estimateManualHours(effort, entry.marketplaces.length),
      launchOrder: index + 1,
      priorityMarketplaces: entry.marketplaces,
    };
  });

  const result: OpportunityRankingResult = {
    rankingId: randomUUID(),
    workspaceId,
    companyId,
    productCategory: parsed.productCategory,
    rankedCountries,
    launchSequence: rankedCountries.map((c) => c.countryCode),
    globalSummary: `Ranked ${rankedCountries.length} countries for ${parsed.productCategory}; top: ${rankedCountries[0]?.displayName ?? "none"}`,
    computedAt: new Date().toISOString(),
  };

  getGlobalCommerceIntelligenceRepository().saveRanking(result);
  return result;
}

export function getLatestOpportunityRanking(
  workspaceId: string,
  companyId: string,
): OpportunityRankingResult | null {
  return getGlobalCommerceIntelligenceRepository().getLatestRanking(workspaceId, companyId);
}
