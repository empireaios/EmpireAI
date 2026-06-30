import { z } from "zod";

export const version1BaselineSchema = z.object({
  baselineId: z.string(),
  version: z.literal("1.0.0"),
  lockedAt: z.string().datetime({ offset: true }),
  architectureSnapshot: z.object({
    readinessScore: z.number(),
    programCount: z.number(),
    runtimeModuleCount: z.number(),
  }),
  moduleInventory: z.array(z.object({ moduleId: z.string(), missionIds: z.array(z.string()) })),
  databaseInventory: z.array(z.string()),
  apiInventory: z.array(z.string()),
  dashboardInventory: z.array(z.string()),
  executiveInventory: z.array(z.string()),
  marketplaceInventory: z.array(z.string()),
  supplierInventory: z.array(z.string()),
  operationalAccessInventory: z.array(z.string()),
  versionLock: z.object({
    locked: z.literal(true),
    futureChangesPolicy: z.string(),
    baselineHash: z.string(),
  }),
});

export const version1LockdownSchema = z.object({
  moduleId: z.literal("version-1-lockdown"),
  missionId: z.literal("REAL-025"),
  workspaceId: z.string(),
  companyId: z.string(),
  baseline: version1BaselineSchema,
  architectureComplete: z.boolean(),
  computedAt: z.string().datetime({ offset: true }),
});

export type Version1Lockdown = z.infer<typeof version1LockdownSchema>;
