import { z } from "zod";

export const ExecutiveCertificationStatusSchema = z.enum([
  "DRAFT",
  "TRAINING",
  "ACTIVE",
  "SUSPENDED",
  "RETIRED",
  "EXPERIMENTAL",
]);
export type ExecutiveCertificationStatus = z.infer<typeof ExecutiveCertificationStatusSchema>;

export const ExecutiveMaturitySchema = z.enum(["EMERGING", "DEVELOPING", "ESTABLISHED", "VETERAN", "LEGENDARY"]);
export type ExecutiveMaturity = z.infer<typeof ExecutiveMaturitySchema>;

export const RegisteredExecutiveSchema = z.object({
  executiveId: z.string(),
  role: z.string(),
  title: z.string(),
  domain: z.string(),
  focusAreas: z.array(z.string()),
  certificationStatus: ExecutiveCertificationStatusSchema,
  maturity: ExecutiveMaturitySchema,
  successRate: z.number().min(0).max(100).optional(),
  recommendationCount: z.number().int().nonnegative().optional(),
  registeredAt: z.string(),
});
export type RegisteredExecutive = z.infer<typeof RegisteredExecutiveSchema>;
