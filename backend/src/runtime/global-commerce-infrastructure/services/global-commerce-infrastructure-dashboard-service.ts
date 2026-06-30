import type { GlobalCommerceInfrastructureDashboard } from "../models/infrastructure-dashboard.js";
import { listCountryInfrastructureProfiles } from "./infrastructure-model-service.js";
import { computeInfrastructureReadiness, listInfrastructureReadiness } from "./infrastructure-readiness-service.js";
import { buildExpansionDependencyGraph } from "./expansion-dependency-graph-service.js";
import { countSeededProviderDependencies } from "./infrastructure-dependency-service.js";
import { INFRASTRUCTURE_LAYER_DEFINITIONS } from "../models/infrastructure-model.js";

/** D-005 — Mission Control Infrastructure dashboard. */
export function buildGlobalCommerceInfrastructureDashboard(
  workspaceId: string,
  companyId: string,
): GlobalCommerceInfrastructureDashboard {
  const profiles = listCountryInfrastructureProfiles();
  const readinessList = listInfrastructureReadiness(workspaceId, companyId);

  const avgScore = readinessList.length
    ? Math.round(readinessList.reduce((s, r) => s + r.infrastructureScore, 0) / readinessList.length)
    : 0;

  const readyCount = readinessList.filter((r) => r.readinessPhase === "READY").length;
  const nearlyCount = readinessList.filter((r) => r.readinessPhase === "NEARLY_READY").length;
  const blockedCount = readinessList.filter((r) => r.readinessPhase === "BLOCKED").length;

  let infrastructureReadiness: GlobalCommerceInfrastructureDashboard["infrastructureReadiness"] = "MIXED";
  if (readyCount > readinessList.length * 0.5) infrastructureReadiness = "READY";
  else if (blockedCount > readinessList.length * 0.4) infrastructureReadiness = "BLOCKED";
  else if (nearlyCount > readyCount) infrastructureReadiness = "NEARLY_READY";
  else if (avgScore >= 50) infrastructureReadiness = "IN_PROGRESS";

  const criticalMissingPieces = readinessList
    .filter((r) => r.criticalBlockers.length > 0)
    .slice(0, 5)
    .map((r) => ({
      countryCode: r.countryCode,
      displayName: r.displayName,
      blockers: r.criticalBlockers.slice(0, 3),
    }));

  const countriesReady = readinessList
    .filter((r) => r.readinessPhase === "READY")
    .slice(0, 5)
    .map((r) => ({ countryCode: r.countryCode, displayName: r.displayName, score: r.infrastructureScore }));

  const countriesNearlyReady = readinessList
    .filter((r) => r.readinessPhase === "NEARLY_READY")
    .slice(0, 5)
    .map((r) => ({ countryCode: r.countryCode, displayName: r.displayName, score: r.infrastructureScore }));

  const infrastructureHeatmap = readinessList.map((r) => ({
    countryCode: r.countryCode,
    displayName: r.displayName,
    infrastructureScore: r.infrastructureScore,
    readinessPhase: r.readinessPhase,
    criticalBlockers: r.criticalBlockers.length,
    automationPotential: r.automationPotential,
  }));

  const expansionDependencies = readinessList.slice(0, 8).map((r) => {
    const graph = buildExpansionDependencyGraph(workspaceId, companyId, r.countryCode);
    return {
      countryCode: r.countryCode,
      displayName: r.displayName,
      stepCount: graph?.nodes.length ?? 0,
      ready: graph?.nodes.find((n) => n.nodeType === "ready")?.status === "READY",
    };
  });

  const topNearly = countriesNearlyReady[0] ?? countriesReady[0];
  const recommendedNextCountry = topNearly
    ? {
        countryCode: topNearly.countryCode,
        displayName: topNearly.displayName,
        score: topNearly.score,
        why: `Infrastructure score ${topNearly.score} — nearest to sell-ready`,
      }
    : readinessList[0]
      ? {
          countryCode: readinessList[0].countryCode,
          displayName: readinessList[0].displayName,
          score: readinessList[0].infrastructureScore,
          why: "Highest infrastructure readiness in evaluated set",
        }
      : null;

  return {
    moduleId: "global-commerce-infrastructure",
    missionId: "D-001-D-005",
    infrastructureScore: avgScore,
    infrastructureReadiness,
    criticalMissingPieces,
    infrastructureCoverage: {
      countriesEvaluated: profiles.length,
      layersTracked: INFRASTRUCTURE_LAYER_DEFINITIONS.length,
      providersWithDependencies: countSeededProviderDependencies(),
    },
    expansionDependencies,
    countriesReady,
    countriesNearlyReady,
    infrastructureHeatmap,
    recommendedNextCountry,
    computedAt: new Date().toISOString(),
  };
}

export function buildEsisGlobalCommerceInfrastructurePayload(workspaceId: string, companyId: string) {
  const dash = buildGlobalCommerceInfrastructureDashboard(workspaceId, companyId);
  return {
    module: "global-commerce-infrastructure",
    infrastructureScore: dash.infrastructureScore,
    countriesEvaluated: dash.infrastructureCoverage.countriesEvaluated,
    countriesReady: dash.countriesReady.length,
  };
}
