import { z } from "zod";

export const InfrastructureHeatmapEntrySchema = z.object({
  countryCode: z.string(),
  displayName: z.string(),
  infrastructureScore: z.number(),
  readinessPhase: z.string(),
  criticalBlockers: z.number().int(),
  automationPotential: z.number(),
});

export type InfrastructureHeatmapEntry = z.infer<typeof InfrastructureHeatmapEntrySchema>;

export const GlobalCommerceInfrastructureDashboardSchema = z.object({
  moduleId: z.literal("global-commerce-infrastructure"),
  missionId: z.literal("D-001-D-005"),
  infrastructureScore: z.number().min(0).max(100),
  infrastructureReadiness: z.enum(["READY", "NEARLY_READY", "IN_PROGRESS", "BLOCKED", "MIXED"]),
  criticalMissingPieces: z.array(z.object({
    countryCode: z.string(),
    displayName: z.string(),
    blockers: z.array(z.string()),
  })),
  infrastructureCoverage: z.object({
    countriesEvaluated: z.number().int(),
    layersTracked: z.number().int(),
    providersWithDependencies: z.number().int(),
  }),
  expansionDependencies: z.array(z.object({
    countryCode: z.string(),
    displayName: z.string(),
    stepCount: z.number().int(),
    ready: z.boolean(),
  })),
  countriesReady: z.array(z.object({ countryCode: z.string(), displayName: z.string(), score: z.number() })),
  countriesNearlyReady: z.array(z.object({ countryCode: z.string(), displayName: z.string(), score: z.number() })),
  infrastructureHeatmap: z.array(InfrastructureHeatmapEntrySchema),
  recommendedNextCountry: z.object({ countryCode: z.string(), displayName: z.string(), score: z.number(), why: z.string() }).nullable(),
  computedAt: z.string(),
});

export type GlobalCommerceInfrastructureDashboard = z.infer<typeof GlobalCommerceInfrastructureDashboardSchema>;
