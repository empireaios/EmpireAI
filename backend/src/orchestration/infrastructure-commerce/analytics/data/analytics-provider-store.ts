/**
 * G2-07 — Dynamic analytics provider catalog (registry-backed policy context).
 */

import type { AnalyticsProviderRow } from "../contracts/analytics-integration-types.js";
import { ANALYTICS_PROVIDER_SEED_ROWS } from "../data/analytics-provider-catalog.js";

const providerCatalog = new Map<string, AnalyticsProviderRow>();

function ensureSeedLoaded(): void {
  if (providerCatalog.size > 0) return;
  for (const row of ANALYTICS_PROVIDER_SEED_ROWS) {
    providerCatalog.set(row.id, row);
  }
}

export function listAnalyticsProviderRows(): AnalyticsProviderRow[] {
  ensureSeedLoaded();
  return [...providerCatalog.values()];
}

export function getAnalyticsProviderRowById(providerId: string): AnalyticsProviderRow | undefined {
  ensureSeedLoaded();
  return providerCatalog.get(providerId);
}

export function registerAnalyticsProviderRow(row: AnalyticsProviderRow): void {
  ensureSeedLoaded();
  providerCatalog.set(row.id, row);
}

export function resetAnalyticsProviderCatalogForTests(): void {
  providerCatalog.clear();
  for (const row of ANALYTICS_PROVIDER_SEED_ROWS) {
    providerCatalog.set(row.id, row);
  }
}
