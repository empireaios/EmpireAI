import { z } from "zod";

import { EXPERIMENT_CLASSIFICATIONS } from "./commercial-experiment.js";

/** CIS-005 — Commerce Intelligence Studio Mission Control. */
export const cisMissionControlDashboardSchema = z.object({
  moduleId: z.literal("commerce-intelligence-studio"),
  missionId: z.literal("CIS-001-CIS-005"),
  productsAwaitingReview: z.number().int().min(0),
  winningListings: z.array(z.object({
    listingId: z.string(),
    supplierProductId: z.string(),
    title: z.string(),
    listingStrengthScore: z.number(),
  })),
  productsUnderExperiment: z.array(z.object({
    supplierProductId: z.string(),
    classification: z.enum(EXPERIMENT_CLASSIFICATIONS),
    explanation: z.string(),
  })),
  productsOnWatchlist: z.array(z.object({
    supplierProductId: z.string(),
    expectedBusinessValue: z.number(),
    explanation: z.string(),
  })),
  productsRecommendedForRemoval: z.array(z.object({
    supplierProductId: z.string(),
    explanation: z.string(),
  })),
  topCommercialOpportunities: z.array(z.object({
    supplierProductId: z.string(),
    title: z.string(),
    aggregateScore: z.number(),
    strategy: z.string(),
    classification: z.string(),
  })),
  commercialConfidence: z.number().min(0).max(100),
  computedAt: z.string().datetime({ offset: true }),
});

export type CisMissionControlDashboard = z.infer<typeof cisMissionControlDashboardSchema>;
