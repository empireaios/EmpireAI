import { z } from "zod";

/** REAL-021 — Founder platform architecture (separate from Grand King — CONSTITUTION-021). */
export const FOUNDER_PLATFORM_SURFACES = [
  "FOUNDER_WORKSPACE",
  "FOUNDER_DASHBOARD",
  "FOUNDER_REVENUE",
  "FOUNDER_PRODUCTS",
  "FOUNDER_MISSIONS",
  "FOUNDER_NOTIFICATIONS",
  "FOUNDER_REPORTS",
  "FOUNDER_APPROVALS",
] as const;

export const founderPlatformSurfaceSchema = z.object({
  surfaceId: z.enum(FOUNDER_PLATFORM_SURFACES),
  label: z.string(),
  route: z.string(),
  status: z.enum(["ARCHITECTURE_READY", "PLANNED", "NOT_STARTED"]),
  grandKingSeparated: z.literal(true),
  description: z.string(),
});

export const founderPlatformPreparationSchema = z.object({
  moduleId: z.literal("founder-platform-preparation"),
  missionId: z.literal("REAL-021"),
  workspaceId: z.string(),
  companyId: z.string(),
  grandKingRemainsUnique: z.literal(true),
  neverMergeWithGrandKing: z.literal(true),
  surfaces: z.array(founderPlatformSurfaceSchema),
  architecturePercent: z.number(),
  architectureComplete: z.boolean(),
  computedAt: z.string().datetime({ offset: true }),
});

export type FounderPlatformPreparation = z.infer<typeof founderPlatformPreparationSchema>;
