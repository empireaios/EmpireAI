/** R1-15 — Marketplace certification engine context (R1-01 through R1-14). */

import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import type { AmazonMarketplaceIntegrationEngine } from "../amazon-marketplace-integration/engine.js";
import type { AmazonProductIntelligenceEngine } from "../amazon-product-intelligence/engine.js";
import type { AmazonOrderManagementEngine } from "../amazon-order-management/engine.js";
import type { AmazonInventorySyncEngine } from "../amazon-inventory-sync/engine.js";
import type { WalmartMarketplaceIntegrationEngine } from "../walmart-marketplace-integration/engine.js";
import type { EtsyMarketplaceIntegrationEngine } from "../etsy-marketplace-integration/engine.js";
import type { EbayMarketplaceIntegrationEngine } from "../ebay-marketplace-integration/engine.js";
import type { TikTokShopMarketplaceIntegrationEngine } from "../tiktok-shop-marketplace-integration/engine.js";
import type { ShopifyStoreMarketplaceIntegrationEngine } from "../shopify-store-marketplace-integration/engine.js";
import type { WooCommerceMarketplaceIntegrationEngine } from "../woocommerce-marketplace-integration/engine.js";
import type { MarketplaceProductNormalizationEngine } from "../marketplace-product-normalization/engine.js";
import type { MarketplaceOrderNormalizationEngine } from "../marketplace-order-normalization/engine.js";
import type { MarketplaceHealthMonitorEngine } from "../marketplace-health-monitor/engine.js";

export type MarketplaceCertificationContext = {
  mcf: MarketplaceConnectorFrameworkEngine | null;
  amazonIntegration: AmazonMarketplaceIntegrationEngine | null;
  amazonProductIntelligence: AmazonProductIntelligenceEngine | null;
  amazonOrderManagement: AmazonOrderManagementEngine | null;
  amazonInventorySync: AmazonInventorySyncEngine | null;
  walmartIntegration: WalmartMarketplaceIntegrationEngine | null;
  etsyIntegration: EtsyMarketplaceIntegrationEngine | null;
  ebayIntegration: EbayMarketplaceIntegrationEngine | null;
  tiktokShopIntegration: TikTokShopMarketplaceIntegrationEngine | null;
  shopifyStoreIntegration: ShopifyStoreMarketplaceIntegrationEngine | null;
  woocommerceIntegration: WooCommerceMarketplaceIntegrationEngine | null;
  productNormalization: MarketplaceProductNormalizationEngine | null;
  orderNormalization: MarketplaceOrderNormalizationEngine | null;
  healthMonitor: MarketplaceHealthMonitorEngine | null;
};

export const EMPTY_CERTIFICATION_CONTEXT: MarketplaceCertificationContext = {
  mcf: null,
  amazonIntegration: null,
  amazonProductIntelligence: null,
  amazonOrderManagement: null,
  amazonInventorySync: null,
  walmartIntegration: null,
  etsyIntegration: null,
  ebayIntegration: null,
  tiktokShopIntegration: null,
  shopifyStoreIntegration: null,
  woocommerceIntegration: null,
  productNormalization: null,
  orderNormalization: null,
  healthMonitor: null,
};
