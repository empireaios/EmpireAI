import { z } from "zod";

import { isAmazonLiveCommerceActivated } from "../../../orchestration/version-1-activation/version-1-activation-config.js";

/** REAL-003 — Supported marketplace adapters (provider-agnostic). */
export const MARKETPLACE_PUBLISH_IDS = [
  "amazon",
  "ebay",
  "etsy",
  "shopify",
  "woocommerce",
  "shopee",
  "lazada",
] as const;

export type MarketplacePublishId = (typeof MARKETPLACE_PUBLISH_IDS)[number];

export const marketplaceAdapterSchema = z.object({
  marketplaceId: z.enum(MARKETPLACE_PUBLISH_IDS),
  displayName: z.string(),
  adapterStatus: z.enum(["ARCHITECTURE_READY", "CREDENTIALS_PENDING", "CONNECTED", "LIVE_BLOCKED"]),
  supportsDraft: z.boolean(),
  supportsPublish: z.boolean(),
  requiresKingApproval: z.boolean(),
  formatterId: z.string(),
  validatorId: z.string(),
});

export type MarketplaceAdapter = z.infer<typeof marketplaceAdapterSchema>;

export const MARKETPLACE_ADAPTERS: MarketplaceAdapter[] = [
  { marketplaceId: "amazon", displayName: "Amazon", adapterStatus: "ARCHITECTURE_READY", supportsDraft: true, supportsPublish: false, requiresKingApproval: true, formatterId: "amazon-sp-api", validatorId: "amazon-listing" },
  { marketplaceId: "ebay", displayName: "eBay", adapterStatus: "ARCHITECTURE_READY", supportsDraft: true, supportsPublish: false, requiresKingApproval: true, formatterId: "ebay-trading", validatorId: "ebay-listing" },
  { marketplaceId: "etsy", displayName: "Etsy", adapterStatus: "ARCHITECTURE_READY", supportsDraft: true, supportsPublish: false, requiresKingApproval: true, formatterId: "etsy-v3", validatorId: "etsy-listing" },
  { marketplaceId: "shopify", displayName: "Shopify", adapterStatus: "ARCHITECTURE_READY", supportsDraft: true, supportsPublish: false, requiresKingApproval: true, formatterId: "shopify-admin", validatorId: "shopify-product" },
  { marketplaceId: "woocommerce", displayName: "WooCommerce", adapterStatus: "ARCHITECTURE_READY", supportsDraft: true, supportsPublish: false, requiresKingApproval: true, formatterId: "woo-rest", validatorId: "woo-product" },
  { marketplaceId: "shopee", displayName: "Shopee", adapterStatus: "ARCHITECTURE_READY", supportsDraft: true, supportsPublish: false, requiresKingApproval: true, formatterId: "shopee-open", validatorId: "shopee-listing" },
  { marketplaceId: "lazada", displayName: "Lazada", adapterStatus: "ARCHITECTURE_READY", supportsDraft: true, supportsPublish: false, requiresKingApproval: true, formatterId: "lazada-open", validatorId: "lazada-listing" },
];

/** Resolve adapter with live activation state for Version 1 production marketplace (Amazon). */
export function resolveMarketplaceAdapter(
  marketplaceId: MarketplacePublishId,
  env: NodeJS.ProcessEnv = process.env,
): MarketplaceAdapter {
  const base = MARKETPLACE_ADAPTERS.find((a) => a.marketplaceId === marketplaceId)!;
  if (marketplaceId === "amazon" && isAmazonLiveCommerceActivated(env)) {
    return {
      ...base,
      adapterStatus: "CONNECTED",
      supportsPublish: true,
    };
  }
  return base;
}

export const marketplaceListingPackageSchema = z.object({
  packageId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  productId: z.string(),
  marketplaceId: z.enum(MARKETPLACE_PUBLISH_IDS),
  title: z.string(),
  description: z.string(),
  bulletPoints: z.array(z.string()),
  specifications: z.record(z.string()),
  price: z.number().nonnegative(),
  currency: z.string().default("USD"),
  images: z.array(z.string()),
  status: z.enum(["DRAFT", "VALIDATED", "QUEUED", "PUBLISH_BLOCKED", "PUBLISHED", "FAILED"]),
  governanceApproved: z.boolean(),
  kingApproved: z.boolean(),
  blockers: z.array(z.string()),
  formattedPayload: z.record(z.unknown()).optional(),
  computedAt: z.string().datetime({ offset: true }),
});

export type MarketplaceListingPackage = z.infer<typeof marketplaceListingPackageSchema>;
