import { z } from "zod";

import { journeyStageTypeSchema, type JourneyStageType } from "./journey-stage-types.js";

export const JOURNEY_STAGE_STATUSES = ["STRONG", "ADEQUATE", "NEEDS_IMPROVEMENT"] as const;

export type JourneyStageStatus = (typeof JOURNEY_STAGE_STATUSES)[number];

/** Key metric tracked at a journey stage. */
export type JourneyStageMetric = {
  metricId: string;
  name: string;
  value: number;
  unit: string;
  benchmark: number;
};

/** Scored stage within the complete customer journey. */
export type JourneyStage = {
  stageId: string;
  stageType: JourneyStageType;
  order: number;
  displayName: string;
  description: string;
  score: number;
  benchmarkScore: number;
  status: JourneyStageStatus;
  metrics: JourneyStageMetric[];
  touchpoints: string[];
  frictionPoints: string[];
};

export const journeyStageMetricSchema = z.object({
  metricId: z.string().min(1),
  name: z.string().min(1),
  value: z.number().min(0),
  unit: z.string().min(1),
  benchmark: z.number().min(0),
});

export const journeyStageSchema = z.object({
  stageId: z.string().min(1),
  stageType: journeyStageTypeSchema,
  order: z.number().int().min(1).max(10),
  displayName: z.string().min(1),
  description: z.string().min(1),
  score: z.number().min(0).max(100),
  benchmarkScore: z.number().min(0).max(100),
  status: z.enum(JOURNEY_STAGE_STATUSES),
  metrics: z.array(journeyStageMetricSchema).min(1),
  touchpoints: z.array(z.string().min(1)).min(1),
  frictionPoints: z.array(z.string().min(1)),
});

/** Validates a JourneyStage record shape. */
export function validateJourneyStage(value: unknown): JourneyStage {
  return journeyStageSchema.parse(value);
}
