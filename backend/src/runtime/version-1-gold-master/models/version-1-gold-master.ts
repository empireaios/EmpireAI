import { z } from "zod";

export const version1GoldCertificateSchema = z.object({
  certificateId: z.string(),
  version: z.literal("1.0.0-gold"),
  issuedAt: z.string(),
  acceptanceScore: z.number(),
  goldMaster: z.literal(true),
});

export const version1GoldMasterSchema = z.object({
  moduleId: z.literal("version-1-gold-master"),
  missionId: z.literal("REAL-050"),
  workspaceId: z.string(),
  companyId: z.string(),
  version: z.literal("1.0.0-gold"),
  versionLock: z.object({
    locked: z.literal(true),
    baselineHash: z.string(),
    futureChangesPolicy: z.string(),
  }),
  version1Certificate: version1GoldCertificateSchema,
  doctrineInventory: z.array(z.string()),
  constitutionInventory: z.array(z.string()),
  missionInventory: z.array(z.object({ missionId: z.string(), moduleId: z.string() })),
  programCount: z.number(),
  runtimeModuleCount: z.number(),
  acceptanceScore: z.number(),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type Version1GoldMaster = z.infer<typeof version1GoldMasterSchema>;
