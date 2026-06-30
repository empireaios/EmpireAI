import { z } from "zod";
import { ExecutiveSignalSchema, ExecutiveSurveillanceMissionSchema } from "./surveillance-core.js";

export const ExecutiveBriefingSchema = z.object({
  briefingId: z.string(),
  type: z.enum(["MORNING", "COMMERCIAL", "EXPANSION", "RISK", "FINANCIAL", "OPERATIONS"]),
  title: z.string(),
  summary: z.string(),
  highlights: z.array(z.string()),
  generatedAt: z.string(),
});
export type ExecutiveBriefing = z.infer<typeof ExecutiveBriefingSchema>;

export const SystemAttentionMapEntrySchema = z.object({
  moduleId: z.string(),
  label: z.string(),
  attentionLevel: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"]),
  signalCount: z.number(),
  summary: z.string(),
});
export type SystemAttentionMapEntry = z.infer<typeof SystemAttentionMapEntrySchema>;

export const SurveillanceDashboardSchema = z.object({
  moduleId: z.literal("executive-surveillance"),
  missionId: z.literal("ESS-001-ESS-010"),
  signals: z.array(ExecutiveSignalSchema),
  activeRisks: z.array(ExecutiveSignalSchema),
  commercialOpportunities: z.array(ExecutiveSignalSchema),
  expansionOpportunities: z.array(ExecutiveSignalSchema),
  executiveMissions: z.array(ExecutiveSurveillanceMissionSchema),
  systemAttentionMap: z.array(SystemAttentionMapEntrySchema),
  computedAt: z.string(),
});
export type SurveillanceDashboard = z.infer<typeof SurveillanceDashboardSchema>;

export const ExecutiveSurveillanceHeadquartersSchema = z.object({
  moduleId: z.literal("executive-surveillance"),
  missionId: z.literal("ESS-001-ESS-010"),
  ceoMorningBrief: ExecutiveBriefingSchema,
  executiveSurveillance: SurveillanceDashboardSchema,
  todaysMissions: z.array(ExecutiveSurveillanceMissionSchema),
  topOpportunities: z.array(ExecutiveSignalSchema),
  criticalRisks: z.array(ExecutiveSignalSchema),
  commercialAttention: z.array(SystemAttentionMapEntrySchema),
  expansionAttention: z.array(SystemAttentionMapEntrySchema),
  empireHealth: z.object({
    overallScore: z.number(),
    modulesWatched: z.number(),
    signalsActive: z.number(),
    missionsQueued: z.number(),
  }),
  awaitingKingDecisions: z.array(
    z.object({
      source: z.string(),
      title: z.string(),
      priority: z.string(),
    }),
  ),
  briefings: z.array(ExecutiveBriefingSchema),
  computedAt: z.string(),
});
export type ExecutiveSurveillanceHeadquarters = z.infer<typeof ExecutiveSurveillanceHeadquartersSchema>;
