import { z } from "zod";

/** RS-004 — Amazon listing readiness evaluation. */
export const amazonReadinessEvaluationSchema = z.object({
  listingId: z.string().min(1),
  sku: z.string(),
  ready: z.boolean(),
  publishReadinessPercent: z.number().min(0).max(100),
  missingInformation: z.array(z.string()),
  warnings: z.array(z.string()),
  complianceRisks: z.array(z.string()),
  requiredHumanActions: z.array(z.string()),
  evaluatedAt: z.string().datetime({ offset: true }),
});

export type AmazonReadinessEvaluation = z.infer<typeof amazonReadinessEvaluationSchema>;
