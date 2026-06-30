import type { CountryInfrastructureProfile, InfrastructureLayer, InfrastructureLayerId } from "../models/infrastructure-model.js";
import { INFRASTRUCTURE_LAYER_DEFINITIONS } from "../models/infrastructure-model.js";
import { COUNTRY_LAYER_BASELINES } from "../data/infrastructure-seed-data.js";
import {
  buildGlobalCommerceRegistry,
  getCountry,
  getMarketplacesByCountry,
} from "../../global-commerce/services/global-commerce-registry-service.js";
import { getProvidersByCountry } from "../../global-commerce/services/global-commerce-registry-service.js";

function layerStatus(count: number, layerId: InfrastructureLayerId): InfrastructureLayer["status"] {
  if (["language", "currency", "domain"].includes(layerId)) return count > 0 ? "PRESENT" : "PRESENT";
  if (layerId === "business_registration" || layerId === "tax" || layerId === "compliance") return count > 0 ? "CONDITIONAL" : "CONDITIONAL";
  if (count >= 2) return "PRESENT";
  if (count === 1) return "PARTIAL";
  return "MISSING";
}

function buildLayer(
  countryCode: string,
  layerId: InfrastructureLayerId,
  displayName: string,
  providerIds: string[],
  notes: string[] = [],
): InfrastructureLayer {
  const count = providerIds.length;
  const coverageScore = layerId === "language" || layerId === "currency"
    ? 100
    : Math.min(100, count * (layerId === "marketplace" ? 15 : 25));
  return {
    layerId,
    displayName,
    status: layerStatus(count, layerId),
    providerCount: count,
    providerIds,
    coverageScore,
    notes,
  };
}

/** D-001 — Commerce Infrastructure Model per country. */
export function buildCountryInfrastructureProfile(countryCode: string): CountryInfrastructureProfile | null {
  const country = getCountry(countryCode);
  if (!country) return null;

  const providers = getProvidersByCountry(countryCode);
  const marketplaces = getMarketplacesByCountry(countryCode);
  const baseline = COUNTRY_LAYER_BASELINES[countryCode];

  const byDomain = (domain: string) => providers.filter((p) => p.domain === domain).map((p) => p.providerId);

  const layers: InfrastructureLayer[] = INFRASTRUCTURE_LAYER_DEFINITIONS.map((def) => {
    switch (def.layerId) {
      case "marketplace":
        return buildLayer(countryCode, def.layerId, def.displayName, marketplaces.map((m) => m.providerId));
      case "payment":
        return buildLayer(countryCode, def.layerId, def.displayName, byDomain("payment"));
      case "supplier":
        return buildLayer(countryCode, def.layerId, def.displayName, byDomain("supplier"));
      case "logistics":
        return buildLayer(countryCode, def.layerId, def.displayName, byDomain("logistics"));
      case "advertising":
        return buildLayer(countryCode, def.layerId, def.displayName, byDomain("advertising"));
      case "customer_service":
        return buildLayer(countryCode, def.layerId, def.displayName, byDomain("customer_service"));
      case "tax":
        return buildLayer(countryCode, def.layerId, def.displayName, [`tax-${countryCode.toLowerCase()}`], baseline?.compliance ?? ["Local tax registration"]);
      case "compliance":
        return buildLayer(countryCode, def.layerId, def.displayName, [`compliance-${countryCode.toLowerCase()}`], baseline?.compliance ?? []);
      case "business_registration":
        return buildLayer(countryCode, def.layerId, def.displayName, [`biz-reg-${countryCode.toLowerCase()}`], ["Entity registration may be conditional"]);
      case "language":
        return buildLayer(countryCode, def.layerId, def.displayName, country.languages, country.languages.map((l) => `Language: ${l}`));
      case "currency":
        return buildLayer(countryCode, def.layerId, def.displayName, [country.currency], [`Primary currency: ${country.currency}`]);
      case "domain":
        return buildLayer(countryCode, def.layerId, def.displayName, [`domain-${countryCode.toLowerCase()}`], ["Country-appropriate domain recommended"]);
      default:
        return buildLayer(countryCode, def.layerId, def.displayName, []);
    }
  });

  const infrastructureScore = Math.round(
    layers.reduce((s, l) => s + l.coverageScore, 0) / layers.length,
  );

  return {
    countryCode: country.countryCode,
    displayName: country.displayName,
    regionId: country.regionId,
    layers,
    infrastructureScore,
    computedAt: new Date().toISOString(),
  };
}

export function listCountryInfrastructureProfiles(): CountryInfrastructureProfile[] {
  const registry = buildGlobalCommerceRegistry();
  return registry.countries
    .map((c) => buildCountryInfrastructureProfile(c.countryCode))
    .filter((p): p is CountryInfrastructureProfile => p !== null);
}

export function registerCountryLayerBaseline(countryCode: string, layerId: InfrastructureLayerId, notes: string[]): void {
  COUNTRY_LAYER_BASELINES[countryCode] ??= {};
  COUNTRY_LAYER_BASELINES[countryCode]![layerId] = notes;
}
