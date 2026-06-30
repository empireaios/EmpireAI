import { z } from "zod";

export const EXPERIMENT_CLASSIFICATIONS = [
  "HIGH_CONFIDENCE",
  "EXPERIMENT",
  "WATCHLIST",
  "REMOVE",
] as const;

export type ExperimentClassification = (typeof EXPERIMENT_CLASSIFICATIONS)[number];

export const CLASSIFICATION_LABELS: Record<ExperimentClassification, string> = {
  HIGH_CONFIDENCE: "High Confidence",
  EXPERIMENT: "Experiment",
  WATCHLIST: "Watchlist",
  REMOVE: "Remove",
};

export const commercialExperimentResultSchema = z.object({
  experimentId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  supplierProductId: z.string(),
  classification: z.enum(EXPERIMENT_CLASSIFICATIONS),
  expectedBusinessValue: z.number().min(0).max(100),
  explanation: z.string(),
  factors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(["positive", "neutral", "negative"]),
    weight: z.number().min(0).max(1),
  })),
  shippingDaysNote: z.string().optional(),
  marginNote: z.string().optional(),
  confidence: z.number().min(0).max(100),
  classifiedAt: z.string().datetime({ offset: true }),
});

export type CommercialExperimentResult = z.infer<typeof commercialExperimentResultSchema>;
