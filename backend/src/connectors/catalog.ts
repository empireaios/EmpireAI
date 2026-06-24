import type { ConnectorCategory, ConnectorDefinition } from "./types.js";

export const CONNECTOR_CATALOG: ConnectorDefinition[] = [
  // Suppliers
  { id: "cj-dropshipping", name: "CJDropshipping", category: "suppliers", capabilities: ["catalog_sync", "order_fulfillment", "inventory"], replaceableBy: ["aliexpress", "spocket"] },
  { id: "aliexpress", name: "AliExpress", category: "suppliers", capabilities: ["catalog_sync", "order_fulfillment"], replaceableBy: ["cj-dropshipping", "alibaba"] },
  { id: "alibaba", name: "Alibaba", category: "suppliers", capabilities: ["catalog_sync", "order_fulfillment", "inventory"], replaceableBy: ["aliexpress"] },
  { id: "spocket", name: "Spocket", category: "suppliers", capabilities: ["catalog_sync", "order_fulfillment"], replaceableBy: ["cj-dropshipping", "zendrop"] },
  { id: "zendrop", name: "Zendrop", category: "suppliers", capabilities: ["catalog_sync", "order_fulfillment"], replaceableBy: ["spocket", "autods"] },
  { id: "autods", name: "AutoDS", category: "suppliers", capabilities: ["catalog_sync", "order_fulfillment", "inventory"], replaceableBy: ["zendrop"] },
  // Commerce
  { id: "shopify", name: "Shopify", category: "commerce", capabilities: ["checkout", "catalog_sync", "order_fulfillment"], replaceableBy: ["woocommerce"] },
  { id: "woocommerce", name: "WooCommerce", category: "commerce", capabilities: ["checkout", "catalog_sync"], replaceableBy: ["shopify"] },
  { id: "amazon", name: "Amazon", category: "commerce", capabilities: ["catalog_sync", "order_fulfillment"], replaceableBy: ["ebay", "etsy"] },
  { id: "ebay", name: "eBay", category: "commerce", capabilities: ["catalog_sync", "order_fulfillment"], replaceableBy: ["amazon"] },
  { id: "etsy", name: "Etsy", category: "commerce", capabilities: ["catalog_sync", "checkout"], replaceableBy: ["shopify"] },
  // Advertising
  { id: "meta-ads", name: "Meta Ads", category: "advertising", capabilities: ["campaign_sync"], replaceableBy: ["google-ads", "tiktok-ads"] },
  { id: "google-ads", name: "Google Ads", category: "advertising", capabilities: ["campaign_sync"], replaceableBy: ["meta-ads"] },
  { id: "tiktok-ads", name: "TikTok Ads", category: "advertising", capabilities: ["campaign_sync"], replaceableBy: ["meta-ads"] },
  // Payments
  { id: "stripe", name: "Stripe", category: "payments", capabilities: ["payment_capture", "refund"], replaceableBy: ["paypal"] },
  { id: "paypal", name: "PayPal", category: "payments", capabilities: ["payment_capture", "refund"], replaceableBy: ["stripe"] },
  // Shipping (framework placeholders)
  { id: "fedex", name: "FedEx", category: "shipping", capabilities: ["shipment_tracking"], replaceableBy: ["ups", "dhl"] },
  { id: "ups", name: "UPS", category: "shipping", capabilities: ["shipment_tracking"], replaceableBy: ["fedex"] },
  { id: "dhl", name: "DHL", category: "shipping", capabilities: ["shipment_tracking"], replaceableBy: ["fedex"] },
  // Analytics
  { id: "google-analytics", name: "Google Analytics", category: "analytics", capabilities: ["metrics_import"], replaceableBy: [] },
  { id: "google-search-console", name: "Google Search Console", category: "analytics", capabilities: ["metrics_import"], replaceableBy: [] },
  // Trend intelligence
  { id: "google-trends", name: "Google Trends", category: "trend_intelligence", capabilities: ["trend_data"], replaceableBy: [] },
];

export { createMockConnector as createStubConnector } from "./mock-providers.js";

export function getCatalogByCategory(category: ConnectorCategory): ConnectorDefinition[] {
  return CONNECTOR_CATALOG.filter((c) => c.category === category);
}
