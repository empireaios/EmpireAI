import { z } from "zod";

import { MARKETPLACE_IDS } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";
import { MARKETPLACE_ACCOUNT_TYPES } from "./marketplace-connection-record.js";

export const marketplacePublishingReadinessSchema = z.object({
  workspaceId: z.string().min(1),
  accountType: z.enum(MARKETPLACE_ACCOUNT_TYPES).default("GRAND_KING"),
  readyMarketplaces: z.array(z.enum(MARKETPLACE_IDS)),
  blockedMarketplaces: z.array(
    z.object({
      marketplaceId: z.enum(MARKETPLACE_IDS),
      displayName: z.string(),
      reason: z.string(),
    }),
  ),
  actionRequiredMarketplaces: z.array(
    z.object({
      marketplaceId: z.enum(MARKETPLACE_IDS),
      displayName: z.string(),
      pendingHumanActions: z.number().int().min(0),
      missingScopes: z.array(z.string()),
    }),
  ),
  overallMarketplaceReadiness: z.number().int().min(0).max(100),
  computedAt: z.string().datetime({ offset: true }),
});

export type MarketplacePublishingReadiness = z.infer<typeof marketplacePublishingReadinessSchema>;
