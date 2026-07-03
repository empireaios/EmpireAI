/**
 * EA-003 — Tier 1 platform catalog sources.
 */

import {
  GLOBAL_ADVERTISING_PROVIDERS,
  GLOBAL_COUNTRIES,
  GLOBAL_CUSTOMER_PROVIDERS,
  GLOBAL_MARKETPLACE_PROVIDERS,
  GLOBAL_PAYMENT_PROVIDERS,
  GLOBAL_POLICY_PROVIDERS,
  GLOBAL_REGIONS,
  GLOBAL_SUPPLIER_PROVIDERS,
} from "../../runtime/global-commerce/data/global-commerce-registry-data.js";
import type { Country, ProviderEntry, Region } from "../../runtime/global-commerce/models/global-registry.js";
import type { RegistryQuery } from "../types/registry-types.js";

export const PLATFORM_CATALOG_VERSION = "b-006-v1";

export function loadRegionRows(): Region[] {
  return [...GLOBAL_REGIONS];
}

export function loadCountryRows(query?: RegistryQuery): Country[] {
  if (query?.countryCode) {
    const country = GLOBAL_COUNTRIES.find((c) => c.countryCode === query.countryCode);
    return country ? [country] : [];
  }
  return [...GLOBAL_COUNTRIES];
}

export function loadMarketplaceRows(query?: RegistryQuery): ProviderEntry[] {
  if (query?.countryCode) {
    return GLOBAL_MARKETPLACE_PROVIDERS.filter((p) => p.countryCode === query.countryCode);
  }
  if (query?.registryRowId) {
    const row = GLOBAL_MARKETPLACE_PROVIDERS.find((p) => p.providerId === query.registryRowId);
    return row ? [row] : [];
  }
  return [...GLOBAL_MARKETPLACE_PROVIDERS];
}

export function loadSupplierCatalogRows(query?: RegistryQuery): ProviderEntry[] {
  if (query?.registryRowId) {
    const row = GLOBAL_SUPPLIER_PROVIDERS.find((p) => p.providerId === query.registryRowId);
    return row ? [row] : [];
  }
  return [...GLOBAL_SUPPLIER_PROVIDERS];
}

export function loadPaymentCatalogRows(query?: RegistryQuery): ProviderEntry[] {
  if (query?.registryRowId) {
    const row = GLOBAL_PAYMENT_PROVIDERS.find((p) => p.providerId === query.registryRowId);
    return row ? [row] : [];
  }
  return [...GLOBAL_PAYMENT_PROVIDERS];
}

export function loadAdvertisingCatalogRows(query?: RegistryQuery): ProviderEntry[] {
  if (query?.registryRowId) {
    const row = GLOBAL_ADVERTISING_PROVIDERS.find((p) => p.providerId === query.registryRowId);
    return row ? [row] : [];
  }
  return [...GLOBAL_ADVERTISING_PROVIDERS];
}

export function loadCustomerCatalogRows(query?: RegistryQuery): ProviderEntry[] {
  if (query?.registryRowId) {
    const row = GLOBAL_CUSTOMER_PROVIDERS.find((p) => p.providerId === query.registryRowId);
    return row ? [row] : [];
  }
  return [...GLOBAL_CUSTOMER_PROVIDERS];
}

export function loadPolicyCatalogRows(query?: RegistryQuery): ProviderEntry[] {
  if (query?.registryRowId) {
    const row = GLOBAL_POLICY_PROVIDERS.find((p) => p.providerId === query.registryRowId);
    return row ? [row] : [];
  }
  return [...GLOBAL_POLICY_PROVIDERS];
}

export function countryDisplayName(countryCode: string): string {
  if (countryCode === "GLOBAL") return "Global";
  return GLOBAL_COUNTRIES.find((c) => c.countryCode === countryCode)?.displayName ?? countryCode;
}
