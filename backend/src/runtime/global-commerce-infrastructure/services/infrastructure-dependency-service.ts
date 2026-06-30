import type { InfrastructureDependency, ProviderDependencyProfile } from "../models/infrastructure-dependency.js";
import { PROVIDER_DEPENDENCY_SEED, defaultProviderDependencies } from "../data/infrastructure-seed-data.js";
import { getMarketplacesByCountry, getProvider } from "../../global-commerce/services/global-commerce-registry-service.js";

function seedToDependency(seed: typeof PROVIDER_DEPENDENCY_SEED[number]): InfrastructureDependency {
  return {
    dependencyId: `${seed.providerId}-${seed.component.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    providerId: seed.providerId,
    providerDisplayName: getProvider(seed.providerId)?.displayName ?? seed.providerId,
    countryCode: seed.countryCode,
    layerId: seed.layerId,
    requirement: seed.requirement,
    component: seed.component,
    rationale: seed.rationale,
    humanActionRequired: seed.humanActionRequired,
    automatable: seed.automatable,
  };
}

/** D-002 — Infrastructure Dependency Engine. */
export function getProviderDependencies(providerId: string, countryCode: string): ProviderDependencyProfile | null {
  const provider = getProvider(providerId);
  if (!provider || provider.countryCode !== countryCode) return null;

  const seeds = PROVIDER_DEPENDENCY_SEED.filter((s) => s.providerId === providerId && s.countryCode === countryCode);
  const dependencies = seeds.length
    ? seeds.map(seedToDependency)
    : defaultProviderDependencies(providerId, countryCode, provider.displayName).map(seedToDependency);

  return {
    providerId,
    displayName: provider.displayName,
    countryCode,
    dependencies,
    computedAt: new Date().toISOString(),
  };
}

export function listProviderDependenciesForCountry(countryCode: string): ProviderDependencyProfile[] {
  const marketplaces = getMarketplacesByCountry(countryCode);
  return marketplaces
    .map((m) => getProviderDependencies(m.providerId, countryCode))
    .filter((p): p is ProviderDependencyProfile => p !== null);
}

export function getDependencyByComponent(providerId: string, countryCode: string, component: string): InfrastructureDependency | null {
  const profile = getProviderDependencies(providerId, countryCode);
  return profile?.dependencies.find((d) => d.component.toLowerCase().includes(component.toLowerCase())) ?? null;
}

export function countSeededProviderDependencies(): number {
  return new Set(PROVIDER_DEPENDENCY_SEED.map((s) => s.providerId)).size;
}
