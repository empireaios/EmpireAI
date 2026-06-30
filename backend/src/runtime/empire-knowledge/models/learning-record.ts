import { z } from "zod";

export const LearningRecordSourceSchema = z.enum([
  "OPERATION_FIRST_DOLLAR",
  "GLOBAL_COMMERCE_INTELLIGENCE",
  "COMMERCE_RUNTIME",
  "LAUNCH_EVENT",
  "SUPPLIER_EVENT",
  "MARKETPLACE_EVENT",
  "MANUAL",
  "SEED",
]);

export type LearningRecordSource = z.infer<typeof LearningRecordSourceSchema>;

export const LearningImportanceSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const LearningRecordSchema = z.object({
  learningId: z.string(),
  workspaceId: z.string(),
  companyId: z.string().optional(),
  observation: z.string(),
  evidence: z.string(),
  confidence: z.number().min(0).max(100),
  source: LearningRecordSourceSchema,
  timestamp: z.string(),
  relatedObjectIds: z.array(z.string()),
  importance: LearningImportanceSchema,
  recommendation: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type LearningRecord = z.infer<typeof LearningRecordSchema>;

export const CreateLearningRecordInputSchema = z.object({
  observation: z.string().min(1),
  evidence: z.string().min(1),
  confidence: z.number().min(0).max(100).default(60),
  source: LearningRecordSourceSchema.default("MANUAL"),
  companyId: z.string().optional(),
  relatedObjectIds: z.array(z.string()).default([]),
  importance: LearningImportanceSchema.default("MEDIUM"),
  recommendation: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateLearningRecordInput = z.input<typeof CreateLearningRecordInputSchema>;
