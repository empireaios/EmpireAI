import { z } from "zod";

export const AccountabilityOutcomeSchema = z.enum(["CORRECT", "INCORRECT", "UNKNOWN"]);
export type AccountabilityOutcome = z.infer<typeof AccountabilityOutcomeSchema>;

export const ExecutiveAccountabilityRecordSchema = z.object({
  recordId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  executiveId: z.string(),
  recommendationId: z.string(),
  sessionId: z.string(),
  predictedOutcome: z.string(),
  actualOutcome: z.string().optional(),
  outcome: AccountabilityOutcomeSchema,
  commercialResult: z.string().optional(),
  confidenceAtRecommendation: z.number(),
  confidenceCalibration: z.number(),
  recordedAt: z.string(),
  resolvedAt: z.string().optional(),
});
export type ExecutiveAccountabilityRecord = z.infer<typeof ExecutiveAccountabilityRecordSchema>;
