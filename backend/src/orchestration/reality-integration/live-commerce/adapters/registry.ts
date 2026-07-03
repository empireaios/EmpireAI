import {
  resolveAmazonMarketplaceRegistryId,
} from "../amazon-marketplace-profiles.js";
import {
  amazonSgSpApiAdapter,
  amazonSpApiAdapter,
  amazonUsSpApiAdapter,
} from "./amazon-sp-api-adapter.js";
import { cjDropshippingAdapter } from "./supplier-cj-adapter.js";
import type { LiveCommerceProviderAdapter } from "./types.js";

const ADAPTERS: LiveCommerceProviderAdapter[] = [
  amazonUsSpApiAdapter,
  amazonSgSpApiAdapter,
  cjDropshippingAdapter,
];

export function getLiveCommerceAdapter(providerId: string): LiveCommerceProviderAdapter | null {
  const amazonRegistryId = resolveAmazonMarketplaceRegistryId(providerId);
  if (amazonRegistryId) {
    return ADAPTERS.find((adapter) => adapter.providerId === amazonRegistryId) ?? null;
  }
  return ADAPTERS.find((adapter) => adapter.providerId === providerId) ?? null;
}

export function listLiveCommerceAdapters(): LiveCommerceProviderAdapter[] {
  return [...ADAPTERS];
}

export function isLiveCommerceProvider(providerId: string): boolean {
  return getLiveCommerceAdapter(providerId) !== null;
}

/** @deprecated Legacy US adapter alias — B6-01D uses amazon-us / amazon-sg. */
export { amazonSpApiAdapter };
