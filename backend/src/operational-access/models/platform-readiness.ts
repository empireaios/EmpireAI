import { z } from "zod";

const readinessItemSchema = z.object({
  capability: z.string(),
  supported: z.boolean(),
  ready: z.boolean(),
  missingRequirements: z.array(z.string()),
});

/** OAR-005 — Amazon Seller SP-API readiness map. */
export const amazonAccessReadinessSchema = z.object({
  platformId: z.literal("amazon-seller"),
  missionId: z.literal("OAR-005"),
  accessState: z.string(),
  oauth: readinessItemSchema,
  roles: readinessItemSchema,
  scopes: readinessItemSchema,
  listings: readinessItemSchema,
  orders: readinessItemSchema,
  inventory: readinessItemSchema,
  reports: readinessItemSchema,
  notifications: readinessItemSchema,
  settlement: readinessItemSchema,
  regionalMarketplaces: readinessItemSchema,
  overallPercent: z.number().min(0).max(100),
  blockers: z.array(z.string()),
  computedAt: z.string().datetime({ offset: true }),
});

/** OAR-006 — CJdropshipping API readiness map. */
export const cjAccessReadinessSchema = z.object({
  platformId: z.literal("cj-dropshipping"),
  missionId: z.literal("OAR-006"),
  accessState: z.string(),
  productSearch: readinessItemSchema,
  productDetail: readinessItemSchema,
  inventory: readinessItemSchema,
  shippingEstimate: readinessItemSchema,
  orderCreate: readinessItemSchema,
  tracking: readinessItemSchema,
  fulfillment: readinessItemSchema,
  supplierStatus: readinessItemSchema,
  overallPercent: z.number().min(0).max(100),
  blockers: z.array(z.string()),
  computedAt: z.string().datetime({ offset: true }),
});

/** OAR-007 — Future marketplace provider readiness. */
export const marketplaceAccessReadinessSchema = z.object({
  platformId: z.string(),
  displayName: z.string(),
  missionId: z.literal("OAR-007"),
  providerStatus: z.enum(["FUTURE", "ARCHITECTURE_READY", "CREDENTIALS_PENDING", "CONNECTED"]),
  accessState: z.string(),
  publish: readinessItemSchema,
  orders: readinessItemSchema,
  inventory: readinessItemSchema,
  webhooks: readinessItemSchema,
  overallPercent: z.number().min(0).max(100),
  blockers: z.array(z.string()),
});

export type AmazonAccessReadiness = z.infer<typeof amazonAccessReadinessSchema>;
export type CjAccessReadiness = z.infer<typeof cjAccessReadinessSchema>;
export type MarketplaceAccessReadiness = z.infer<typeof marketplaceAccessReadinessSchema>;

export const FUTURE_MARKETPLACE_IDS = ["ebay", "shopee", "lazada", "tiktok-shop", "walmart", "etsy"] as const;

function readinessItem(
  capability: string,
  supported: boolean,
  ready: boolean,
  missing: string[] = [],
): z.infer<typeof readinessItemSchema> {
  return { capability, supported, ready, missingRequirements: missing };
}

function percentReady(items: z.infer<typeof readinessItemSchema>[]): number {
  const supported = items.filter((i) => i.supported);
  if (supported.length === 0) return 0;
  return Math.round((supported.filter((i) => i.ready).length / supported.length) * 100);
}

export function buildAmazonAccessReadiness(accessState: string, hasCredentials: boolean, scopes: string[]): AmazonAccessReadiness {
  const connected = ["CONNECTED", "VERIFIED", "READY", "ACTIVE"].includes(accessState);
  const verified = ["VERIFIED", "READY", "ACTIVE"].includes(accessState);
  const archBlock = ["Architecture-only: SP-API OAuth not implemented", "Seller Central developer app required"];

  const items = {
    oauth: readinessItem("oauth", true, false, hasCredentials ? ["OAuth flow pending REAL-002B"] : archBlock),
    roles: readinessItem("roles", true, verified, verified ? [] : ["IAM role mapping after OAuth"]),
    scopes: readinessItem("scopes", true, scopes.length > 0, scopes.length > 0 ? [] : ["sellingpartnerapi::catalog", "sellingpartnerapi::orders"]),
    listings: readinessItem("listings", true, verified, verified ? [] : ["Listings API scope required"]),
    orders: readinessItem("orders", true, verified, verified ? [] : ["Orders API scope required"]),
    inventory: readinessItem("inventory", true, connected, connected ? [] : ["Connect first"]),
    reports: readinessItem("reports", true, connected, connected ? [] : ["Reports API after verification"]),
    notifications: readinessItem("notifications", true, false, ["SQS destination registration pending"]),
    settlement: readinessItem("settlement", true, false, ["Finances API after live sales"]),
    regionalMarketplaces: readinessItem("regional_marketplaces", true, false, ["Marketplace IDs per region after account link"]),
  };

  const blockers: string[] = [];
  if (!hasCredentials) blockers.push("No Amazon credentials in vault");
  if (!verified) blockers.push("SP-API not verified");
  for (const item of Object.values(items)) {
    if (item.supported && !item.ready && item.missingRequirements.length > 0) {
      blockers.push(`${item.capability}: ${item.missingRequirements[0]}`);
    }
  }

  return {
    platformId: "amazon-seller",
    missionId: "OAR-005",
    accessState,
    ...items,
    overallPercent: percentReady(Object.values(items)),
    blockers: [...new Set(blockers)].slice(0, 6),
    computedAt: new Date().toISOString(),
  };
}

export function buildCjAccessReadiness(accessState: string, hasCredentials: boolean): CjAccessReadiness {
  const connected = ["CONNECTED", "VERIFIED", "READY", "ACTIVE"].includes(accessState);
  const verified = ["VERIFIED", "READY", "ACTIVE"].includes(accessState);

  const items = {
    productSearch: readinessItem("product_search", true, connected, connected ? [] : ["CJ API key required"]),
    productDetail: readinessItem("product_detail", true, connected, connected ? [] : ["Connect CJ account"]),
    inventory: readinessItem("inventory", true, verified, verified ? [] : ["Verify API permissions"]),
    shippingEstimate: readinessItem("shipping_estimate", true, verified, verified ? [] : ["Shipping API scope"]),
    orderCreate: readinessItem("order_create", true, false, ["Live order create blocked until founder approval"]),
    tracking: readinessItem("tracking", true, verified, verified ? [] : ["Tracking API after verification"]),
    fulfillment: readinessItem("fulfillment", true, false, ["Fulfillment bridge architecture ready; live blocked"]),
    supplierStatus: readinessItem("supplier_status", true, connected, connected ? [] : ["Supplier health check"]),
  };

  const blockers: string[] = [];
  if (!hasCredentials) blockers.push("No CJ API key in credential vault");
  if (!verified) blockers.push("CJ API not verified");

  return {
    platformId: "cj-dropshipping",
    missionId: "OAR-006",
    accessState,
    ...items,
    overallPercent: percentReady(Object.values(items)),
    blockers,
    computedAt: new Date().toISOString(),
  };
}

export function buildMarketplaceAccessReadiness(
  platformId: string,
  displayName: string,
  accessState: string,
  hasCredentials: boolean,
): MarketplaceAccessReadiness {
  const connected = ["CONNECTED", "VERIFIED", "READY", "ACTIVE"].includes(accessState);
  let providerStatus: MarketplaceAccessReadiness["providerStatus"] = "FUTURE";
  if (connected) providerStatus = "CONNECTED";
  else if (hasCredentials) providerStatus = "CREDENTIALS_PENDING";
  else providerStatus = "ARCHITECTURE_READY";

  const items = {
    publish: readinessItem("publish", true, false, ["Provider record ready; live OAuth pending"]),
    orders: readinessItem("orders", true, connected, connected ? [] : ["Connect marketplace account"]),
    inventory: readinessItem("inventory", true, connected, connected ? [] : ["Inventory sync after connect"]),
    webhooks: readinessItem("webhooks", true, false, ["Webhook registration after OAuth"]),
  };

  return {
    platformId,
    displayName,
    missionId: "OAR-007",
    providerStatus,
    accessState,
    ...items,
    overallPercent: percentReady(Object.values(items)),
    blockers: connected ? [] : [`${displayName}: architecture ready, credentials required`],
  };
}
