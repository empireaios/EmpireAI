import { z } from "zod";

export const LEARNING_SOURCES = [
  "REVIEW_INTELLIGENCE",
  "COMPETITOR_INTELLIGENCE",
  "PERSISTENT_MEMORY",
  "EYE",
  "ANALYTICS",
  "CROSS_COMPANY",
] as const;

export type LearningSource = (typeof LEARNING_SOURCES)[number];

/** Continuous learning update for knowledge graph enrichment. */
export type ContinuousLearningUpdate = {
  updateId: string;
  source: LearningSource;
  learnedFact: string;
  affectedEntityIds: string[];
  appliedAt: string;
  retentionScore: number;
  score: number;
};

export const continuousLearningUpdateSchema = z.object({
  updateId: z.string().min(1),
  source: z.enum(LEARNING_SOURCES),
  learnedFact: z.string().min(1),
  affectedEntityIds: z.array(z.string().min(1)).min(1),
  appliedAt: z.string().datetime({ offset: true }),
  retentionScore: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
});

/** Validates a ContinuousLearningUpdate record shape. */
export function validateContinuousLearningUpdate(value: unknown): ContinuousLearningUpdate {
  return continuousLearningUpdateSchema.parse(value);
}
