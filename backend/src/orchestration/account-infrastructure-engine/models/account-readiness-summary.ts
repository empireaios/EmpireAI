import { z } from "zod";

import { ACCOUNT_PROVIDER_IDS } from "./account-provider.js";

export const ACCOUNT_READINESS_LABELS = [
  "READY",
  "ACTION_REQUIRED",
  "NOT_CONNECTED",
  "ERROR",
  "DISABLED",
] as const;

export type AccountReadinessLabel = (typeof ACCOUNT_READINESS_LABELS)[number];

export const accountReadinessLineSchema = z.object({
  providerId: z.enum(ACCOUNT_PROVIDER_IDS),
  displayName: z.string(),
  label: z.enum(ACCOUNT_READINESS_LABELS),
  healthScore: z.number().int().min(0).max(100),
  connectionStatus: z.string(),
  pendingHumanActions: z.number().int().min(0),
});

export type AccountReadinessLine = z.infer<typeof accountReadinessLineSchema>;

export const accountReadinessSummarySchema = z.object({
  workspaceId: z.string().min(1),
  accountType: z.enum(["grand_king", "founder"]).default("grand_king"),
  lines: z.array(accountReadinessLineSchema),
  overallReadinessPercent: z.number().int().min(0).max(100),
  readyCount: z.number().int().min(0),
  actionRequiredCount: z.number().int().min(0),
  pendingHumanActions: z.number().int().min(0),
  computedAt: z.string().datetime({ offset: true }),
});

export type AccountReadinessSummary = z.infer<typeof accountReadinessSummarySchema>;
