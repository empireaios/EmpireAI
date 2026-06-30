import type { GlobalCommerceRegistrySnapshot, ProviderEntry } from "../models/global-registry.js";
import {
  ALL_GLOBAL_PROVIDERS,
  GLOBAL_COUNTRIES,
  GLOBAL_MARKETPLACE_PROVIDERS,
  GLOBAL_PAYMENT_PROVIDERS,
  GLOBAL_REGIONS,
  GLOBAL_SUPPLIER_PROVIDERS,
} from "../data/global-commerce-registry-data.js";

/** B-006 — Global Commerce Registry service. */
export function buildGlobalCommerceRegistry(): GlobalCommerceRegistrySnapshot {
  return {
    regions: GLOBAL_REGIONS,
    countries: GLOBAL_COUNTRIES,
    providers: ALL_GLOBAL_PROVIDERS,
    totals: {
      regions: GLOBAL_REGIONS.length,
      countries: GLOBAL_COUNTRIES.length,
      marketplaces: GLOBAL_MARKETPLACE_PROVIDERS.length,
      suppliers: GLOBAL_SUPPLIER_PROVIDERS.length,
      payments: GLOBAL_PAYMENT_PROVIDERS.length,
    },
  };
}

export function getCountry(countryCode: string) {
  return GLOBAL_COUNTRIES.find((c) => c.countryCode === countryCode);
}

export function getProvidersByCountry(countryCode: string): ProviderEntry[] {
  return ALL_GLOBAL_PROVIDERS.filter((p) => p.countryCode === countryCode || p.countryCode === "GLOBAL");
}

export function getMarketplacesByCountry(countryCode: string): ProviderEntry[] {
  return GLOBAL_MARKETPLACE_PROVIDERS.filter((p) => p.countryCode === countryCode);
}

export function getProvider(providerId: string): ProviderEntry | undefined {
  return ALL_GLOBAL_PROVIDERS.find((p) => p.providerId === providerId);
}

export function listCountriesByRegion(regionId: string) {
  return GLOBAL_COUNTRIES.filter((c) => c.regionId === regionId);
}

export function listProvidersByDomain(domain: ProviderEntry["domain"]) {
  return ALL_GLOBAL_PROVIDERS.filter((p) => p.domain === domain);
}

export function listRuntimePluginCoverage(): Array<{ pluginId: string; countries: string[]; providerCount: number }> {
  const map = new Map<string, Set<string>>();
  for (const p of GLOBAL_MARKETPLACE_PROVIDERS) {
    if (!p.runtimePluginId) continue;
    const set = map.get(p.runtimePluginId) ?? new Set();
    set.add(p.countryCode);
    map.set(p.runtimePluginId, set);
  }
  return [...map.entries()].map(([pluginId, countries]) => ({
    pluginId,
    countries: [...countries],
    providerCount: GLOBAL_MARKETPLACE_PROVIDERS.filter((p) => p.runtimePluginId === pluginId).length,
  }));
}
