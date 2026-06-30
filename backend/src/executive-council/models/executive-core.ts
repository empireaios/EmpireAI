import { z } from "zod";

export const ExecutivePrioritySchema = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"]);
export type ExecutivePriority = z.infer<typeof ExecutivePrioritySchema>;

export const ExecutiveRecommendationSchema = z.object({
  recommendationId: z.string(),
  executiveId: z.string(),
  title: z.string(),
  action: z.string(),
  priority: ExecutivePrioritySchema,
  confidence: z.number().min(0).max(100),
  expectedOutcome: z.string(),
  risks: z.array(z.string()),
});
export type ExecutiveRecommendation = z.infer<typeof ExecutiveRecommendationSchema>;

export const ExecutiveOpinionSchema = z.object({
  opinionId: z.string(),
  executiveId: z.string(),
  executiveTitle: z.string(),
  recommendation: z.string(),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
  supportingEvidence: z.array(z.string()),
  risks: z.array(z.string()),
  expectedOutcome: z.string(),
  concerns: z.array(z.string()),
  expectedImpact: z.string(),
  recordedAt: z.string(),
});
export type ExecutiveOpinion = z.infer<typeof ExecutiveOpinionSchema>;

export const ExecutiveConsensusSchema = z.enum([
  "CONSENSUS",
  "MAJORITY",
  "SPLIT_DECISION",
  "CONFLICT",
  "ESCALATION_REQUIRED",
]);
export type ExecutiveConsensus = z.infer<typeof ExecutiveConsensusSchema>;

export const ExecutiveConflictSchema = z.object({
  conflictId: z.string(),
  topic: z.string(),
  opposingExecutives: z.array(z.string()),
  summary: z.string(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});
export type ExecutiveConflict = z.infer<typeof ExecutiveConflictSchema>;

export const ExecutiveDecisionSchema = z.object({
  decisionId: z.string(),
  sessionId: z.string(),
  topic: z.string(),
  consensus: ExecutiveConsensusSchema,
  majorityRecommendation: z.string().optional(),
  dissentingOpinions: z.array(ExecutiveOpinionSchema),
  awaitingSoulApproval: z.boolean(),
  soulApproved: z.boolean().optional(),
  soulApprovedAt: z.string().optional(),
  recordedAt: z.string(),
});
export type ExecutiveDecision = z.infer<typeof ExecutiveDecisionSchema>;

export const ExecutiveCouncilSessionSchema = z.object({
  sessionId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  topic: z.string(),
  subjectType: z.enum(["product", "expansion", "supplier", "marketplace", "general"]),
  subjectId: z.string().optional(),
  contextSummary: z.string(),
  opinions: z.array(ExecutiveOpinionSchema),
  consensus: ExecutiveConsensusSchema,
  conflicts: z.array(ExecutiveConflictSchema),
  decision: ExecutiveDecisionSchema.optional(),
  startedAt: z.string(),
  completedAt: z.string().optional(),
});
export type ExecutiveCouncilSession = z.infer<typeof ExecutiveCouncilSessionSchema>;

export const DebateContextInputSchema = z.object({
  topic: z.string().min(1),
  subjectType: z.enum(["product", "expansion", "supplier", "marketplace", "general"]).default("general"),
  subjectId: z.string().optional(),
  summary: z.string().min(1),
  metrics: z.record(z.number()).optional(),
  tags: z.array(z.string()).optional(),
});
export type DebateContextInput = z.infer<typeof DebateContextInputSchema>;

export type ExecutiveCouncilRuntime = {
  moduleId: "executive-council";
  missionId: "EC-001-EC-010";
  activeSessions: number;
  registeredExecutives: number;
  awaitingSoulApproval: number;
  lastDebateAt: string | null;
};
