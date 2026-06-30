import { z } from "zod";

export const ObservationOutcomeSchema = z.enum(["RESOLVED", "IGNORED", "PENDING", "UNKNOWN"]);
export type ObservationOutcome = z.infer<typeof ObservationOutcomeSchema>;

export const ObservationHistoryRecordSchema = z.object({
  recordId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  observationId: z.string().optional(),
  signalId: z.string().optional(),
  missionId: z.string().optional(),
  outcome: ObservationOutcomeSchema,
  accuracy: z.number().optional(),
  learningReference: z.string().optional(),
  soulIntegrated: z.boolean(),
  recordedAt: z.string(),
  resolvedAt: z.string().optional(),
});
export type ObservationHistoryRecord = z.infer<typeof ObservationHistoryRecordSchema>;
