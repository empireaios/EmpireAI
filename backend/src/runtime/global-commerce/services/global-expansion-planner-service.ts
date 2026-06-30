import { randomUUID } from "node:crypto";

import type { ExpansionPlanInput, GlobalExpansionPlan } from "../models/expansion-plan.js";
import { GLOBAL_COUNTRIES, GLOBAL_MARKETPLACE_PROVIDERS } from "../data/global-commerce-registry-data.js";
import { buildOrLoadGlobalCommerceIdentity } from "./global-commerce-identity-service.js";
import { computeOnboardingReadiness } from "./onboarding-readiness-service.js";
import { listRuntimePluginCoverage } from "./global-commerce-registry-service.js";
import { getGlobalCommerceRepository } from "../repositories/sqlite-global-commerce-repository.js";

const CATEGORY_COUNTRY_AFFINITY: Record<string, string[]> = {
  electronics: ["US", "SG", "JP", "KR", "DE", "GB"],
  fashion: ["US", "GB", "FR", "IN", "BR", "VN"],
  home: ["US", "DE", "AU", "GB", "MX"],
  beauty: ["US", "KR", "JP", "SG", "FR"],
  general: ["US", "SG", "GB", "AU", "MY"],
};

const PROFIT_TIER: Record<string, "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"> = {
  US: "VERY_HIGH", SG: "HIGH", GB: "HIGH", DE: "HIGH", AU: "HIGH",
  MY: "MEDIUM", TH: "MEDIUM", PH: "MEDIUM", VN: "MEDIUM", IN: "HIGH",
  JP: "HIGH", KR: "HIGH", BR: "MEDIUM", MX: "MEDIUM", ID: "MEDIUM",
  FR: "HIGH", CN: "VERY_HIGH", ZA: "MEDIUM", NG: "MEDIUM",
};

/** B-009 — Global Expansion Planner. */
export function createGlobalExpansionPlan(
  workspaceId: string,
  companyId: string,
  input: ExpansionPlanInput,
): GlobalExpansionPlan {
  const identity = buildOrLoadGlobalCommerceIdentity({ workspaceId, companyId });
  const pluginCoverage = listRuntimePluginCoverage();
  const affinity = CATEGORY_COUNTRY_AFFINITY[input.productCategory.toLowerCase()] ?? CATEGORY_COUNTRY_AFFINITY.general!;

  const scored = GLOBAL_COUNTRIES.map((country) => {
    const marketplaces = GLOBAL_MARKETPLACE_PROVIDERS.filter((p) => p.countryCode === country.countryCode);
    const onboarding = marketplaces.slice(0, 3).map((p) =>
      computeOnboardingReadiness(workspaceId, companyId, country.countryCode, p.providerId),
    );
    const avgReadiness = onboarding.length
      ? onboarding.reduce((s, o) => s + o.readinessScore, 0) / onboarding.length
      : 0;
    const hasPlugin = marketplaces.some((m) => m.runtimePluginId);
    const affinityBonus = affinity.includes(country.countryCode) ? 20 : 0;
    const supplierBonus = input.supplierAvailable ? 10 : 0;
    const readinessBonus = avgReadiness * 0.3;
    const marketplaceBonus = Math.min(15, marketplaces.length * 2);
    const pluginBonus = hasPlugin ? 5 : 0;
    const score = affinityBonus + supplierBonus + readinessBonus + marketplaceBonus + pluginBonus;

    return { country, marketplaces, onboarding, score, avgReadiness };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, input.maxCountries);

  const priorityCountries = scored.map((entry, index) => ({
    countryCode: entry.country.countryCode,
    displayName: entry.country.displayName,
    priorityRank: index + 1,
    priorityScore: Math.round(entry.score),
    why: buildWhy(entry.country.countryCode, entry.marketplaces.length, entry.avgReadiness, affinity.includes(entry.country.countryCode)),
    estimatedEffort: entry.avgReadiness >= 60 ? "LOW" as const : entry.avgReadiness >= 30 ? "MEDIUM" as const : "HIGH" as const,
    manualActionsRequired: entry.onboarding.flatMap((o) => o.humanActions).slice(0, 4),
    expectedProfitOpportunity: PROFIT_TIER[entry.country.countryCode] ?? "MEDIUM",
    priorityMarketplaces: entry.marketplaces.slice(0, 4).map((p) => {
      const ob = computeOnboardingReadiness(workspaceId, companyId, entry.country.countryCode, p.providerId);
      return {
        providerId: p.providerId,
        displayName: p.displayName,
        onboardingStatus: ob.status,
        hasRuntimePlugin: Boolean(p.runtimePluginId),
      };
    }),
    launchSequenceStep: index + 1,
  }));

  const plan: GlobalExpansionPlan = {
    planId: randomUUID(),
    workspaceId,
    companyId,
    productCategory: input.productCategory,
    priorityCountries,
    launchSequence: priorityCountries.map((c) => c.countryCode),
    globalSummary: `Expansion plan for ${input.productCategory}: ${priorityCountries.length} priority countries across ${GLOBAL_COUNTRIES.length} global markets. Runtime plugin coverage: ${pluginCoverage.map((p) => p.pluginId).join(", ") || "none"}.`,
    computedAt: new Date().toISOString(),
  };

  getGlobalCommerceRepository().saveExpansionPlan(plan);
  return plan;
}

function buildWhy(countryCode: string, marketplaceCount: number, readiness: number, categoryMatch: boolean): string {
  const parts = [`${marketplaceCount} marketplaces available`];
  if (categoryMatch) parts.push("strong category-market fit");
  if (readiness > 50) parts.push("existing account readiness");
  else parts.push("requires onboarding");
  return `${countryCode}: ${parts.join("; ")}`;
}

export function getLatestExpansionPlan(workspaceId: string, companyId: string): GlobalExpansionPlan | null {
  return getGlobalCommerceRepository().getLatestExpansionPlan(workspaceId, companyId);
}
