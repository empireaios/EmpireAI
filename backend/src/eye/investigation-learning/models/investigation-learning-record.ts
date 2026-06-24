import { z } from "zod";

import type { ExecutionStatus } from "../../autonomous-investigation-execution/models/investigation-execution.js";
import { EXECUTION_STATUSES } from "../../autonomous-investigation-execution/models/investigation-execution.js";
import type { InvestigationTaskType } from "../../autonomous-investigation-planner/models/investigation-task.js";
import { INVESTIGATION_TASK_TYPES } from "../../autonomous-investigation-planner/models/investigation-task.js";
import {
  learningSignalSchema,
  type LearningSignal,
} from "./learning-signal.js";

export type InvestigationLearningRecordId = string;

export const LEARNED_PATTERN_TYPES = [
  "TASK_SUCCESS",
  "TASK_FAILURE",
  "CONNECTOR_RELIABILITY",
  "OPPORTUNITY_VALIDATION",
  "FORECAST_VALIDATION",
] as const;

export type LearnedPatternType = (typeof LEARNED_PATTERN_TYPES)[number];

/** Pattern discovered from one or more investigation outcomes. */
export type LearnedPattern = {
  patternId: string;
  patternType: LearnedPatternType;
  key: string;
  taskType: InvestigationTaskType | null;
  connectorId: string | null;
  occurrenceCount: number;
  description: string;
  confidence: number;
};

export const learnedPatternSchema = z.object({
  patternId: z.string().min(1),
  patternType: z.enum(LEARNED_PATTERN_TYPES),
  key: z.string().min(1),
  taskType: z.enum(INVESTIGATION_TASK_TYPES).nullable(),
  connectorId: z.string().nullable(),
  occurrenceCount: z.number().int().min(1),
  description: z.string().min(1),
  confidence: z.number().min(0).max(100),
});

/** Recurring success or failure across investigations. */
export type RepeatedPattern = {
  patternKey: string;
  taskType: InvestigationTaskType;
  connectorId: string | null;
  occurrenceCount: number;
  lastSeenAt: string;
  description: string;
};

export const repeatedPatternSchema = z.object({
  patternKey: z.string().min(1),
  taskType: z.enum(INVESTIGATION_TASK_TYPES),
  connectorId: z.string().nullable(),
  occurrenceCount: z.number().int().min(2),
  lastSeenAt: z.string().datetime({ offset: true }),
  description: z.string().min(1),
});

/** Confidence adjustment derived from investigation history. */
export type ConfidenceAdjustment = {
  baseConfidence: number;
  adjustedConfidence: number;
  delta: number;
  reason: string;
};

export const confidenceAdjustmentSchema = z.object({
  baseConfidence: z.number().min(0).max(100),
  adjustedConfidence: z.number().min(0).max(100),
  delta: z.number(),
  reason: z.string().min(1),
});

export const RECOMMENDATION_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type RecommendationPriority = (typeof RECOMMENDATION_PRIORITIES)[number];

/** Actionable recommendation for future investigations. */
export type InvestigationRecommendation = {
  recommendationId: string;
  priority: RecommendationPriority;
  action: string;
  rationale: string;
  taskType: InvestigationTaskType | null;
  connectorId: string | null;
};

export const investigationRecommendationSchema = z.object({
  recommendationId: z.string().min(1),
  priority: z.enum(RECOMMENDATION_PRIORITIES),
  action: z.string().min(1),
  rationale: z.string().min(1),
  taskType: z.enum(INVESTIGATION_TASK_TYPES).nullable(),
  connectorId: z.string().nullable(),
});

/** Reusable intelligence captured from a completed investigation. */
export type InvestigationLearningRecord = {
  id: InvestigationLearningRecordId;
  workspaceId: string;
  executionId: string;
  investigationPlanId: string;
  targetId: string;
  productId: string;
  executionStatus: ExecutionStatus;
  learnedPatterns: LearnedPattern[];
  repeatedFailures: RepeatedPattern[];
  repeatedSuccesses: RepeatedPattern[];
  confidenceAdjustment: ConfidenceAdjustment;
  investigationRecommendations: InvestigationRecommendation[];
  signals: LearningSignal[];
  createdAt: string;
  updatedAt: string;
};

export type InvestigationLearningRecordCreateInput = Omit<
  InvestigationLearningRecord,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const investigationLearningRecordSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  executionId: z.string().min(1),
  investigationPlanId: z.string().min(1),
  targetId: z.string().min(1),
  productId: z.string().min(1),
  executionStatus: z.enum(EXECUTION_STATUSES),
  learnedPatterns: z.array(learnedPatternSchema),
  repeatedFailures: z.array(repeatedPatternSchema),
  repeatedSuccesses: z.array(repeatedPatternSchema),
  confidenceAdjustment: confidenceAdjustmentSchema,
  investigationRecommendations: z.array(investigationRecommendationSchema),
  signals: z.array(learningSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an InvestigationLearningRecord record shape. */
export function validateInvestigationLearningRecord(
  value: unknown,
): InvestigationLearningRecord {
  return investigationLearningRecordSchema.parse(value);
}
