import type { RealityProviderDefinition } from "./reality-integration.js";

function provider(
  partial: Omit<RealityProviderDefinition, "irreversibleActionsBlocked" | "connectionOnly"> &
    Partial<Pick<RealityProviderDefinition, "connectionOnly">>,
): RealityProviderDefinition {
  return {
    ...partial,
    irreversibleActionsBlocked: true,
    connectionOnly: partial.connectionOnly ?? true,
  };
}

/** C005–C015 provider catalog — connection-ready, no irreversible actions. */
export const REALITY_PROVIDER_CATALOG: RealityProviderDefinition[] = [
  // C005 Marketplace Connectors
  provider({ providerId: "amazon-seller", displayName: "Amazon Seller", category: "commerce", capabilities: ["catalog_sync", "account_validation", "listing_readiness", "inventory", "pricing", "orders", "webhooks"], regions: ["US", "UK", "EU"], rateLimitPerMinute: 60, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://developer.amazonservices.com", requiredHumanActions: ["Seller Central account approval"], version: "2024.1", dependencies: [], connectionOnly: false }),
  provider({ providerId: "tiktok-shop", displayName: "TikTok Shop", category: "commerce", capabilities: ["catalog_sync", "account_validation", "listing_readiness"], regions: ["US", "UK"], rateLimitPerMinute: 120, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://partner.tiktokshop.com", requiredHumanActions: ["TikTok Shop seller verification"], version: "1.0", dependencies: [] }),
  provider({ providerId: "shopify", displayName: "Shopify", category: "commerce", capabilities: ["catalog_sync", "checkout", "account_validation"], regions: ["GLOBAL"], rateLimitPerMinute: 120, authentication: "oauth2", monthlyCostCents: 2900, documentationUrl: "https://shopify.dev", requiredHumanActions: ["Store creation"], version: "2024-10", dependencies: [] }),
  provider({ providerId: "ebay", displayName: "eBay", category: "commerce", capabilities: ["catalog_sync", "account_validation"], regions: ["US", "UK", "EU"], rateLimitPerMinute: 60, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://developer.ebay.com", requiredHumanActions: ["eBay seller account"], version: "v1", dependencies: [] }),
  provider({ providerId: "shopee", displayName: "Shopee", category: "commerce", capabilities: ["catalog_sync", "account_validation", "listing_readiness"], regions: ["SG", "MY", "TH", "ID", "PH", "VN", "TW"], rateLimitPerMinute: 80, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://open.shopee.com", requiredHumanActions: ["Shopee seller verification"], version: "2.0", dependencies: [] }),
  provider({ providerId: "lazada", displayName: "Lazada", category: "commerce", capabilities: ["catalog_sync", "account_validation", "listing_readiness"], regions: ["SG", "MY", "TH", "ID", "PH", "VN"], rateLimitPerMinute: 80, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://open.lazada.com", requiredHumanActions: ["Lazada seller verification"], version: "1.0", dependencies: [] }),
  provider({ providerId: "etsy", displayName: "Etsy", category: "commerce", capabilities: ["catalog_sync", "account_validation", "listing_readiness"], regions: ["US", "UK", "EU"], rateLimitPerMinute: 60, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://developers.etsy.com", requiredHumanActions: ["Etsy shop approval"], version: "v3", dependencies: [] }),
  provider({ providerId: "walmart", displayName: "Walmart Marketplace", category: "commerce", capabilities: ["catalog_sync", "account_validation"], regions: ["US"], rateLimitPerMinute: 40, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://developer.walmart.com", requiredHumanActions: ["Walmart seller approval"], version: "3.0", dependencies: [] }),
  provider({ providerId: "google-merchant", displayName: "Google Merchant Center", category: "commerce", capabilities: ["catalog_sync", "feed_validation"], regions: ["GLOBAL"], rateLimitPerMinute: 100, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://developers.google.com/merchant", requiredHumanActions: ["Merchant Center verification"], version: "v2.1", dependencies: ["google-search-console"] }),
  provider({ providerId: "facebook-shop", displayName: "Facebook Shop", category: "commerce", capabilities: ["catalog_sync", "account_validation"], regions: ["GLOBAL"], rateLimitPerMinute: 80, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://developers.facebook.com/docs/commerce-platform", requiredHumanActions: ["Commerce Manager setup"], version: "v18", dependencies: ["meta-ads"] }),
  provider({ providerId: "instagram-shop", displayName: "Instagram Shop", category: "commerce", capabilities: ["catalog_sync", "account_validation"], regions: ["GLOBAL"], rateLimitPerMinute: 80, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://developers.facebook.com/docs/instagram-api", requiredHumanActions: ["Instagram shopping approval"], version: "v18", dependencies: ["facebook-shop"] }),

  // C006 Supplier Connectors
  provider({ providerId: "cj-dropshipping", displayName: "CJ Dropshipping", category: "suppliers", capabilities: ["catalog", "inventory", "pricing", "shipping", "supplier_health", "orders", "webhooks"], regions: ["GLOBAL"], rateLimitPerMinute: 60, authentication: "api_key", monthlyCostCents: 0, documentationUrl: "https://developers.cjdropshipping.com", requiredHumanActions: ["API key generation"], version: "2.0", dependencies: [], connectionOnly: false }),
  provider({ providerId: "aliexpress", displayName: "AliExpress", category: "suppliers", capabilities: ["catalog", "inventory", "pricing", "shipping", "supplier_health"], regions: ["GLOBAL"], rateLimitPerMinute: 30, authentication: "api_key", monthlyCostCents: 0, documentationUrl: "https://openservice.aliexpress.com", requiredHumanActions: ["Developer app registration"], version: "1.0", dependencies: [] }),
  provider({ providerId: "autods", displayName: "AutoDS", category: "suppliers", capabilities: ["catalog", "inventory", "pricing", "shipping"], regions: ["GLOBAL"], rateLimitPerMinute: 40, authentication: "api_key", monthlyCostCents: 2900, documentationUrl: "https://www.autods.com/api", requiredHumanActions: ["AutoDS subscription"], version: "1.0", dependencies: [] }),
  provider({ providerId: "dsers", displayName: "DSers", category: "suppliers", capabilities: ["catalog", "inventory", "pricing", "shipping"], regions: ["GLOBAL"], rateLimitPerMinute: 40, authentication: "api_key", monthlyCostCents: 1900, documentationUrl: "https://www.dsers.com", requiredHumanActions: ["DSers account linking"], version: "1.0", dependencies: [] }),
  provider({ providerId: "zendrop", displayName: "Zendrop", category: "suppliers", capabilities: ["catalog", "inventory", "pricing", "shipping", "supplier_health"], regions: ["US"], rateLimitPerMinute: 40, authentication: "api_key", monthlyCostCents: 4900, documentationUrl: "https://zendrop.com", requiredHumanActions: ["Zendrop subscription"], version: "1.0", dependencies: [] }),
  provider({ providerId: "spocket", displayName: "Spocket", category: "suppliers", capabilities: ["catalog", "inventory", "pricing", "shipping"], regions: ["US", "EU"], rateLimitPerMinute: 40, authentication: "api_key", monthlyCostCents: 3999, documentationUrl: "https://www.spocket.co", requiredHumanActions: ["Spocket subscription"], version: "1.0", dependencies: [] }),

  // C007 Payment Connectors
  provider({ providerId: "stripe", displayName: "Stripe", category: "payments", capabilities: ["account_validation", "webhook_registration", "currency", "fees", "health"], regions: ["GLOBAL"], rateLimitPerMinute: 100, authentication: "api_key", monthlyCostCents: 0, documentationUrl: "https://stripe.com/docs/api", requiredHumanActions: ["Stripe account verification"], version: "2024-11", dependencies: [] }),
  provider({ providerId: "paypal", displayName: "PayPal", category: "payments", capabilities: ["account_validation", "webhook_registration", "currency", "fees", "health"], regions: ["GLOBAL"], rateLimitPerMinute: 60, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://developer.paypal.com", requiredHumanActions: ["PayPal business account"], version: "v2", dependencies: [] }),

  // C008 Advertising Connectors
  provider({ providerId: "meta-ads", displayName: "Meta Ads", category: "advertising", capabilities: ["campaign_validation", "account_validation", "creative_upload", "audience", "budget"], regions: ["GLOBAL"], rateLimitPerMinute: 200, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://developers.facebook.com/docs/marketing-apis", requiredHumanActions: ["Ad account creation", "Business verification"], version: "v19", dependencies: [] }),
  provider({ providerId: "tiktok-ads", displayName: "TikTok Ads", category: "advertising", capabilities: ["campaign_validation", "account_validation", "creative_upload", "audience", "budget"], regions: ["US", "UK", "EU"], rateLimitPerMinute: 100, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://ads.tiktok.com/marketing_api", requiredHumanActions: ["TikTok Ads account"], version: "1.3", dependencies: [] }),
  provider({ providerId: "google-ads", displayName: "Google Ads", category: "advertising", capabilities: ["campaign_validation", "account_validation", "creative_upload", "audience", "budget"], regions: ["GLOBAL"], rateLimitPerMinute: 100, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://developers.google.com/google-ads/api", requiredHumanActions: ["Google Ads MCC setup"], version: "v16", dependencies: [] }),
  provider({ providerId: "pinterest-ads", displayName: "Pinterest Ads", category: "advertising", capabilities: ["campaign_validation", "account_validation", "creative_upload", "audience", "budget"], regions: ["US", "UK"], rateLimitPerMinute: 60, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://developers.pinterest.com/docs/api/v5", requiredHumanActions: ["Pinterest business account"], version: "v5", dependencies: [] }),

  // C009 Creative AI Connectors
  provider({ providerId: "openai", displayName: "OpenAI", category: "creative_ai", capabilities: ["image_generation", "copy_generation", "creative_detection"], regions: ["GLOBAL"], rateLimitPerMinute: 60, authentication: "api_key", monthlyCostCents: 0, documentationUrl: "https://platform.openai.com/docs", requiredHumanActions: ["API key with billing"], version: "2024-08", dependencies: [] }),
  provider({ providerId: "veo", displayName: "Google Veo", category: "creative_ai", capabilities: ["video_generation", "creative_detection"], regions: ["GLOBAL"], rateLimitPerMinute: 10, authentication: "api_key", monthlyCostCents: 0, documentationUrl: "https://deepmind.google/technologies/veo", requiredHumanActions: ["Google Cloud project"], version: "1.0", dependencies: [] }),
  provider({ providerId: "canva", displayName: "Canva", category: "creative_ai", capabilities: ["image_generation", "brand_assets", "creative_detection"], regions: ["GLOBAL"], rateLimitPerMinute: 30, authentication: "oauth2", monthlyCostCents: 1299, documentationUrl: "https://www.canva.dev", requiredHumanActions: ["Canva Pro subscription"], version: "v1", dependencies: [] }),

  // C010 Analytics Connectors
  provider({ providerId: "ga4", displayName: "Google Analytics 4", category: "analytics", capabilities: ["connection", "property_validation", "health", "available_metrics"], regions: ["GLOBAL"], rateLimitPerMinute: 100, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://developers.google.com/analytics/devguides/config/admin/v1", requiredHumanActions: ["GA4 property setup"], version: "v1", dependencies: [] }),
  provider({ providerId: "search-console", displayName: "Google Search Console", category: "analytics", capabilities: ["connection", "property_validation", "health", "available_metrics"], regions: ["GLOBAL"], rateLimitPerMinute: 60, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://developers.google.com/webmaster-tools", requiredHumanActions: ["Site verification"], version: "v1", dependencies: [] }),
  provider({ providerId: "meta-pixel", displayName: "Meta Pixel", category: "analytics", capabilities: ["connection", "property_validation", "health", "available_metrics"], regions: ["GLOBAL"], rateLimitPerMinute: 100, authentication: "oauth2", monthlyCostCents: 0, documentationUrl: "https://developers.facebook.com/docs/meta-pixel", requiredHumanActions: ["Pixel installation"], version: "v18", dependencies: ["meta-ads"] }),
  provider({ providerId: "tiktok-pixel", displayName: "TikTok Pixel", category: "analytics", capabilities: ["connection", "property_validation", "health", "available_metrics"], regions: ["GLOBAL"], rateLimitPerMinute: 60, authentication: "api_key", monthlyCostCents: 0, documentationUrl: "https://ads.tiktok.com/marketing_api/docs", requiredHumanActions: ["Pixel creation"], version: "1.3", dependencies: ["tiktok-ads"] }),

  // C011 Search Intelligence
  provider({ providerId: "google-search", displayName: "Google Search Intelligence", category: "search_intelligence", capabilities: ["serp_analysis", "keyword_discovery", "competition_discovery", "trend_observation"], regions: ["GLOBAL"], rateLimitPerMinute: 30, authentication: "api_key", monthlyCostCents: 0, documentationUrl: "https://developers.google.com/custom-search", requiredHumanActions: ["Custom Search Engine setup"], version: "v1", dependencies: [] }),

  // C012 SEO Intelligence
  provider({ providerId: "seo-intelligence", displayName: "SEO Intelligence", category: "seo_intelligence", capabilities: ["keyword_opportunity", "ranking_opportunity", "content_gaps", "technical_seo_readiness"], regions: ["GLOBAL"], rateLimitPerMinute: 30, authentication: "api_key", monthlyCostCents: 0, documentationUrl: "https://developers.google.com/webmaster-tools", requiredHumanActions: ["Search Console linkage"], version: "1.0", dependencies: ["search-console"] }),

  // C013 Product Intelligence
  provider({ providerId: "product-intelligence", displayName: "Product Intelligence", category: "product_intelligence", capabilities: ["product_trends", "category_trends", "marketplace_trends", "pricing_intelligence", "competition_intelligence"], regions: ["GLOBAL"], rateLimitPerMinute: 30, authentication: "api_key", monthlyCostCents: 0, documentationUrl: "https://developer.amazonservices.com", requiredHumanActions: [], version: "1.0", dependencies: ["google-search"] }),

  // C014 Buyer Intelligence
  provider({ providerId: "buyer-intelligence", displayName: "Buyer Intelligence", category: "buyer_intelligence", capabilities: ["customer_segments", "buying_behaviour", "purchase_intent", "persona_mapping"], regions: ["GLOBAL"], rateLimitPerMinute: 30, authentication: "api_key", monthlyCostCents: 0, documentationUrl: "https://developers.facebook.com/docs/marketing-api/audiences", requiredHumanActions: [], version: "1.0", dependencies: ["meta-ads"] }),

  // C015 Trend Intelligence
  provider({ providerId: "trend-intelligence", displayName: "Trend Intelligence", category: "trend_intelligence", capabilities: ["trend_detection", "seasonality", "emerging_categories", "opportunity_alerts"], regions: ["GLOBAL"], rateLimitPerMinute: 30, authentication: "api_key", monthlyCostCents: 0, documentationUrl: "https://trends.google.com", requiredHumanActions: [], version: "1.0", dependencies: ["google-search"] }),
];

export function getRealityProvider(providerId: string): RealityProviderDefinition | undefined {
  return REALITY_PROVIDER_CATALOG.find((p) => p.providerId === providerId);
}

export function listRealityProviders(category?: RealityProviderDefinition["category"]): RealityProviderDefinition[] {
  return category
    ? REALITY_PROVIDER_CATALOG.filter((p) => p.category === category)
    : [...REALITY_PROVIDER_CATALOG];
}
