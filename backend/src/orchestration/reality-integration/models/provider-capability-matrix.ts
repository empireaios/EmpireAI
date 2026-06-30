import { z } from "zod";

import { REALITY_PROVIDER_CATEGORIES, AUTHENTICATION_METHODS } from "./reality-integration.js";

/** REAL-001 — Provider capability matrix (metadata only, no implementation). */
export const providerCapabilityMatrixEntrySchema = z.object({
  providerId: z.string().min(1),
  displayName: z.string().min(1),
  category: z.enum(REALITY_PROVIDER_CATEGORIES),
  authenticationMethod: z.enum(AUTHENTICATION_METHODS),
  supportsOAuth: z.boolean(),
  supportsApiKey: z.boolean(),
  supportsWebhook: z.boolean(),
  oauthScopes: z.array(z.string()),
  rateLimitsPerMinute: z.number().int().min(0),
  requiredPermissions: z.array(z.string()),
  requiredBusinessVerification: z.array(z.string()),
  sandboxAvailable: z.boolean(),
  productionRequirements: z.array(z.string()),
  documentationUrl: z.string().min(1),
});

export const providerCapabilityMatrixSchema = z.object({
  providers: z.array(providerCapabilityMatrixEntrySchema),
  totalProviders: z.number().int().min(0),
  computedAt: z.string().datetime({ offset: true }),
});

export type ProviderCapabilityMatrixEntry = z.infer<typeof providerCapabilityMatrixEntrySchema>;
export type ProviderCapabilityMatrix = z.infer<typeof providerCapabilityMatrixSchema>;
