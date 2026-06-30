import { z } from "zod";

import { ACCESS_STATE_VALUES } from "./access-state-machine.js";

export const PLATFORM_CATEGORIES = [
  "infrastructure",
  "marketplace",
  "supplier",
  "payments",
  "advertising",
  "analytics",
  "shipping",
  "creative_ai",
] as const;

export type PlatformCategory = (typeof PLATFORM_CATEGORIES)[number];

/** OAR-001 — Empire Access Registry platform definition. */
export const empirePlatformDefinitionSchema = z.object({
  platformId: z.string().min(1),
  displayName: z.string().min(1),
  category: z.enum(PLATFORM_CATEGORIES),
  realityProviderId: z.string().optional(),
  authentication: z.enum(["oauth2", "oauth2_refresh", "api_key", "webhook_secret", "token", "none"]),
  revenueBlocking: z.boolean(),
  architectureOnly: z.boolean(),
  documentationUrl: z.string().url().optional(),
});

export type EmpirePlatformDefinition = z.infer<typeof empirePlatformDefinitionSchema>;

/** OAR-001 — Every external platform EmpireAI must track (Version 1). */
export const EMPIRE_ACCESS_PLATFORMS: EmpirePlatformDefinition[] = [
  { platformId: "github", displayName: "GitHub", category: "infrastructure", authentication: "token", revenueBlocking: false, architectureOnly: false },
  { platformId: "cursor", displayName: "Cursor", category: "infrastructure", authentication: "token", revenueBlocking: false, architectureOnly: true },
  { platformId: "vercel", displayName: "Vercel", category: "infrastructure", authentication: "token", revenueBlocking: false, architectureOnly: false },
  { platformId: "amazon-seller", displayName: "Amazon Seller", category: "marketplace", realityProviderId: "amazon-seller", authentication: "oauth2", revenueBlocking: true, architectureOnly: true, documentationUrl: "https://developer.amazonservices.com" },
  { platformId: "cj-dropshipping", displayName: "CJdropshipping", category: "supplier", realityProviderId: "cj-dropshipping", authentication: "api_key", revenueBlocking: true, architectureOnly: true, documentationUrl: "https://developers.cjdropshipping.com" },
  { platformId: "stripe", displayName: "Stripe", category: "payments", realityProviderId: "stripe", authentication: "api_key", revenueBlocking: true, architectureOnly: true, documentationUrl: "https://stripe.com/docs/api" },
  { platformId: "meta-ads", displayName: "Meta Ads", category: "advertising", realityProviderId: "meta-ads", authentication: "oauth2", revenueBlocking: false, architectureOnly: true, documentationUrl: "https://developers.facebook.com/docs/marketing-apis" },
  { platformId: "ga4", displayName: "Google Analytics", category: "analytics", realityProviderId: "ga4", authentication: "oauth2", revenueBlocking: false, architectureOnly: true, documentationUrl: "https://developers.google.com/analytics" },
  { platformId: "tiktok-shop", displayName: "TikTok Shop", category: "marketplace", realityProviderId: "tiktok-shop", authentication: "oauth2", revenueBlocking: true, architectureOnly: true, documentationUrl: "https://partner.tiktokshop.com" },
  { platformId: "ebay", displayName: "eBay", category: "marketplace", realityProviderId: "ebay", authentication: "oauth2", revenueBlocking: true, architectureOnly: true, documentationUrl: "https://developer.ebay.com" },
  { platformId: "shopee", displayName: "Shopee", category: "marketplace", realityProviderId: "shopee", authentication: "oauth2", revenueBlocking: true, architectureOnly: true, documentationUrl: "https://open.shopee.com" },
  { platformId: "lazada", displayName: "Lazada", category: "marketplace", realityProviderId: "lazada", authentication: "oauth2", revenueBlocking: true, architectureOnly: true, documentationUrl: "https://open.lazada.com" },
  { platformId: "walmart", displayName: "Walmart Marketplace", category: "marketplace", realityProviderId: "walmart", authentication: "oauth2", revenueBlocking: true, architectureOnly: true, documentationUrl: "https://developer.walmart.com" },
  { platformId: "etsy", displayName: "Etsy", category: "marketplace", realityProviderId: "etsy", authentication: "oauth2", revenueBlocking: true, architectureOnly: true, documentationUrl: "https://developers.etsy.com" },
  { platformId: "paypal", displayName: "PayPal", category: "payments", realityProviderId: "paypal", authentication: "oauth2", revenueBlocking: true, architectureOnly: true, documentationUrl: "https://developer.paypal.com" },
  { platformId: "dhl", displayName: "DHL", category: "shipping", authentication: "api_key", revenueBlocking: false, architectureOnly: true },
  { platformId: "fedex", displayName: "FedEx", category: "shipping", authentication: "api_key", revenueBlocking: false, architectureOnly: true },
  { platformId: "openai", displayName: "OpenAI", category: "creative_ai", realityProviderId: "openai", authentication: "api_key", revenueBlocking: false, architectureOnly: false, documentationUrl: "https://platform.openai.com/docs" },
  { platformId: "anthropic", displayName: "Anthropic", category: "creative_ai", authentication: "api_key", revenueBlocking: false, architectureOnly: true },
  { platformId: "google-ai", displayName: "Google AI", category: "creative_ai", authentication: "api_key", revenueBlocking: false, architectureOnly: true, documentationUrl: "https://ai.google.dev" },
];

export function getEmpirePlatform(platformId: string): EmpirePlatformDefinition | undefined {
  return EMPIRE_ACCESS_PLATFORMS.find((p) => p.platformId === platformId);
}

export const empireAccessRecordSchema = z.object({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  platformId: z.string().min(1),
  displayName: z.string().min(1),
  category: z.enum(PLATFORM_CATEGORIES),
  accessState: z.enum(ACCESS_STATE_VALUES),
  authentication: z.string(),
  revenueBlocking: z.boolean(),
  credentialsRef: z.string().nullable(),
  scopes: z.array(z.string()),
  allowedActions: z.array(z.string()),
  blockedActions: z.array(z.string()),
  approvalRequired: z.boolean(),
  restrictions: z.array(z.string()),
  health: z.enum(["HEALTHY", "WARNING", "FAILED", "DISABLED"]),
  lastSync: z.string().datetime({ offset: true }).nullable(),
  owner: z.string().nullable(),
  updatedAt: z.string().datetime({ offset: true }),
});

export const empireAccessRegistrySchema = z.object({
  moduleId: z.literal("operational-access"),
  missionId: z.literal("OAR-001"),
  workspaceId: z.string().min(1),
  records: z.array(empireAccessRecordSchema),
  summary: z.object({
    totalPlatforms: z.number().int(),
    connected: z.number().int(),
    verified: z.number().int(),
    ready: z.number().int(),
    active: z.number().int(),
    blocked: z.number().int(),
    authRequired: z.number().int(),
    revenueBlockingGaps: z.number().int(),
    architectureComplete: z.boolean(),
  }),
  computedAt: z.string().datetime({ offset: true }),
});

export type EmpireAccessRecord = z.infer<typeof empireAccessRecordSchema>;
export type EmpireAccessRegistry = z.infer<typeof empireAccessRegistrySchema>;
