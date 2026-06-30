import { z } from "zod";

export const KnowledgeReasoningInputSchema = z.object({
  productCategory: z.string().min(1),
  productName: z.string().optional(),
  companyId: z.string().optional(),
});

export type KnowledgeReasoningInput = z.infer<typeof KnowledgeReasoningInputSchema>;

export const ReasoningEvidenceSchema = z.object({
  claim: z.string(),
  evidence: z.string(),
  confidence: z.number().min(0).max(100),
  relatedObjectIds: z.array(z.string()),
  source: z.string(),
});

export type ReasoningEvidence = z.infer<typeof ReasoningEvidenceSchema>;

export const KnowledgeReasoningResultSchema = z.object({
  reasoningId: z.string(),
  workspaceId: z.string(),
  productCategory: z.string(),
  productName: z.string().optional(),
  similarLaunches: z.array(ReasoningEvidenceSchema),
  successfulCountries: z.array(ReasoningEvidenceSchema),
  failedSuppliers: z.array(ReasoningEvidenceSchema),
  bestMarketplaces: z.array(ReasoningEvidenceSchema),
  repeatingPatterns: z.array(ReasoningEvidenceSchema),
  overallConfidence: z.number().min(0).max(100),
  summary: z.string(),
  computedAt: z.string(),
});

export type KnowledgeReasoningResult = z.infer<typeof KnowledgeReasoningResultSchema>;
