import type { GlobalCommerceIdentity } from "../models/global-identity.js";
import { buildPluginRegistrySnapshot } from "../../commerce-runtime/services/plugin-dispatch-service.js";
import { buildGlobalCommerceRegistry, listRuntimePluginCoverage } from "./global-commerce-registry-service.js";
import { buildOrLoadGlobalCommerceIdentity, summarizeIdentityFootprint } from "./global-commerce-identity-service.js";
import { computeCountryOnboardingBatch } from "./onboarding-readiness-service.js";
import { getLatestExpansionPlan } from "./global-expansion-planner-service.js";

/** B-010 — Mission Control global commerce dashboard payload. */
export function buildGlobalCommerceDashboard(workspaceId: string, companyId: string) {
  const registry = buildGlobalCommerceRegistry();
  const identity = buildOrLoadGlobalCommerceIdentity({ workspaceId, companyId });
  const footprint = summarizeIdentityFootprint(identity);
  const expansion = getLatestExpansionPlan(workspaceId, companyId);
  const pluginSnapshot = buildPluginRegistrySnapshot();
  const pluginCoverage = listRuntimePluginCoverage();

  const countriesReady = identity.countryReadiness.filter((c) => c.readinessScore >= 70);
  const countriesBlocked = identity.countryReadiness.filter((c) => c.readinessScore === 0);

  const sgOnboarding = computeCountryOnboardingBatch(workspaceId, companyId, "SG");
  const usOnboarding = computeCountryOnboardingBatch(workspaceId, companyId, "US");

  const nextUnlock = identity.countryReadiness
    .filter((c) => c.readinessScore > 0 && c.readinessScore < 70)
    .sort((a, b) => b.readinessScore - a.readinessScore)[0];

  const nextMarketplace = [...sgOnboarding, ...usOnboarding]
    .filter((o) => o.status !== "READY" && o.status !== "BLOCKED")
    .sort((a, b) => b.readinessScore - a.readinessScore)[0];

  const profitExpansion = expansion?.priorityCountries
    .filter((c) => c.expectedProfitOpportunity === "HIGH" || c.expectedProfitOpportunity === "VERY_HIGH")
    .length ?? 0;

  return {
    moduleId: "global-commerce" as const,
    missionId: "B-006-B-010" as const,
    globalCommerceFootprint: {
      regions: registry.totals.regions,
      countries: registry.totals.countries,
      marketplaces: registry.totals.marketplaces,
    },
    countriesReady: countriesReady.map((c) => ({ countryCode: c.countryCode, score: c.readinessScore })),
    countriesBlocked: countriesBlocked.map((c) => c.countryCode),
    marketplacesConnected: footprint.connectedMarketplaces,
    marketplacesPending: footprint.pendingMarketplaces,
    nextCountryToUnlock: nextUnlock
      ? { countryCode: nextUnlock.countryCode, readinessScore: nextUnlock.readinessScore }
      : null,
    nextMarketplaceToConnect: nextMarketplace
      ? { providerId: nextMarketplace.providerId, displayName: nextMarketplace.displayName, status: nextMarketplace.status }
      : null,
    humanActionsRequired: identity.humanActionsRequired,
    globalExpansionOpportunity: expansion
      ? { planId: expansion.planId, priorityCountryCount: expansion.priorityCountries.length, launchSequence: expansion.launchSequence }
      : null,
    potentialProfitExpansion: profitExpansion,
    runtimePluginCoverage: pluginCoverage,
    registeredPlugins: pluginSnapshot.plugins.map((p) => ({
      pluginId: p.pluginId,
      displayName: p.displayName,
      certificationState: p.certificationState,
      countriesCovered: pluginCoverage.find((c) => c.pluginId === p.pluginId)?.countries.length ?? 0,
    })),
    runtimeHealth: {
      executionBlocked: true,
      pluginCount: pluginSnapshot.plugins.length,
    },
    sampleOnboarding: {
      SG: sgOnboarding.slice(0, 3),
      US: usOnboarding.slice(0, 3),
    },
    computedAt: new Date().toISOString(),
  };
}

export function buildEsisGlobalCommercePayload(workspaceId: string, companyId: string) {
  const dash = buildGlobalCommerceDashboard(workspaceId, companyId);
  return {
    module: "global-commerce",
    countries: dash.globalCommerceFootprint.countries,
    marketplaces: dash.globalCommerceFootprint.marketplaces,
    countriesReady: dash.countriesReady.length,
    countriesBlocked: dash.countriesBlocked.length,
    pluginCoverage: dash.runtimePluginCoverage.length,
  };
}
