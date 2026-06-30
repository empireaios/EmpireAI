import { z } from "zod";

export const IMPROVEMENT_CATEGORIES = [
  "WEAK_MODULE",
  "MISSING_INTELLIGENCE",
  "INCOMPLETE_INTEGRATION",
  "UX_WEAKNESS",
  "PERFORMANCE_BOTTLENECK",
  "REVENUE_BOTTLENECK",
  "COMMERCIAL_BOTTLENECK",
] as const;

export const selfImprovementSuggestionSchema = z.object({
  suggestionId: z.string(),
  category: z.enum(IMPROVEMENT_CATEGORIES),
  title: z.string(),
  evidence: z.string(),
  recommendation: z.string(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  selfModifyBlocked: z.literal(true),
});

export const aiSelfImprovementEngineSchema = z.object({
  moduleId: z.literal("ai-self-improvement-engine"),
  missionId: z.literal("REAL-022"),
  workspaceId: z.string(),
  companyId: z.string(),
  suggestions: z.array(selfImprovementSuggestionSchema),
  architectureSuggestions: z.array(z.string()),
  executiveReviewItems: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string().datetime({ offset: true }),
});

export type AiSelfImprovementEngine = z.infer<typeof aiSelfImprovementEngineSchema>;
