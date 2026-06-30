import { z } from "zod";

export const MARKETPLACE_IDS = [
  "amazon",
  "walmart",
  "shopify",
  "tiktok-shop",
  "ebay",
  "google-merchant",
  "facebook-shop",
  "instagram-shop",
] as const;

export type MarketplaceId = (typeof MARKETPLACE_IDS)[number];

export const MARKETPLACE_CONNECTION_STATUSES = [
  "NOT_CONNECTED",
  "CONNECTING",
  "CONNECTED",
  "EXPIRED",
  "ERROR",
] as const;

export type MarketplaceConnectionStatus = (typeof MARKETPLACE_CONNECTION_STATUSES)[number];

export const MARKETPLACE_HEALTH_STATUSES = ["HEALTHY", "DEGRADED", "UNKNOWN", "UNHEALTHY"] as const;

export type MarketplaceHealthStatus = (typeof MARKETPLACE_HEALTH_STATUSES)[number];

export const marketplaceConnectionSchema = z.object({
  marketplaceId: z.enum(MARKETPLACE_IDS),
  workspaceId: z.string().min(1),
  displayName: z.string().min(1),
  status: z.enum(MARKETPLACE_CONNECTION_STATUSES),
  health: z.enum(MARKETPLACE_HEALTH_STATUSES),
  permissionStatus: z.string(),
  availableApis: z.array(z.string()),
  requiredHumanSteps: z.array(z.string()),
  oauthReady: z.boolean(),
  oauthUrl: z.string().optional(),
  connectorId: z.string().optional(),
  credentialsRef: z.string().optional(),
  lastCheckedAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  metadata: z.record(z.string()).default({}),
});

export type MarketplaceConnection = z.infer<typeof marketplaceConnectionSchema>;

export type MarketplaceConnectionGuide = {
  marketplaceId: MarketplaceId;
  displayName: string;
  philosophy: string;
  accountCreationSteps: string[];
  oauthSupported: boolean;
  oauthUrl?: string;
  requiredHumanSteps: string[];
  availableApis: string[];
  neverStoresPasswords: true;
};
