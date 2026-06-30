import { z } from "zod";

/** REAL-007 — Visual executive debate (not chatbot). */
export const VISUAL_DEBATE_CHIEF_IDS = [
  "ceo",
  "cco",
  "cfo",
  "csco",
  "cmo-marketplace",
  "cmo-marketing",
  "cxo",
  "cro",
  "cto",
  "cko",
  "cao",
  "clo",
] as const;

export const chiefCardSchema = z.object({
  executiveId: z.string(),
  title: z.string(),
  recommendation: z.string(),
  confidence: z.number().min(0).max(100),
  evidence: z.array(z.string()),
  businessImpact: z.string(),
  risk: z.string(),
  expectedProfitUsd: z.number(),
  expectedTimeDays: z.number().int(),
  stance: z.enum(["PROCEED", "PROCEED_WITH_CAUTION", "DEFER", "REJECT"]),
});

export const soulRecommendationSchema = z.object({
  summary: z.string(),
  unifiedRecommendation: z.string(),
  confidence: z.number().min(0).max(100),
  expectedProfitUsd: z.number(),
  expectedTimeDays: z.number().int(),
  dissent: z.array(z.string()),
});

export const grandKingDecisionSchema = z.object({
  decision: z.enum(["PENDING", "APPROVE", "REJECT", "REQUEST_FURTHER_INVESTIGATION"]).nullable(),
  decidedAt: z.string().datetime({ offset: true }).nullable(),
  rationale: z.string().optional(),
});

export const executiveVisualDebateSchema = z.object({
  debateId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  topic: z.string(),
  subjectType: z.enum(["product", "expansion", "supplier", "marketplace", "general"]),
  chiefCards: z.array(chiefCardSchema),
  soulRecommendation: soulRecommendationSchema,
  grandKingDecision: grandKingDecisionSchema,
  missionId: z.literal("REAL-007"),
  computedAt: z.string().datetime({ offset: true }),
});

export type ExecutiveVisualDebate = z.infer<typeof executiveVisualDebateSchema>;
export type ChiefCard = z.infer<typeof chiefCardSchema>;

export const CHIEF_TITLES: Record<string, string> = {
  ceo: "Chief Executive Officer",
  cco: "Chief Commercial Officer",
  cfo: "Chief Financial Officer",
  csco: "Chief Supply Chain Officer",
  "cmo-marketplace": "Chief Marketplace Officer",
  "cmo-marketing": "Chief Marketing Officer",
  cxo: "Chief Customer Officer",
  cro: "Chief Risk Officer",
  cto: "Chief Technology Officer",
  cko: "Chief Knowledge Officer",
  cao: "Chief Automation Officer",
  clo: "Chief Legal & Compliance Officer",
};
