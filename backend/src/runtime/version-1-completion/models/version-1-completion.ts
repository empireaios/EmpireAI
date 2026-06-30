import { z } from "zod";

const reviewItemSchema = z.object({
  itemId: z.string(),
  label: z.string(),
  score: z.number(),
  status: z.enum(["READY", "PENDING", "BLOCKED"]),
  recommendation: z.string(),
  evidence: z.string(),
  why: z.string(),
});

export const version1CompletionCertificateSchema = z.object({
  certificateId: z.string(),
  version: z.literal("1.0.0"),
  issuedAt: z.string(),
  acceptanceScore: z.number(),
  programCount: z.number(),
  completionPercent: z.number(),
  architectureComplete: z.boolean(),
});

export const version1CompletionSchema = z.object({
  moduleId: z.literal("version-1-completion"),
  missionId: z.literal("REAL-100"),
  workspaceId: z.string(),
  companyId: z.string(),
  summary: z.string(),
  version: z.literal("1.0.0"),
  completionCertificate: version1CompletionCertificateSchema,
  architectureInventory: z.object({
    runtimeModuleCount: z.number(),
    runtimeModules: z.array(z.string()),
    programCount: z.number(),
    validationSuiteCount: z.number(),
  }),
  databaseInventory: z.array(z.string()),
  apiRouteCount: z.number(),
  apiRoutesSample: z.array(z.string()),
  dashboardInventory: z.array(z.object({
    route: z.string(),
    title: z.string(),
    navSection: z.string().optional(),
  })),
  executiveInventory: z.array(z.string()),
  supplierInventory: z.array(z.string()),
  marketplaceInventory: z.array(z.string()),
  operationalAccessInventory: z.array(z.string()),
  doctrineInventory: z.array(z.string()),
  constitutionInventory: z.array(z.string()),
  programInventory: z.array(z.object({
    programId: z.string(),
    name: z.string(),
    baseCompletionPercent: z.number(),
    blocksUsd100k: z.boolean(),
    dashboardSurface: z.string(),
  })),
  v2BacklogSummary: z.object({
    openCount: z.number(),
    topEntries: z.array(z.object({
      entryId: z.string(),
      reason: z.string(),
      priority: z.string(),
    })),
  }),
  items: z.array(reviewItemSchema),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type Version1Completion = z.infer<typeof version1CompletionSchema>;
