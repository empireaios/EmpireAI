import { z } from "zod";

/** REAL-008 — Country × Marketplace operations model (unlimited countries/marketplaces). */
export const DISTRIBUTION_STATUSES = [
  "LIVE",
  "PENDING",
  "BLOCKED",
  "AWAITING_APPROVAL",
  "ARCHIVED",
  "READY",
] as const;

export type DistributionStatus = (typeof DISTRIBUTION_STATUSES)[number];

export const CONNECTION_STATUSES = [
  "CONNECTED",
  "VERIFIED",
  "READY",
  "ACTIVE",
  "PENDING",
  "BLOCKED",
  "NOT_CONNECTED",
  "AUTH_REQUIRED",
] as const;

export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

export const SUPPORTED_GLOBAL_MARKETPLACE_FAMILIES = [
  "amazon",
  "ebay",
  "etsy",
  "shopee",
  "lazada",
  "tiktok-shop",
  "walmart",
  "shopify",
  "woocommerce",
  "rakuten",
  "yahoo-shopping",
  "mercari",
  "future",
] as const;

export const countryMarketplaceProductSchema = z.object({
  productId: z.string(),
  supplierProductId: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  title: z.string(),
  listingId: z.string().optional(),
  status: z.enum(DISTRIBUTION_STATUSES),
  revenueUsd: z.number().nonnegative(),
  profitUsd: z.number(),
  orders: z.number().int().nonnegative(),
  traffic: z.number().int().nonnegative(),
  conversionPercent: z.number().min(0).max(100),
  listingHealth: z.number().min(0).max(100),
  supplierHealth: z.number().min(0).max(100),
  marketplaceReadiness: z.number().min(0).max(100),
  operationalAccessStatus: z.string(),
  executiveRecommendation: z.string(),
  nextAction: z.string(),
});

export type CountryMarketplaceProduct = z.infer<typeof countryMarketplaceProductSchema>;

export const countryMarketplaceSlotSchema = z.object({
  slotId: z.string(),
  countryCode: z.string(),
  countryName: z.string(),
  regionId: z.string(),
  currency: z.string(),
  marketplaceId: z.string(),
  marketplaceName: z.string(),
  marketplaceFamily: z.string(),
  providerId: z.string(),
  connectionStatus: z.enum(CONNECTION_STATUSES),
  operationalAccessStatus: z.string(),
  marketplaceReadiness: z.number().min(0).max(100),
  productsLive: z.number().int().nonnegative(),
  productsPending: z.number().int().nonnegative(),
  productsBlocked: z.number().int().nonnegative(),
  productsAwaitingApproval: z.number().int().nonnegative(),
  revenueUsd: z.number().nonnegative(),
  profitUsd: z.number(),
  orders: z.number().int().nonnegative(),
  traffic: z.number().int().nonnegative(),
  conversionPercent: z.number().min(0).max(100),
  supplierHealth: z.number().min(0).max(100),
  listingHealth: z.number().min(0).max(100),
  executiveRecommendation: z.string(),
  nextAction: z.string(),
  products: z.array(countryMarketplaceProductSchema),
});

export type CountryMarketplaceSlot = z.infer<typeof countryMarketplaceSlotSchema>;

export const countryOperationsViewSchema = z.object({
  countryCode: z.string(),
  countryName: z.string(),
  regionId: z.string(),
  currency: z.string(),
  status: z.enum(["ACTIVE", "READY", "BLOCKED", "PENDING"]),
  marketplacesConnected: z.number().int(),
  marketplacesPending: z.number().int(),
  marketplacesBlocked: z.number().int(),
  productsDistributed: z.number().int(),
  productsLive: z.number().int(),
  productsAwaitingApproval: z.number().int(),
  revenueUsd: z.number().nonnegative(),
  profitUsd: z.number(),
  orders: z.number().int(),
  conversionPercent: z.number(),
  marketplaceTabs: z.array(countryMarketplaceSlotSchema),
  executiveRecommendation: z.string(),
  nextRecommendedMarketplace: z.string().nullable(),
});

export type CountryOperationsView = z.infer<typeof countryOperationsViewSchema>;

export const globalMarketplaceOperationsSchema = z.object({
  workspaceId: z.string(),
  companyId: z.string(),
  countries: z.array(countryOperationsViewSchema),
  slots: z.array(countryMarketplaceSlotSchema),
  computedAt: z.string().datetime({ offset: true }),
});

export type GlobalMarketplaceOperations = z.infer<typeof globalMarketplaceOperationsSchema>;
