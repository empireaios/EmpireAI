import { z } from "zod";

export const ExecutivePriorityLevelSchema = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
export type ExecutivePriorityLevel = z.infer<typeof ExecutivePriorityLevelSchema>;

export const ExecutiveEvidenceSchema = z.object({
  evidenceId: z.string(),
  source: z.string(),
  summary: z.string(),
  moduleId: z.string(),
  recordedAt: z.string(),
});
export type ExecutiveEvidence = z.infer<typeof ExecutiveEvidenceSchema>;

export const ExecutiveSignalTypeSchema = z.enum([
  "OPPORTUNITY",
  "RISK",
  "TREND",
  "WARNING",
  "ANOMALY",
  "COST_SAVING",
  "GROWTH_OPPORTUNITY",
  "EXPANSION_OPPORTUNITY",
  "CUSTOMER_CONCERN",
  "SUPPLIER_CONCERN",
  "MARKETPLACE_CONCERN",
]);
export type ExecutiveSignalType = z.infer<typeof ExecutiveSignalTypeSchema>;

export const ExecutiveSignalSchema = z.object({
  signalId: z.string(),
  watcherId: z.string(),
  watcherTitle: z.string(),
  signalType: ExecutiveSignalTypeSchema,
  title: z.string(),
  summary: z.string(),
  confidence: z.number().min(0).max(100),
  evidence: z.array(ExecutiveEvidenceSchema),
  affectedModules: z.array(z.string()),
  priority: ExecutivePriorityLevelSchema,
  urgency: z.number().min(0).max(100),
  businessImpact: z.number().min(0).max(100),
  commercialValue: z.number().min(0).max(100),
  strategicValue: z.number().min(0).max(100),
  expectedRoi: z.number().optional(),
  emittedAt: z.string(),
});
export type ExecutiveSignal = z.infer<typeof ExecutiveSignalSchema>;

export const ExecutiveObservationSchema = z.object({
  observationId: z.string(),
  watcherId: z.string(),
  moduleId: z.string(),
  summary: z.string(),
  signalsEmitted: z.number().int().nonnegative(),
  observedAt: z.string(),
});
export type ExecutiveObservation = z.infer<typeof ExecutiveObservationSchema>;

export const ExecutiveAlertSchema = z.object({
  alertId: z.string(),
  signalId: z.string(),
  title: z.string(),
  severity: ExecutivePriorityLevelSchema,
  summary: z.string(),
  acknowledged: z.boolean(),
  createdAt: z.string(),
});
export type ExecutiveAlert = z.infer<typeof ExecutiveAlertSchema>;

export const SurveillanceMissionCategorySchema = z.enum([
  "TODAY",
  "WEEKLY",
  "STRATEGIC",
  "QUICK_WIN",
  "INVESTIGATION",
  "ESCALATION",
]);
export type SurveillanceMissionCategory = z.infer<typeof SurveillanceMissionCategorySchema>;

export const ExecutiveSurveillanceMissionSchema = z.object({
  missionId: z.string(),
  signalId: z.string().optional(),
  watcherId: z.string(),
  category: SurveillanceMissionCategorySchema,
  title: z.string(),
  description: z.string(),
  businessValue: z.number().min(0).max(100),
  timeRequiredHours: z.number().nonnegative(),
  expectedImpact: z.string(),
  confidence: z.number().min(0).max(100),
  priority: ExecutivePriorityLevelSchema,
  generatedAt: z.string(),
});
export type ExecutiveSurveillanceMission = z.infer<typeof ExecutiveSurveillanceMissionSchema>;

export const ExecutiveRecommendationQueueSchema = z.object({
  queueId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  missions: z.array(ExecutiveSurveillanceMissionSchema),
  signals: z.array(ExecutiveSignalSchema),
  computedAt: z.string(),
});
export type ExecutiveRecommendationQueue = z.infer<typeof ExecutiveRecommendationQueueSchema>;

export type ExecutiveWatcher = {
  watcherId: string;
  title: string;
  domain: string;
  watchedModules: string[];
  active: boolean;
  registeredAt: string;
};

export type ExecutiveSurveillanceRuntime = {
  moduleId: "executive-surveillance";
  missionId: "ESS-001-ESS-010";
  activeWatchers: number;
  signalsToday: number;
  missionsQueued: number;
  lastObservationAt: string | null;
};
