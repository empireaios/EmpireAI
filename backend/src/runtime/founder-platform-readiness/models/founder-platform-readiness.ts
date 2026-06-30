import { z } from "zod";

export const onboardingChecklistItemSchema = z.object({
  itemId: z.string(),
  label: z.string(),
  status: z.enum(["PASS", "PENDING", "FAIL"]),
  blocker: z.string().nullable(),
});

export const founderPlatformReadinessSchema = z.object({
  moduleId: z.literal("founder-platform-readiness"),
  missionId: z.literal("REAL-046"),
  workspaceId: z.string(),
  companyId: z.string(),
  grandKingRemainsPlatformOwner: z.literal(true),
  foundersAreTenants: z.literal(true),
  extendsMission: z.literal("REAL-021"),
  onboardingChecklist: z.array(onboardingChecklistItemSchema),
  readinessScore: z.number(),
  founderPlatformPreparation: z.record(z.unknown()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type FounderPlatformReadiness = z.infer<typeof founderPlatformReadinessSchema>;
