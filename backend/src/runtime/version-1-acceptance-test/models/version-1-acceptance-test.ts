import { z } from "zod";

export const acceptanceCheckSchema = z.object({
  checkId: z.string(),
  label: z.string(),
  modulePath: z.string(),
  status: z.enum(["PASS", "FAIL"]),
  evidence: z.string(),
});

export const acceptanceReportSchema = z.object({
  items: z.array(acceptanceCheckSchema),
  passCount: z.number(),
  failCount: z.number(),
  overallScore: z.number(),
  passed: z.boolean(),
});

export const version1AcceptanceTestSchema = z.object({
  moduleId: z.literal("version-1-acceptance-test"),
  missionId: z.literal("REAL-048"),
  workspaceId: z.string(),
  companyId: z.string(),
  acceptanceReport: acceptanceReportSchema,
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type Version1AcceptanceTest = z.infer<typeof version1AcceptanceTestSchema>;
