import type { InfrastructureReadiness } from "../models/infrastructure-readiness.js";
import { buildCountryInfrastructureProfile } from "./infrastructure-model-service.js";
import { listProviderDependenciesForCountry } from "./infrastructure-dependency-service.js";
import { buildGlobalCommerceRegistry, buildOrLoadGlobalCommerceIdentity } from "../../global-commerce/index.js";
import { computeExpansionIntelligenceScore } from "../../global-commerce-intelligence/index.js";

function derivePhase(score: number, blockers: number): InfrastructureReadiness["readinessPhase"] {
  if (blockers > 2) return "BLOCKED";
  if (score >= 75) return "READY";
  if (score >= 55) return "NEARLY_READY";
  return "IN_PROGRESS";
}

/** D-003 — Infrastructure Readiness Engine. */
export function computeInfrastructureReadiness(
  workspaceId: string,
  companyId: string,
  countryCode: string,
): InfrastructureReadiness | null {
  const profile = buildCountryInfrastructureProfile(countryCode);
  if (!profile) return null;

  const identity = buildOrLoadGlobalCommerceIdentity({ workspaceId, companyId });
  const countryReadiness = identity.countryReadiness.find((c) => c.countryCode === countryCode);
  const expansion = computeExpansionIntelligenceScore(workspaceId, companyId, countryCode);
  const providerDeps = listProviderDependenciesForCountry(countryCode);

  const missingComponents: string[] = [];
  const criticalBlockers: string[] = [];
  const optionalComponents: string[] = [];

  for (const layer of profile.layers) {
    if (layer.status === "MISSING" && !["domain", "language", "currency"].includes(layer.layerId)) {
      missingComponents.push(`${layer.displayName}: no providers registered`);
    }
    if (layer.status === "PARTIAL") {
      missingComponents.push(`${layer.displayName}: partial coverage`);
    }
  }

  for (const pd of providerDeps) {
    for (const dep of pd.dependencies) {
      const layer = profile.layers.find((l) => l.layerId === dep.layerId);
      if (dep.requirement === "REQUIRED" && dep.humanActionRequired) {
        if (!layer || layer.status === "MISSING" || layer.status === "PARTIAL") {
          criticalBlockers.push(`${pd.displayName}: ${dep.component} (${dep.requirement})`);
        }
      } else if (dep.requirement === "OPTIONAL") {
        optionalComponents.push(`${pd.displayName}: ${dep.component}`);
      } else if (dep.requirement === "CONDITIONAL") {
        optionalComponents.push(`${pd.displayName}: ${dep.component} (conditional)`);
      }
    }
  }

  const accountScore = countryReadiness?.readinessScore ?? 0;
  const expansionScore = expansion?.expansionScore ?? profile.infrastructureScore;
  const infrastructureScore = Math.round(
    profile.infrastructureScore * 0.35 +
    accountScore * 0.25 +
    expansionScore * 0.25 +
    (100 - Math.min(100, criticalBlockers.length * 15)) * 0.15,
  );

  const automatableDeps = providerDeps.flatMap((p) => p.dependencies).filter((d) => d.automatable);
  const automationPotential = automatableDeps.length
    ? Math.round((automatableDeps.length / Math.max(1, providerDeps.flatMap((p) => p.dependencies).length)) * 100)
    : 40;

  const humanDeps = providerDeps.flatMap((p) => p.dependencies).filter((d) => d.humanActionRequired);
  const humanWorkRemainingHours = humanDeps.length * 4 + criticalBlockers.length * 8;

  const layerScores = profile.layers.map((l) => ({
    layerId: l.layerId,
    score: l.coverageScore,
    status: l.status,
  }));

  return {
    countryCode: profile.countryCode,
    displayName: profile.displayName,
    infrastructureScore,
    missingComponents,
    criticalBlockers,
    optionalComponents: optionalComponents.slice(0, 8),
    automationPotential,
    humanWorkRemainingHours,
    readinessPhase: derivePhase(infrastructureScore, criticalBlockers.length),
    layerScores,
    computedAt: new Date().toISOString(),
  };
}

export function listInfrastructureReadiness(
  workspaceId: string,
  companyId: string,
): InfrastructureReadiness[] {
  const registry = buildGlobalCommerceRegistry();
  return registry.countries
    .map((c) => computeInfrastructureReadiness(workspaceId, companyId, c.countryCode))
    .filter((r): r is InfrastructureReadiness => r !== null)
    .sort((a, b) => b.infrastructureScore - a.infrastructureScore);
}
