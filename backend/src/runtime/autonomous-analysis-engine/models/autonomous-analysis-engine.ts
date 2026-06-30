import { z } from "zod";

export const ANALYSIS_DOMAINS = [
  "products",
  "suppliers",
  "countries",
  "customers",
  "marketplaces",
  "profitability",
] as const;

export const analysisInsightSchema = z.object({
  domain: z.enum(ANALYSIS_DOMAINS),
  title: z.string(),
  severity: z.enum(["INFO", "WATCH", "ALERT", "CRITICAL"]),
  insight: z.string(),
  recommendation: z.string(),
  evidence: z.array(z.string()),
});

export const autonomousAnalysisEngineSchema = z.object({
  moduleId: z.literal("autonomous-analysis-engine"),
  missionId: z.literal("REAL-059"),
  workspaceId: z.string(),
  companyId: z.string(),
  analysisOnly: z.literal(true),
  insights: z.array(analysisInsightSchema),
  insightCount: z.number(),
  executiveSummary: z.string(),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type AnalysisDomain = (typeof ANALYSIS_DOMAINS)[number];
export type AnalysisInsight = z.infer<typeof analysisInsightSchema>;
export type AutonomousAnalysisEngine = z.infer<typeof autonomousAnalysisEngineSchema>;
