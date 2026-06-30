import { amazonSpApiAdapter } from "./amazon-sp-api-adapter.js";
import { cjDropshippingAdapter } from "./supplier-cj-adapter.js";
import type { LiveCommerceProviderAdapter } from "./types.js";

const ADAPTERS: LiveCommerceProviderAdapter[] = [amazonSpApiAdapter, cjDropshippingAdapter];

export function getLiveCommerceAdapter(providerId: string): LiveCommerceProviderAdapter | null {
  return ADAPTERS.find((adapter) => adapter.providerId === providerId) ?? null;
}

export function listLiveCommerceAdapters(): LiveCommerceProviderAdapter[] {
  return [...ADAPTERS];
}

export function isLiveCommerceProvider(providerId: string): boolean {
  return ADAPTERS.some((adapter) => adapter.providerId === providerId);
}
