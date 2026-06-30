import type { GlobalCommerceIntelligenceDashboard } from "../models/intelligence-dashboard.js";
import { buildGlobalCommerceRegistry } from "../../global-commerce/index.js";
import { listCountryIntelligenceProfiles, getSeedCountryCount } from "./country-intelligence-service.js";
import { listExpansionIntelligenceScores } from "./expansion-intelligence-score-service.js";
import { getCountryIntelligenceProfile } from "./country-intelligence-service.js";
import { computeOnboardingReadiness } from "../../global-commerce/index.js";
import { getMarketplacesByCountry } from "../../global-commerce/services/global-commerce-registry-service.js";

/** B-015 — Mission Control Intelligence dashboard. */
export function buildGlobalCommerceIntelligenceDashboard(
  workspaceId: string,
  companyId: string,
): GlobalCommerceIntelligenceDashboard {
  const registry = buildGlobalCommerceRegistry();
  const scores = listExpansionIntelligenceScores(workspaceId, companyId);
  const profiles = listCountryIntelligenceProfiles();

  const topCountries = scores.slice(0, 5).map((s) => ({
    countryCode: s.countryCode,
    displayName: s.displayName,
    expansionScore: s.expansionScore,
    why: s.summary.split("—").pop()?.trim() ?? s.summary,
  }));

  const fastestExpansion = [...scores]
    .sort((a, b) => {
      const aComplex = getCountryIntelligenceProfile(a.countryCode)?.dimensions.regulatoryDifficulty ?? 50;
      const bComplex = getCountryIntelligenceProfile(b.countryCode)?.dimensions.regulatoryDifficulty ?? 50;
      return aComplex - bComplex;
    })
    .slice(0, 5)
    .map((s) => ({
      countryCode: s.countryCode,
      displayName: s.displayName,
      expectedTimeToLaunchDays: 14 + Math.round((100 - s.expansionScore) * 0.4),
    }));

  const highestRoi = scores
    .filter((s) => s.grade === "A" || s.grade === "B")
    .slice(0, 5)
    .map((s) => ({
      countryCode: s.countryCode,
      displayName: s.displayName,
      expectedRoi: s.grade === "A" ? "VERY_HIGH" : "HIGH",
    }));

  const highestAutomation = scores
    .map((s) => {
      const autoDim = s.dimensions.find((d) => d.dimensionId === "automation_potential");
      return {
        countryCode: s.countryCode,
        displayName: s.displayName,
        automationPotential: autoDim?.rawScore ?? 0,
      };
    })
    .sort((a, b) => b.automationPotential - a.automationPotential)
    .slice(0, 5);

  const highestRisk = profiles
    .map((p) => ({
      countryCode: p.countryCode,
      displayName: p.displayName,
      risk: p.dimensions.regulatoryDifficulty >= 70 ? "VERY_HIGH" : p.dimensions.regulatoryDifficulty >= 55 ? "HIGH" : "MEDIUM",
    }))
    .filter((r) => r.risk === "VERY_HIGH" || r.risk === "HIGH")
    .slice(0, 5);

  const highestCompetition = profiles
    .map((p) => ({
      countryCode: p.countryCode,
      displayName: p.displayName,
      competitionIntensity: p.dimensions.competitionIntensity,
    }))
    .sort((a, b) => b.competitionIntensity - a.competitionIntensity)
    .slice(0, 5);

  const globalOpportunityHeatmap = scores.map((s) => {
    const intel = getCountryIntelligenceProfile(s.countryCode);
    const autoDim = s.dimensions.find((d) => d.dimensionId === "automation_potential");
    const profitDim = s.dimensions.find((d) => d.dimensionId === "profit_potential");
    const riskDim = s.dimensions.find((d) => d.dimensionId === "risk");
    return {
      countryCode: s.countryCode,
      displayName: s.displayName,
      expansionScore: s.expansionScore,
      profitPotential: profitDim?.rawScore ?? 50,
      risk: 100 - (riskDim?.rawScore ?? 50),
      competition: intel?.dimensions.competitionIntensity ?? 50,
      automationPotential: autoDim?.rawScore ?? 50,
    };
  });

  const expansionReadinessTimeline = scores.slice(0, 8).map((s) => {
    const readiness = s.dimensions.find((d) => d.dimensionId === "account_readiness")?.rawScore ?? 0;
    return {
      countryCode: s.countryCode,
      displayName: s.displayName,
      readinessPercent: readiness,
      estimatedLaunchWeeks: Math.max(1, Math.round((100 - s.expansionScore) / 10)),
      phase: readiness >= 70 ? "READY" as const : readiness >= 40 ? "NEAR_READY" as const : readiness > 0 ? "IN_PROGRESS" as const : "BLOCKED" as const,
    };
  });

  const recommendedNextCountry = topCountries[0]
    ? { countryCode: topCountries[0].countryCode, displayName: topCountries[0].displayName, expansionScore: topCountries[0].expansionScore, why: topCountries[0].why }
    : null;

  let recommendedNextMarketplace: GlobalCommerceIntelligenceDashboard["recommendedNextMarketplace"] = null;
  if (recommendedNextCountry) {
    const marketplaces = getMarketplacesByCountry(recommendedNextCountry.countryCode);
    for (const mp of marketplaces) {
      const onboarding = computeOnboardingReadiness(workspaceId, companyId, recommendedNextCountry.countryCode, mp.providerId);
      if (onboarding.status !== "READY" && onboarding.status !== "BLOCKED") {
        recommendedNextMarketplace = {
          providerId: mp.providerId,
          displayName: mp.displayName,
          countryCode: recommendedNextCountry.countryCode,
          why: `${onboarding.status.replace(/_/g, " ").toLowerCase()} — score ${onboarding.readinessScore}`,
        };
        break;
      }
    }
  }

  if (recommendedNextCountry && !recommendedNextMarketplace) {
    const marketplaces = getMarketplacesByCountry(recommendedNextCountry.countryCode);
    const mp = marketplaces[0];
    if (mp) {
      recommendedNextMarketplace = {
        providerId: mp.providerId,
        displayName: mp.displayName,
        countryCode: recommendedNextCountry.countryCode,
        why: "Highest-priority marketplace in top expansion country",
      };
    }
  }

  return {
    moduleId: "global-commerce-intelligence",
    missionId: "B-011-B-015",
    topCountries,
    fastestExpansion,
    highestRoi,
    highestAutomation,
    highestRisk,
    highestCompetition,
    globalOpportunityHeatmap,
    expansionReadinessTimeline,
    recommendedNextCountry,
    recommendedNextMarketplace,
    intelligenceCoverage: {
      countriesEvaluated: scores.length,
      seedCountries: getSeedCountryCount(),
      registryCountries: registry.totals.countries,
    },
    computedAt: new Date().toISOString(),
  };
}

export function buildEsisGlobalCommerceIntelligencePayload(workspaceId: string, companyId: string) {
  const dash = buildGlobalCommerceIntelligenceDashboard(workspaceId, companyId);
  return {
    module: "global-commerce-intelligence",
    countriesEvaluated: dash.intelligenceCoverage.countriesEvaluated,
    topCountry: dash.topCountries[0]?.countryCode ?? null,
    heatmapEntries: dash.globalOpportunityHeatmap.length,
  };
}
