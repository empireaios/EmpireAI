import { z } from "zod";

export const AutomationPlanGoalSchema = z.enum([
  "launch_country",
  "launch_globally",
  "expand_country",
]);

export type AutomationPlanGoal = z.infer<typeof AutomationPlanGoalSchema>;

export const AutomationPlanInputSchema = z.object({
  goal: AutomationPlanGoalSchema,
  targetCountryCode: z.string().optional(),
  productCategory: z.string().optional(),
});

export type AutomationPlanInput = z.infer<typeof AutomationPlanInputSchema>;

export const AutomationPlanStepSchema = z.object({
  stepOrder: z.number().int(),
  stepType: z.enum(["human_action", "empire_ai_action", "dependency", "milestone"]),
  title: z.string(),
  description: z.string(),
  estimatedMinutes: z.number().int(),
  dependsOnStep: z.number().int().optional(),
  countryCode: z.string().optional(),
  providerId: z.string().optional(),
  automatable: z.boolean(),
});

export type AutomationPlanStep = z.infer<typeof AutomationPlanStepSchema>;

export const AutomationPlanSchema = z.object({
  planId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  goal: AutomationPlanGoalSchema,
  targetCountryCode: z.string().optional(),
  productCategory: z.string().optional(),
  humanActionsOnly: z.array(AutomationPlanStepSchema),
  empireAiActions: z.array(AutomationPlanStepSchema),
  dependencies: z.array(z.object({ from: z.string(), to: z.string(), reason: z.string() })),
  estimatedCompletionHours: z.number(),
  estimatedCompletionDays: z.number().int(),
  summary: z.string(),
  computedAt: z.string(),
});

export type AutomationPlan = z.infer<typeof AutomationPlanSchema>;
