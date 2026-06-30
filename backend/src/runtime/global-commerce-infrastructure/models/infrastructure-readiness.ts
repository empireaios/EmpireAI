import { z } from "zod";

import { InfrastructureLayerIdSchema } from "./infrastructure-model.js";

export const InfrastructureReadinessSchema = z.object({
  countryCode: z.string(),
  displayName: z.string(),
  infrastructureScore: z.number().min(0).max(100),
  missingComponents: z.array(z.string()),
  criticalBlockers: z.array(z.string()),
  optionalComponents: z.array(z.string()),
  automationPotential: z.number().min(0).max(100),
  humanWorkRemainingHours: z.number().int().min(0),
  readinessPhase: z.enum(["READY", "NEARLY_READY", "IN_PROGRESS", "BLOCKED"]),
  layerScores: z.array(z.object({
    layerId: InfrastructureLayerIdSchema,
    score: z.number(),
    status: z.string(),
  })),
  computedAt: z.string(),
});

export type InfrastructureReadiness = z.infer<typeof InfrastructureReadinessSchema>;
