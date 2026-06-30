import { z } from "zod";

/** RS-005 — Amazon Mission Control dashboard. */
export const amazonMissionControlDashboardSchema = z.object({
  moduleId: z.literal("amazon-global-seller"),
  missionId: z.literal("RS-001-RS-005"),
  amazonAccountStatus: z.object({
    connected: z.boolean(),
    lifecycle: z.string(),
    providerId: z.literal("amazon-seller"),
  }),
  amazonRuntimeStatus: z.object({
    pluginId: z.string(),
    enabled: z.boolean(),
    certificationState: z.string(),
    executionState: z.string(),
    capabilitiesDeclared: z.number().int().min(0),
  }),
  listingReadiness: z.object({
    averagePercent: z.number().min(0).max(100),
    readyCount: z.number().int().min(0),
    blockedCount: z.number().int().min(0),
  }),
  productsReady: z.array(z.object({ listingId: z.string(), sku: z.string(), publishReadinessPercent: z.number() })),
  productsBlocked: z.array(z.object({ listingId: z.string(), sku: z.string(), reason: z.string() })),
  nextHumanAction: z.string().nullable(),
  commercialReadinessPercent: z.number().min(0).max(100),
  computedAt: z.string().datetime({ offset: true }),
});

export type AmazonMissionControlDashboard = z.infer<typeof amazonMissionControlDashboardSchema>;
