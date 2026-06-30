import { z } from "zod";

import { CONNECTION_LIFECYCLE_STATES } from "./connection-lifecycle.js";
import { IRREVERSIBLE_ACTIONS } from "./approval-framework.js";

/** REAL-005 — Reality Readiness Dashboard for Mission Control. */
export const realityReadinessDashboardSchema = z.object({
  moduleId: z.literal("reality-integration"),
  missionId: z.literal("REAL-001-REAL-005"),
  connectedProviders: z.array(z.object({
    providerId: z.string(),
    displayName: z.string(),
    lifecycle: z.enum(CONNECTION_LIFECYCLE_STATES),
    category: z.string(),
  })),
  providersReady: z.array(z.string()),
  verificationPending: z.array(z.object({
    providerId: z.string(),
    displayName: z.string(),
    reason: z.string(),
  })),
  credentialExpiry: z.array(z.object({
    credentialsRef: z.string(),
    providerId: z.string(),
    expiresAt: z.string(),
    daysRemaining: z.number().int(),
  })),
  approvalQueue: z.array(z.object({
    action: z.enum(IRREVERSIBLE_ACTIONS),
    displayName: z.string(),
    riskLevel: z.string(),
    pendingCount: z.number().int().min(0),
  })),
  connectionHealth: z.object({
    healthy: z.number().int().min(0),
    warning: z.number().int().min(0),
    failed: z.number().int().min(0),
    disabled: z.number().int().min(0),
  }),
  countriesReady: z.array(z.string()),
  realCommerceReadinessPercent: z.number().min(0).max(100),
  firstConnectedMarketplace: z.string().nullable(),
  firstConnectedPayment: z.string().nullable(),
  firstConnectedSupplier: z.string().nullable(),
  computedAt: z.string().datetime({ offset: true }),
});

export type RealityReadinessDashboard = z.infer<typeof realityReadinessDashboardSchema>;
