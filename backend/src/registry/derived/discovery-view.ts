/**
 * EA-003 — DERIVED-DISCOVERY-SNAPSHOT
 * Tier-5 derived view for intelligence engines (PIE G3-01, future G3-02 Market Intelligence).
 */

import type { Country, ProviderEntry } from "../../runtime/global-commerce/models/global-registry.js";
import type { MarketplaceChannelProfile, MarketplaceLaunchReadiness } from "../../intelligence/shared/marketplace-channel-registry.js";
import {
  countryDisplayName,
  loadCountryRows,
  loadMarketplaceRows,
  loadSupplierCatalogRows,
} from "../sources/platform-catalog-source.js";
import { loadChannelRows } from "../sources/deployment-source.js";
import type { RegistryLoaderContext, RegistryQuery } from "../types/registry-types.js";

export type IntelligenceSourceStatus = "architecture" | "mock" | "live" | "future";

export type IntelligenceSourceDefinition = {
  id: string;
  label: string;
  region: string;
  channelType: MarketplaceChannelProfile["channelType"];
  status: IntelligenceSourceStatus;
  connectorRef: string | null;
  platformFamily: string;
  launchReadiness: MarketplaceLaunchReadiness;
  notes: string;
};

export type DiscoverySnapshotView = {
  computedAt: string;
  registrySource: "RegistryLoader:DERIVED-DISCOVERY-SNAPSHOT";
  deploymentProfileId: string;
  countries: Country[];
  marketplacesByCountry: Record<string, ProviderEntry[]>;
  deploymentChannels: MarketplaceChannelProfile[];
  expansionMarketplaces: ProviderEntry[];
  intelligenceSources: IntelligenceSourceDefinition[];
  supplierProviders: ProviderEntry[];
};

function mapLaunchReadinessToSourceStatus(
  profile: MarketplaceChannelProfile,
): IntelligenceSourceStatus {
  if (profile.channelType === "supplier") {
    return profile.launchReadiness === "live" ? "live" : "mock";
  }
  if (profile.v1Role === "mandatory_architecture") {
    return profile.launchReadiness === "live" ? "live" : "future";
  }
  if (profile.launchReadiness === "live" || profile.launchReadiness === "verified") {
    return "live";
  }
  if (profile.launchReadiness === "configured") {
    return "architecture";
  }
  return "architecture";
}

export function mapChannelProfileToIntelligenceSource(
  profile: MarketplaceChannelProfile,
): IntelligenceSourceDefinition {
  return {
    id: profile.registryId,
    label: profile.displayName,
    region: countryDisplayName(profile.countryCode),
    channelType: profile.channelType,
    status: mapLaunchReadinessToSourceStatus(profile),
    connectorRef: profile.connectorRef,
    platformFamily: profile.platformFamily,
    launchReadiness: profile.launchReadiness,
    notes: profile.notes,
  };
}

function listAvailableCountries(channels: MarketplaceChannelProfile[]): Country[] {
  const codesWithCoverage = new Set<string>();
  for (const provider of loadMarketplaceRows()) {
    codesWithCoverage.add(provider.countryCode);
  }
  for (const channel of channels) {
    if (channel.countryCode !== "GLOBAL") {
      codesWithCoverage.add(channel.countryCode);
    }
  }
  return loadCountryRows().filter((c) => codesWithCoverage.has(c.countryCode));
}

function listExpansionMarketplaces(channels: MarketplaceChannelProfile[]): ProviderEntry[] {
  const deployedProviderIds = new Set(
    channels
      .map((p) => p.globalCommerceProviderId)
      .filter((id): id is string => id !== null),
  );
  return loadMarketplaceRows().filter((p) => !deployedProviderIds.has(p.providerId));
}

export function buildDiscoverySnapshotView(
  context: RegistryLoaderContext,
  query?: RegistryQuery,
): DiscoverySnapshotView {
  const deploymentChannels = loadChannelRows(query);
  const countries = listAvailableCountries(deploymentChannels);
  const marketplacesByCountry: Record<string, ProviderEntry[]> = {};

  for (const country of countries) {
    marketplacesByCountry[country.countryCode] = loadMarketplaceRows({ countryCode: country.countryCode });
  }

  const intelligenceSources = deploymentChannels.map(mapChannelProfileToIntelligenceSource);

  return {
    computedAt: new Date().toISOString(),
    registrySource: "RegistryLoader:DERIVED-DISCOVERY-SNAPSHOT",
    deploymentProfileId: context.deploymentProfileId ?? "v1-production",
    countries,
    marketplacesByCountry,
    deploymentChannels,
    expansionMarketplaces: listExpansionMarketplaces(deploymentChannels),
    intelligenceSources,
    supplierProviders: loadSupplierCatalogRows(),
  };
}

/** G3-02 Market Intelligence Engine entry point — same derived view as PIE. */
export function buildMarketIntelligenceDiscoveryView(
  context: RegistryLoaderContext = {},
  query?: RegistryQuery,
): DiscoverySnapshotView {
  return buildDiscoverySnapshotView(context, query);
}

export function formatIntelligenceSourceSummary(sources: IntelligenceSourceDefinition[]): string {
  if (sources.length === 0) return "no registered sources";
  return sources.map((s) => `${s.label} (${s.status})`).join(", ");
}

export function resolveDefaultProductSourceIds(sources: IntelligenceSourceDefinition[]): string[] {
  const supplier = sources.find((s) => s.channelType === "supplier");
  const firstMarketplace = sources.find((s) => s.channelType === "marketplace");
  return [supplier?.id, firstMarketplace?.id].filter((id): id is string => Boolean(id));
}
