import { z } from "zod";

/** RS-001 — Amazon Seller capability domains (metadata only). */
export const AMAZON_CAPABILITY_DOMAINS = [
  "listings",
  "catalog",
  "inventory",
  "pricing",
  "orders",
  "returns",
  "reviews",
  "fulfillment",
  "settlement",
  "advertising",
  "reports",
  "notifications",
  "regional_marketplaces",
  "compliance",
] as const;

export type AmazonCapabilityDomain = (typeof AMAZON_CAPABILITY_DOMAINS)[number];

export const amazonCapabilityDomainSchema = z.object({
  domain: z.enum(AMAZON_CAPABILITY_DOMAINS),
  displayName: z.string(),
  description: z.string(),
  spApiOperations: z.array(z.string()),
  requiredPermissions: z.array(z.string()),
  regionalScope: z.array(z.string()),
  humanActionsRequired: z.array(z.string()),
  documentationUrl: z.string(),
});

export const amazonCapabilityProfileSchema = z.object({
  providerId: z.literal("amazon-seller"),
  displayName: z.literal("Amazon Seller"),
  authenticationMethod: z.literal("oauth2"),
  documentationUrl: z.literal("https://developer.amazonservices.com"),
  domains: z.array(amazonCapabilityDomainSchema),
  regionalMarketplaces: z.array(z.object({
    marketplaceId: z.string(),
    countryCode: z.string(),
    displayName: z.string(),
    currency: z.string(),
  })),
  computedAt: z.string().datetime({ offset: true }),
});

export type AmazonCapabilityDomainDefinition = z.infer<typeof amazonCapabilityDomainSchema>;
export type AmazonCapabilityProfile = z.infer<typeof amazonCapabilityProfileSchema>;

export const AMAZON_REGIONAL_MARKETPLACES = [
  { marketplaceId: "ATVPDKIKX0DER", countryCode: "US", displayName: "Amazon US", currency: "USD" },
  { marketplaceId: "A1F83G8C2ARO7P", countryCode: "GB", displayName: "Amazon UK", currency: "GBP" },
  { marketplaceId: "A1PA6795UKMFR9", countryCode: "DE", displayName: "Amazon DE", currency: "EUR" },
  { marketplaceId: "A13V1IB3VIYZZH", countryCode: "FR", displayName: "Amazon FR", currency: "EUR" },
  { marketplaceId: "APJ6JRA9NG5V4", countryCode: "IT", displayName: "Amazon IT", currency: "EUR" },
  { marketplaceId: "A1RKKUPIHCS9HS", countryCode: "ES", displayName: "Amazon ES", currency: "EUR" },
  { marketplaceId: "A1VC38T7YXB528", countryCode: "JP", displayName: "Amazon JP", currency: "JPY" },
  { marketplaceId: "A2EUQ1WTGCTBG2", countryCode: "CA", displayName: "Amazon CA", currency: "CAD" },
  { marketplaceId: "A1AM78C64UM0Y8", countryCode: "MX", displayName: "Amazon MX", currency: "MXN" },
  { marketplaceId: "A39IBJ37TRP1C6", countryCode: "AU", displayName: "Amazon AU", currency: "AUD" },
  { marketplaceId: "A21TJRUUN4KGV", countryCode: "IN", displayName: "Amazon IN", currency: "INR" },
  { marketplaceId: "A19VAU5U5O7RUS", countryCode: "SG", displayName: "Amazon SG", currency: "SGD" },
] as const;

export const AMAZON_DOMAIN_DEFINITIONS: AmazonCapabilityDomainDefinition[] = [
  { domain: "listings", displayName: "Listings", description: "Create, update, and manage product listings", spApiOperations: ["putListingsItem", "patchListingsItem", "deleteListingsItem"], requiredPermissions: ["sellingpartnerapi::listings"], regionalScope: ["GLOBAL"], humanActionsRequired: ["Seller Central account approval"], documentationUrl: "https://developer-docs.amazon.com/sp-api/docs/listings-items-api-v2021-08-01-reference" },
  { domain: "catalog", displayName: "Catalog", description: "Catalog items, product types, and browse nodes", spApiOperations: ["searchCatalogItems", "getCatalogItem"], requiredPermissions: ["sellingpartnerapi::catalog"], regionalScope: ["GLOBAL"], humanActionsRequired: [], documentationUrl: "https://developer-docs.amazon.com/sp-api/docs/catalog-items-api-v2022-04-01-reference" },
  { domain: "inventory", displayName: "Inventory", description: "FBA and merchant-fulfilled inventory levels", spApiOperations: ["getInventorySummaries", "updateInventory"], requiredPermissions: ["sellingpartnerapi::inventory"], regionalScope: ["GLOBAL"], humanActionsRequired: [], documentationUrl: "https://developer-docs.amazon.com/sp-api/docs/fba-inventory-api-v1-reference" },
  { domain: "pricing", displayName: "Pricing", description: "Competitive pricing and automated repricing", spApiOperations: ["getPricing", "putPricing"], requiredPermissions: ["sellingpartnerapi::pricing"], regionalScope: ["GLOBAL"], humanActionsRequired: [], documentationUrl: "https://developer-docs.amazon.com/sp-api/docs/product-pricing-api-v0-reference" },
  { domain: "orders", displayName: "Orders", description: "Order retrieval, acknowledgment, and shipment", spApiOperations: ["getOrders", "confirmShipment"], requiredPermissions: ["sellingpartnerapi::orders"], regionalScope: ["GLOBAL"], humanActionsRequired: [], documentationUrl: "https://developer-docs.amazon.com/sp-api/docs/orders-api-v0-reference" },
  { domain: "returns", displayName: "Returns", description: "Return requests and disposition", spApiOperations: ["getReturnReasonCodes"], requiredPermissions: ["sellingpartnerapi::orders"], regionalScope: ["GLOBAL"], humanActionsRequired: [], documentationUrl: "https://developer-docs.amazon.com/sp-api/docs/returns-api-reference" },
  { domain: "reviews", displayName: "Reviews", description: "Product review and seller feedback metrics", spApiOperations: ["getItemReviewTopics"], requiredPermissions: ["sellingpartnerapi::reports"], regionalScope: ["GLOBAL"], humanActionsRequired: [], documentationUrl: "https://developer-docs.amazon.com/sp-api/docs/customer-reviews-api-reference" },
  { domain: "fulfillment", displayName: "Fulfillment", description: "FBA inbound, outbound, and fulfillment orders", spApiOperations: ["createFulfillmentOrder", "getFulfillmentOrder"], requiredPermissions: ["sellingpartnerapi::fulfillment"], regionalScope: ["GLOBAL"], humanActionsRequired: ["FBA enrollment"], documentationUrl: "https://developer-docs.amazon.com/sp-api/docs/fulfillment-outbound-api-v2020-07-01-reference" },
  { domain: "settlement", displayName: "Settlement", description: "Financial events, disbursements, and fees", spApiOperations: ["listFinancialEvents", "listFinancialEventGroups"], requiredPermissions: ["sellingpartnerapi::finances"], regionalScope: ["GLOBAL"], humanActionsRequired: ["Bank account verification"], documentationUrl: "https://developer-docs.amazon.com/sp-api/docs/finances-api-v0-reference" },
  { domain: "advertising", displayName: "Advertising", description: "Sponsored Products, Brands, and Display", spApiOperations: ["createCampaign", "getCampaign"], requiredPermissions: ["advertising::campaign_management"], regionalScope: ["GLOBAL"], humanActionsRequired: ["Amazon Ads account"], documentationUrl: "https://advertising.amazon.com/API/docs/en-us" },
  { domain: "reports", displayName: "Reports", description: "Business, inventory, and performance reports", spApiOperations: ["createReport", "getReport"], requiredPermissions: ["sellingpartnerapi::reports"], regionalScope: ["GLOBAL"], humanActionsRequired: [], documentationUrl: "https://developer-docs.amazon.com/sp-api/docs/reports-api-v2021-06-30-reference" },
  { domain: "notifications", displayName: "Notifications", description: "SQS/event bridge subscription for order and listing events", spApiOperations: ["createSubscription", "getSubscription"], requiredPermissions: ["sellingpartnerapi::notifications"], regionalScope: ["GLOBAL"], humanActionsRequired: ["SQS queue setup"], documentationUrl: "https://developer-docs.amazon.com/sp-api/docs/notifications-api-v1-reference" },
  { domain: "regional_marketplaces", displayName: "Regional Marketplaces", description: "Multi-marketplace enrollment and localization", spApiOperations: ["getMarketplaceParticipations"], requiredPermissions: ["sellingpartnerapi::sellers"], regionalScope: ["GLOBAL"], humanActionsRequired: ["Marketplace enrollment per region"], documentationUrl: "https://developer-docs.amazon.com/sp-api/docs/sellers-api-v1-reference" },
  { domain: "compliance", displayName: "Compliance", description: "Product safety, restricted products, and regulatory", spApiOperations: ["getComplianceDocument", "submitComplianceDocument"], requiredPermissions: ["sellingpartnerapi::compliance"], regionalScope: ["GLOBAL"], humanActionsRequired: ["Category approval", "Brand registry"], documentationUrl: "https://developer-docs.amazon.com/sp-api/docs/product-compliance-api-reference" },
];
