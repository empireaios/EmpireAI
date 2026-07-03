import { z } from "zod";

export const EXECUTIVE_PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export type ExecutivePriority = (typeof EXECUTIVE_PRIORITIES)[number];

export const OBJECTIVE_STATUSES = ["ACTIVE", "AT_RISK", "COMPLETED", "CANCELLED", "REPLACED"] as const;
export type ObjectiveStatus = (typeof OBJECTIVE_STATUSES)[number];

export const OBJECTIVE_HEALTH = ["GREEN", "YELLOW", "RED"] as const;
export type ObjectiveHealth = (typeof OBJECTIVE_HEALTH)[number];

export const executiveObjectiveSchema = z.object({
  objectiveId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  executivePriority: z.enum(EXECUTIVE_PRIORITIES),
  owner: z.string().min(1).default("Pillow"),
  status: z.enum(OBJECTIVE_STATUSES),
  startDate: z.string().datetime({ offset: true }),
  targetCompletionDate: z.string().datetime({ offset: true }),
  successCriteria: z.array(z.string()).min(1),
  failureCriteria: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]),
  currentProgressPercent: z.number().int().min(0).max(100),
  confidencePercent: z.number().int().min(0).max(100),
  criticalPath: z.array(z.string()).default([]),
  currentBlockers: z.array(z.string()).default([]),
  nextHighestImpactAction: z.string().nullable(),
  overallHealth: z.enum(OBJECTIVE_HEALTH),
  remainingWork: z.array(z.string()).default([]),
  forecastCompletionDate: z.string().datetime({ offset: true }).nullable(),
  businessValueScore: z.number().int().min(0).max(100).default(100),
  lastUpdated: z.string().datetime({ offset: true }),
  completionDate: z.string().datetime({ offset: true }).nullable(),
  metadata: z.record(z.string()).default({}),
});

export type ExecutiveObjective = z.infer<typeof executiveObjectiveSchema>;

export const objectiveEvaluationSnapshotSchema = z.object({
  snapshotId: z.string().min(1),
  objectiveId: z.string().min(1),
  workspaceId: z.string().min(1),
  progressPercent: z.number().int().min(0).max(100),
  confidencePercent: z.number().int().min(0).max(100),
  overallHealth: z.enum(OBJECTIVE_HEALTH),
  blockers: z.array(z.string()),
  nextAction: z.string().nullable(),
  evaluatedAt: z.string().datetime({ offset: true }),
});

export type ObjectiveEvaluationSnapshot = z.infer<typeof objectiveEvaluationSnapshotSchema>;

export const objectiveAlertSchema = z.object({
  alertId: z.string().min(1),
  objectiveId: z.string().min(1),
  workspaceId: z.string().min(1),
  alertType: z.enum([
    "at_risk",
    "ahead_of_schedule",
    "critical_blocker",
    "better_path",
    "confidence_change",
    "executive_approval_required",
    "objective_completed",
  ]),
  title: z.string().min(1),
  summary: z.string().min(1),
  materialChange: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
  acknowledgedAt: z.string().datetime({ offset: true }).nullable(),
});

export type ObjectiveAlert = z.infer<typeof objectiveAlertSchema>;

export const objectiveDashboardSchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  activeObjectives: z.array(executiveObjectiveSchema),
  prioritizedObjectiveIds: z.array(z.string()),
  primaryObjective: executiveObjectiveSchema.nullable(),
  recentAlerts: z.array(objectiveAlertSchema),
  lastEvaluatedAt: z.string().datetime({ offset: true }),
  computedAt: z.string().datetime({ offset: true }),
});

export type ObjectiveDashboard = z.infer<typeof objectiveDashboardSchema>;

export const implementationAssessmentSchema = z.object({
  recommended: z.boolean(),
  reason: z.string(),
  alignedObjectiveIds: z.array(z.string()),
  primaryObjectiveId: z.string().nullable(),
  probabilityImpact: z.enum(["increases", "neutral", "decreases"]),
});

export type ImplementationAssessment = z.infer<typeof implementationAssessmentSchema>;
