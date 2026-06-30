import { z } from "zod";

export const ACCOUNT_PROVIDER_IDS = [
  "amazon-seller",
  "walmart-marketplace",
  "shopify",
  "tiktok-shop",
  "ebay",
  "google-merchant-center",
  "meta-business",
  "instagram-shop",
  "stripe",
  "cj-dropshipping",
] as const;

export type AccountProviderId = (typeof ACCOUNT_PROVIDER_IDS)[number];

export const ACCOUNT_CONNECTION_STATUSES = [
  "NOT_CONNECTED",
  "PENDING_SETUP",
  "AWAITING_USER_ACTION",
  "CONNECTED",
  "PERMISSION_EXPIRED",
  "ERROR",
  "DISABLED",
] as const;

export type AccountConnectionStatus = (typeof ACCOUNT_CONNECTION_STATUSES)[number];

export const ACCOUNT_EXPIRY_STATUSES = ["VALID", "EXPIRING_SOON", "EXPIRED", "UNKNOWN"] as const;

export type AccountExpiryStatus = (typeof ACCOUNT_EXPIRY_STATUSES)[number];

export const externalAccountSchema = z.object({
  providerId: z.enum(ACCOUNT_PROVIDER_IDS),
  workspaceId: z.string().min(1),
  accountType: z.enum(["grand_king", "founder"]).default("grand_king"),
  displayName: z.string().min(1),
  category: z.enum(["marketplace", "payments", "supplier", "advertising"]),
  connectionStatus: z.enum(ACCOUNT_CONNECTION_STATUSES),
  connectionHealth: z.string(),
  healthScore: z.number().int().min(0).max(100),
  lastValidation: z.string().datetime({ offset: true }).optional(),
  requiredPermissions: z.array(z.string()),
  oauthSupported: z.boolean(),
  apiSupported: z.boolean(),
  requiredHumanSteps: z.array(z.string()),
  expiryStatus: z.enum(ACCOUNT_EXPIRY_STATUSES),
  notes: z.string().default(""),
  credentialsRef: z.string().optional(),
  connectorId: z.string().optional(),
  oauthUrl: z.string().optional(),
  metadata: z.record(z.string()).default({}),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type ExternalAccount = z.infer<typeof externalAccountSchema>;

export type AccountProviderDefinition = {
  providerId: AccountProviderId;
  displayName: string;
  category: ExternalAccount["category"];
  requiredPermissions: string[];
  oauthSupported: boolean;
  apiSupported: boolean;
  requiredHumanSteps: string[];
  setupSteps: string[];
  humanOnlyActions: string[];
  connectorId?: string;
  marketplaceId?: string;
  philosophy: string;
  neverStoresPasswords: true;
};
