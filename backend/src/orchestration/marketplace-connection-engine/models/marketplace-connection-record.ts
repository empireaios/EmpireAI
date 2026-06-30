import { z } from "zod";

import { MARKETPLACE_IDS } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";

export const MARKETPLACE_ACCOUNT_TYPES = ["GRAND_KING", "FOUNDER"] as const;
export type MarketplaceAccountType = (typeof MARKETPLACE_ACCOUNT_TYPES)[number];

export const MARKETPLACE_CONNECTION_RECORD_STATUSES = [
  "NOT_CONNECTED",
  "CONNECTING",
  "AWAITING_USER_ACTION",
  "CONNECTED",
  "EXPIRED",
  "ERROR",
  "DISABLED",
] as const;
export type MarketplaceConnectionRecordStatus = (typeof MARKETPLACE_CONNECTION_RECORD_STATUSES)[number];

export const OAUTH_STATUSES = ["NOT_STARTED", "PENDING", "AUTHORIZED", "EXPIRED", "REVOKED"] as const;
export type OAuthStatus = (typeof OAUTH_STATUSES)[number];

export const API_STATUSES = ["NOT_CONFIGURED", "CONFIGURED", "VERIFIED", "ERROR"] as const;
export type ApiStatus = (typeof API_STATUSES)[number];

export const PERMISSION_STATUSES = ["NOT_GRANTED", "PARTIAL", "GRANTED", "EXPIRED"] as const;
export type PermissionStatus = (typeof PERMISSION_STATUSES)[number];

export const marketplaceConnectionRecordSchema = z.object({
  marketplaceId: z.enum(MARKETPLACE_IDS),
  workspaceId: z.string().min(1),
  accountType: z.enum(MARKETPLACE_ACCOUNT_TYPES).default("GRAND_KING"),
  displayName: z.string().min(1),
  connectionStatus: z.enum(MARKETPLACE_CONNECTION_RECORD_STATUSES),
  connectionHealth: z.string(),
  oauthStatus: z.enum(OAUTH_STATUSES),
  apiStatus: z.enum(API_STATUSES),
  permissionStatus: z.enum(PERMISSION_STATUSES),
  requiredScopes: z.array(z.string()),
  grantedScopes: z.array(z.string()),
  missingScopes: z.array(z.string()),
  setupSteps: z.array(z.string()),
  requiredHumanSteps: z.array(z.string()),
  lastVerifiedAt: z.string().datetime({ offset: true }).optional(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  notes: z.string().default(""),
  credentialsRef: z.string().optional(),
  providerId: z.string(),
  oauthSupported: z.boolean(),
  apiKeySupported: z.boolean(),
  manualSetupRequired: z.boolean(),
  unsupportedAutomationAreas: z.array(z.string()),
  pendingHumanActions: z.number().int().min(0),
  metadata: z.record(z.string()).default({}),
  updatedAt: z.string().datetime({ offset: true }),
});

export type MarketplaceConnectionRecord = z.infer<typeof marketplaceConnectionRecordSchema>;
