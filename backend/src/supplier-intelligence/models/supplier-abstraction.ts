import { z } from "zod";

/** SUP-001 — Universal supplier platform identifiers (CJ is one adapter, not authority). */
export const SUPPLIER_PROVIDER_IDS = [
  "cj-dropshipping",
  "autods",
  "alibaba",
  "1688",
  "aliexpress",
  "spocket",
  "syncee",
  "salehoo",
  "zendrop",
  "local-wholesaler",
  "future-supplier",
] as const;

export type SupplierProviderId = (typeof SUPPLIER_PROVIDER_IDS)[number];

export const SUPPLIER_ADAPTER_STATUSES = [
  "ARCHITECTURE_READY",
  "CREDENTIALS_PENDING",
  "CONNECTED",
  "VERIFIED",
  "LIVE_BLOCKED",
  "ACTIVE",
] as const;

export type SupplierAdapterStatus = (typeof SUPPLIER_ADAPTER_STATUSES)[number];

export const supplierProviderDefinitionSchema = z.object({
  providerId: z.string().min(1),
  displayName: z.string().min(1),
  category: z.enum(["dropship", "wholesale", "aggregator", "marketplace_sourcing"]),
  authentication: z.enum(["api_key", "oauth2", "token", "manual"]),
  architectureOnly: z.boolean(),
  revenueBlocking: z.boolean(),
  documentationUrl: z.string().optional(),
  supportedCountries: z.array(z.string()).default([]),
});

export type SupplierProviderDefinition = z.infer<typeof supplierProviderDefinitionSchema>;

export const SUPPLIER_PROVIDER_CATALOG: SupplierProviderDefinition[] = [
  { providerId: "cj-dropshipping", displayName: "CJdropshipping", category: "dropship", authentication: "api_key", architectureOnly: true, revenueBlocking: true, documentationUrl: "https://developers.cjdropshipping.com", supportedCountries: ["US", "EU", "UK", "CA", "AU"] },
  { providerId: "autods", displayName: "AutoDS", category: "aggregator", authentication: "api_key", architectureOnly: true, revenueBlocking: false, documentationUrl: "https://www.autods.com/developers/", supportedCountries: [] },
  { providerId: "alibaba", displayName: "Alibaba", category: "wholesale", authentication: "oauth2", architectureOnly: true, revenueBlocking: false, documentationUrl: "https://open.alibaba.com", supportedCountries: [] },
  { providerId: "1688", displayName: "1688", category: "wholesale", authentication: "oauth2", architectureOnly: true, revenueBlocking: false, supportedCountries: [] },
  { providerId: "aliexpress", displayName: "AliExpress", category: "dropship", authentication: "oauth2", architectureOnly: true, revenueBlocking: false, documentationUrl: "https://openservice.aliexpress.com", supportedCountries: [] },
  { providerId: "spocket", displayName: "Spocket", category: "dropship", authentication: "api_key", architectureOnly: true, revenueBlocking: false, documentationUrl: "https://www.spocket.co", supportedCountries: ["US", "EU"] },
  { providerId: "syncee", displayName: "Syncee", category: "dropship", authentication: "api_key", architectureOnly: true, revenueBlocking: false, supportedCountries: [] },
  { providerId: "salehoo", displayName: "SaleHoo", category: "aggregator", authentication: "token", architectureOnly: true, revenueBlocking: false, supportedCountries: [] },
  { providerId: "zendrop", displayName: "Zendrop", category: "dropship", authentication: "api_key", architectureOnly: true, revenueBlocking: false, documentationUrl: "https://zendrop.com", supportedCountries: ["US"] },
  { providerId: "local-wholesaler", displayName: "Local Wholesaler", category: "wholesale", authentication: "manual", architectureOnly: true, revenueBlocking: false, supportedCountries: [] },
  { providerId: "future-supplier", displayName: "Future Supplier", category: "dropship", authentication: "api_key", architectureOnly: true, revenueBlocking: false, supportedCountries: [] },
];

export const supplierAdapterRecordSchema = z.object({
  providerId: z.string(),
  displayName: z.string(),
  status: z.enum(SUPPLIER_ADAPTER_STATUSES),
  credentialsRef: z.string().nullable(),
  capabilities: z.array(z.string()),
  restrictions: z.array(z.string()),
  health: z.enum(["HEALTHY", "WARNING", "DISABLED"]),
  updatedAt: z.string().datetime({ offset: true }),
});

export type SupplierAdapterRecord = z.infer<typeof supplierAdapterRecordSchema>;

export function getSupplierProvider(providerId: string): SupplierProviderDefinition | undefined {
  return SUPPLIER_PROVIDER_CATALOG.find((p) => p.providerId === providerId);
}
