import { z } from "zod";

export const AutomationClassificationSchema = z.enum([
  "FULLY_AUTOMATABLE",
  "SEMI_AUTOMATABLE",
  "HUMAN_REQUIRED",
  "BLOCKED",
]);

export type AutomationClassification = z.infer<typeof AutomationClassificationSchema>;

export const AutomationOpportunitySchema = z.object({
  taskId: z.string(),
  title: z.string(),
  classification: AutomationClassificationSchema,
  estimatedTimeSavedMinutes: z.number().int().min(0),
  manualEffortRemainingMinutes: z.number().int().min(0),
  automationPercentage: z.number().min(0).max(100),
  rationale: z.string(),
});

export type AutomationOpportunity = z.infer<typeof AutomationOpportunitySchema>;

export const AutomationOpportunitySummarySchema = z.object({
  workspaceId: z.string(),
  companyId: z.string(),
  opportunities: z.array(AutomationOpportunitySchema),
  totalTasks: z.number().int(),
  fullyAutomatable: z.number().int(),
  semiAutomatable: z.number().int(),
  humanRequired: z.number().int(),
  blocked: z.number().int(),
  overallAutomationPercentage: z.number().min(0).max(100),
  estimatedHoursSaved: z.number(),
  manualHoursRemaining: z.number(),
  computedAt: z.string(),
});

export type AutomationOpportunitySummary = z.infer<typeof AutomationOpportunitySummarySchema>;
