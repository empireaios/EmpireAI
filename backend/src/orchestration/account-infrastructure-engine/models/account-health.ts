import { z } from "zod";

import { ACCOUNT_PROVIDER_IDS } from "./account-provider.js";

export const accountHealthSchema = z.object({
  providerId: z.enum(ACCOUNT_PROVIDER_IDS),
  workspaceId: z.string().min(1),
  healthScore: z.number().int().min(0).max(100),
  lastSuccessfulValidation: z.string().datetime({ offset: true }).optional(),
  lastApiVerification: z.string().datetime({ offset: true }).optional(),
  permissionExpiry: z.string().datetime({ offset: true }).optional(),
  missingConfiguration: z.array(z.string()),
  blockingIssues: z.array(z.string()),
  computedAt: z.string().datetime({ offset: true }),
});

export type AccountHealth = z.infer<typeof accountHealthSchema>;
