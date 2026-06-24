import type { ProductSignal } from "../../../eye/contract/product-signal.js";

export function clampScore(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value * 10) / 10));
}

export function positiveReason(text: string): string {
  return `+ ${text}`;
}

export function negativeReason(text: string): string {
  return `- ${text}`;
}

export function hasField<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/** Known marketplace providers receive a modest trust bonus. */
export function providerTrustHint(signal: ProductSignal): number {
  const knownProviders = [
    "amazon-product-intelligence",
    "cj-dropshipping",
    "tiktok-shop",
  ];
  if (knownProviders.includes(signal.providerId)) return 12;
  if (signal.providerName.length > 0) return 5;
  return 0;
}

/** Infer shipping difficulty from category keywords. */
export function categoryShippingFactor(category: string): number {
  const bulky = /furniture|appliance|fitness equipment|outdoor|garden|pet supplies/i;
  const compact = /electronics|accessories|jewelry|beauty|phone|earbuds|usb/i;
  if (bulky.test(category)) return -15;
  if (compact.test(category)) return 10;
  return 0;
}
