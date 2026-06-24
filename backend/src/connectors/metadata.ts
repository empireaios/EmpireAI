import type { ConnectorCategory, ConnectorStatus } from "./types.js";

export type ConnectorCostType = "free" | "monthly" | "usage_based" | "hybrid";

export type ConnectorRiskLevel = "low" | "medium" | "high";

/** Rich metadata for every external data connector — real-ready, mock-populated. */
export type ConnectorMetadata = {
  providerId: string;
  providerName: string;
  category: ConnectorCategory;
  accessStatus: ConnectorStatus;
  costType: ConnectorCostType;
  monthlyCostCents: number;
  usageBasedCost: Record<string, unknown>;
  apiKeyRequired: boolean;
  riskLevel: ConnectorRiskLevel;
  fallbackProviderId: string | null;
};

export const CONNECTOR_METADATA: ConnectorMetadata[] = [
  // Suppliers
  { providerId: "cj-dropshipping", providerName: "CJDropshipping", category: "suppliers", accessStatus: "available", costType: "free", monthlyCostCents: 0, usageBasedCost: { model: "per-order fee" }, apiKeyRequired: true, riskLevel: "medium", fallbackProviderId: "aliexpress" },
  { providerId: "aliexpress", providerName: "AliExpress", category: "suppliers", accessStatus: "available", costType: "usage_based", monthlyCostCents: 0, usageBasedCost: { model: "per-unit cost" }, apiKeyRequired: true, riskLevel: "medium", fallbackProviderId: "cj-dropshipping" },
  { providerId: "alibaba", providerName: "Alibaba", category: "suppliers", accessStatus: "available", costType: "usage_based", monthlyCostCents: 0, usageBasedCost: { model: "bulk pricing" }, apiKeyRequired: true, riskLevel: "high", fallbackProviderId: "aliexpress" },
  { providerId: "spocket", providerName: "Spocket", category: "suppliers", accessStatus: "available", costType: "monthly", monthlyCostCents: 3999, usageBasedCost: {}, apiKeyRequired: true, riskLevel: "low", fallbackProviderId: "cj-dropshipping" },
  { providerId: "zendrop", providerName: "Zendrop", category: "suppliers", accessStatus: "available", costType: "monthly", monthlyCostCents: 4900, usageBasedCost: {}, apiKeyRequired: true, riskLevel: "low", fallbackProviderId: "spocket" },
  { providerId: "autods", providerName: "AutoDS", category: "suppliers", accessStatus: "available", costType: "monthly", monthlyCostCents: 2900, usageBasedCost: { model: "per-order automation" }, apiKeyRequired: true, riskLevel: "medium", fallbackProviderId: "zendrop" },
  // Commerce
  { providerId: "shopify", providerName: "Shopify", category: "commerce", accessStatus: "available", costType: "hybrid", monthlyCostCents: 2900, usageBasedCost: { model: "transaction fee" }, apiKeyRequired: true, riskLevel: "high", fallbackProviderId: "woocommerce" },
  { providerId: "woocommerce", providerName: "WooCommerce", category: "commerce", accessStatus: "available", costType: "free", monthlyCostCents: 0, usageBasedCost: { model: "hosting + plugins" }, apiKeyRequired: true, riskLevel: "medium", fallbackProviderId: "shopify" },
  { providerId: "amazon", providerName: "Amazon", category: "commerce", accessStatus: "available", costType: "usage_based", monthlyCostCents: 0, usageBasedCost: { model: "referral fee" }, apiKeyRequired: true, riskLevel: "high", fallbackProviderId: "ebay" },
  { providerId: "ebay", providerName: "eBay", category: "commerce", accessStatus: "available", costType: "usage_based", monthlyCostCents: 0, usageBasedCost: { model: "final value fee" }, apiKeyRequired: true, riskLevel: "medium", fallbackProviderId: "amazon" },
  { providerId: "etsy", providerName: "Etsy", category: "commerce", accessStatus: "available", costType: "usage_based", monthlyCostCents: 0, usageBasedCost: { model: "listing + transaction fee" }, apiKeyRequired: true, riskLevel: "medium", fallbackProviderId: "shopify" },
  // Advertising
  { providerId: "meta-ads", providerName: "Meta Ads", category: "advertising", accessStatus: "available", costType: "usage_based", monthlyCostCents: 0, usageBasedCost: { model: "ad spend" }, apiKeyRequired: true, riskLevel: "high", fallbackProviderId: "google-ads" },
  { providerId: "google-ads", providerName: "Google Ads", category: "advertising", accessStatus: "available", costType: "usage_based", monthlyCostCents: 0, usageBasedCost: { model: "ad spend" }, apiKeyRequired: true, riskLevel: "high", fallbackProviderId: "meta-ads" },
  { providerId: "tiktok-ads", providerName: "TikTok Ads", category: "advertising", accessStatus: "available", costType: "usage_based", monthlyCostCents: 0, usageBasedCost: { model: "ad spend" }, apiKeyRequired: true, riskLevel: "medium", fallbackProviderId: "meta-ads" },
  // Payments
  { providerId: "stripe", providerName: "Stripe", category: "payments", accessStatus: "available", costType: "usage_based", monthlyCostCents: 0, usageBasedCost: { model: "2.9% + $0.30 per transaction" }, apiKeyRequired: true, riskLevel: "high", fallbackProviderId: "paypal" },
  { providerId: "paypal", providerName: "PayPal", category: "payments", accessStatus: "available", costType: "usage_based", monthlyCostCents: 0, usageBasedCost: { model: "transaction fee" }, apiKeyRequired: true, riskLevel: "medium", fallbackProviderId: "stripe" },
  // Shipping
  { providerId: "fedex", providerName: "FedEx", category: "shipping", accessStatus: "available", costType: "usage_based", monthlyCostCents: 0, usageBasedCost: { model: "per-shipment" }, apiKeyRequired: true, riskLevel: "medium", fallbackProviderId: "ups" },
  { providerId: "ups", providerName: "UPS", category: "shipping", accessStatus: "available", costType: "usage_based", monthlyCostCents: 0, usageBasedCost: { model: "per-shipment" }, apiKeyRequired: true, riskLevel: "medium", fallbackProviderId: "fedex" },
  { providerId: "dhl", providerName: "DHL", category: "shipping", accessStatus: "available", costType: "usage_based", monthlyCostCents: 0, usageBasedCost: { model: "per-shipment" }, apiKeyRequired: true, riskLevel: "medium", fallbackProviderId: "fedex" },
  // Analytics
  { providerId: "google-analytics", providerName: "Google Analytics", category: "analytics", accessStatus: "available", costType: "free", monthlyCostCents: 0, usageBasedCost: {}, apiKeyRequired: true, riskLevel: "low", fallbackProviderId: null },
  { providerId: "google-search-console", providerName: "Google Search Console", category: "analytics", accessStatus: "available", costType: "free", monthlyCostCents: 0, usageBasedCost: {}, apiKeyRequired: true, riskLevel: "low", fallbackProviderId: null },
  // Trend intelligence
  { providerId: "google-trends", providerName: "Google Trends", category: "trend_intelligence", accessStatus: "available", costType: "free", monthlyCostCents: 0, usageBasedCost: {}, apiKeyRequired: false, riskLevel: "low", fallbackProviderId: null },
];

export function getConnectorMetadata(providerId: string): ConnectorMetadata | undefined {
  return CONNECTOR_METADATA.find((m) => m.providerId === providerId);
}

export function listConnectorMetadata(category?: ConnectorCategory): ConnectorMetadata[] {
  return category
    ? CONNECTOR_METADATA.filter((m) => m.category === category)
    : [...CONNECTOR_METADATA];
}
