/**
 * G3 — Intelligence Engine dynamic market discovery.
 *
 * EA-003: Consumes RegistryLoader (DERIVED-DISCOVERY-SNAPSHOT) — engines must not
 * import platform catalog or deployment seeds directly.
 *
 * G3-02 Market Intelligence Engine should call buildMarketIntelligenceDiscoveryView()
 * or resolveDiscoverySnapshot() from this module or registry/index directly.
 */

import {
  DERIVED_DISCOVERY_SNAPSHOT,
  REG_CHANNEL,
  buildDiscoverySnapshotView,
  formatIntelligenceSourceSummary as formatSummary,
  getRegistryLoader,
  mapChannelProfileToIntelligenceSource,
  resolveDefaultProductSourceIds as defaultSourceIds,
  type DiscoverySnapshotView,
  type IntelligenceSourceDefinition,
  type IntelligenceSourceStatus,
} from "../../registry/index.js";
import type { Country, ProviderEntry } from "../../runtime/global-commerce/models/global-registry.js";
import type { MarketplaceChannelProfile } from "./marketplace-channel-registry.js";
import { getDeploymentChannelProfile } from "./marketplace-channel-registry.js";
import { loadMarketplaceRows } from "../../registry/sources/platform-catalog-source.js";

export type { IntelligenceSourceDefinition, IntelligenceSourceStatus };

/** @deprecated Use DiscoverySnapshotView from registry module. */
export type IntelligenceMarketDiscoverySnapshot = DiscoverySnapshotView;

function discoveryView(): DiscoverySnapshotView {
  return getRegistryLoader().resolveDerivedView<DiscoverySnapshotView>({}, DERIVED_DISCOVERY_SNAPSHOT).view;
}

export { mapChannelProfileToIntelligenceSource };

export function listAvailableCountries(): Country[] {
  return discoveryView().countries;
}

export function listAvailableMarketplacesByCountry(countryCode: string): ProviderEntry[] {
  const fromSnapshot = discoveryView().marketplacesByCountry[countryCode];
  if (fromSnapshot?.length) {
    return fromSnapshot;
  }
  return loadMarketplaceRows({ countryCode });
}

export function listAvailableChannels(): MarketplaceChannelProfile[] {
  return getRegistryLoader().resolve({}, REG_CHANNEL).rows as MarketplaceChannelProfile[];
}

export function listExpansionMarketplaces(): ProviderEntry[] {
  return discoveryView().expansionMarketplaces;
}

export function resolveIntelligenceSources(): IntelligenceSourceDefinition[] {
  return discoveryView().intelligenceSources;
}

export function resolveIntelligenceSourcesForCountry(countryCode: string): IntelligenceSourceDefinition[] {
  const view = getRegistryLoader().resolveDerivedView<DiscoverySnapshotView>({}, DERIVED_DISCOVERY_SNAPSHOT, { countryCode }).view;
  return view.intelligenceSources;
}

export function buildIntelligenceMarketDiscoverySnapshot(): DiscoverySnapshotView {
  return buildDiscoverySnapshotView({});
}

export function formatIntelligenceSourceSummary(sources: IntelligenceSourceDefinition[]): string {
  return formatSummary(sources);
}

export function resolveDefaultProductSourceIds(): string[] {
  return defaultSourceIds(resolveIntelligenceSources());
}

export function isRegisteredIntelligenceSource(sourceId: string): boolean {
  return getRegistryLoader().resolve({}, REG_CHANNEL, { registryRowId: sourceId }).rows.length > 0
    || getDeploymentChannelProfile(sourceId) !== undefined;
}

export function listRegisteredSupplierProviders(): ProviderEntry[] {
  return discoveryView().supplierProviders;
}

/** G3-02 — Market Intelligence Engine discovery entry (RegistryLoader-backed). */
export function resolveMarketIntelligenceDiscoverySnapshot(): DiscoverySnapshotView {
  return buildDiscoverySnapshotView({});
}

export function resolveDiscoverySnapshot(context: {
  workspaceId?: string;
  deploymentProfileId?: string;
} = {}): DiscoverySnapshotView {
  return getRegistryLoader().resolveDerivedView<DiscoverySnapshotView>(context, DERIVED_DISCOVERY_SNAPSHOT).view;
}
