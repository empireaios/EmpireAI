import { z } from "zod";

import { ACCESS_STATE_VALUES } from "./access-state-machine.js";
import { platformPermissionMatrixSchema } from "./permission-matrix.js";
import { amazonAccessReadinessSchema, cjAccessReadinessSchema, marketplaceAccessReadinessSchema } from "./platform-readiness.js";

/** OAR-008 — Operational Access Dashboard. */
export const accessDashboardSchema = z.object({
  moduleId: z.literal("operational-access"),
  missionId: z.literal("OAR-008"),
  workspaceId: z.string(),
  companyId: z.string(),
  realCommerceReadinessPercent: z.number().min(0).max(100),
  architectureComplete: z.boolean(),
  connectedPlatforms: z.array(z.object({
    platformId: z.string(),
    displayName: z.string(),
    accessState: z.enum(ACCESS_STATE_VALUES),
  })),
  blockedPlatforms: z.array(z.object({
    platformId: z.string(),
    displayName: z.string(),
    accessState: z.enum(ACCESS_STATE_VALUES),
    restrictions: z.array(z.string()),
  })),
  readyPlatforms: z.array(z.object({
    platformId: z.string(),
    displayName: z.string(),
  })),
  requiredAuthorizations: z.array(z.object({
    platformId: z.string(),
    displayName: z.string(),
    authorizationType: z.string(),
    priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  })),
  highestPriorityAccessAction: z.object({
    platformId: z.string(),
    displayName: z.string(),
    action: z.string(),
    reason: z.string(),
  }).nullable(),
  revenueBlockingGaps: z.array(z.object({
    platformId: z.string(),
    displayName: z.string(),
    gap: z.string(),
  })),
  permissionMatrices: z.array(platformPermissionMatrixSchema),
  amazonReadiness: amazonAccessReadinessSchema,
  cjReadiness: cjAccessReadinessSchema,
  marketplaceReadiness: z.array(marketplaceAccessReadinessSchema),
  summary: z.object({
    totalPlatforms: z.number().int(),
    connected: z.number().int(),
    blocked: z.number().int(),
    ready: z.number().int(),
    active: z.number().int(),
    revenueBlockingGaps: z.number().int(),
  }),
  computedAt: z.string().datetime({ offset: true }),
});

export type AccessDashboard = z.infer<typeof accessDashboardSchema>;
