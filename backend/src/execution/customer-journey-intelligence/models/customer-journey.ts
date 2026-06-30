import { z } from "zod";

import { customerJourneySignalSchema, type CustomerJourneySignal } from "./customer-journey-signal.js";
import { journeyStageSchema, type JourneyStage } from "./journey-stage.js";
import {
  optimizationRecommendationSchema,
  type OptimizationRecommendation,
} from "./optimization-recommendation.js";

export type CustomerJourneyId = string;

/** Complete scored customer journey blueprint — intelligence only, no deployment. */
export type CustomerJourney = {
  journeyId: CustomerJourneyId;
  storeId: string;
  brandId: string;
  journeyName: string;
  stages: JourneyStage[];
  recommendations: OptimizationRecommendation[];
  overallScore: number;
  confidence: number;
  signals: CustomerJourneySignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoApplyEnabled: false;
};

export type CustomerJourneyCreateInput = Omit<CustomerJourney, "journeyId">;

export const customerJourneySchema = z.object({
  journeyId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  journeyName: z.string().min(1),
  stages: z.array(journeyStageSchema).length(10),
  recommendations: z.array(optimizationRecommendationSchema).min(1),
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(customerJourneySignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoApplyEnabled: z.literal(false),
});

/** Validates a CustomerJourney record shape. */
export function validateCustomerJourney(value: unknown): CustomerJourney {
  return customerJourneySchema.parse(value);
}
