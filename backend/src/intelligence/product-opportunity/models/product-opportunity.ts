import { z } from "zod";

import { opportunitySignalSchema, type OpportunitySignal } from "./opportunity-signal.js";

export type ProductOpportunityId = string;

export const OPPORTUNITY_TIERS = ["high", "medium", "low"] as const;
export type OpportunityTier = (typeof OPPORTUNITY_TIERS)[number];

/** Ranked product opportunity synthesized from buyer and product intelligence. */
export type ProductOpportunity = {
  id: ProductOpportunityId;
  workspaceId: string;
  productId: string;
  buyerPersonaId: string;
  opportunityScore: number;
  opportunityTier: OpportunityTier;
  confidence: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  recommendedChannels: string[];
  signals: OpportunitySignal[];
  createdAt: string;
  updatedAt: string;
};

export type ProductOpportunityCreateInput = Omit<
  ProductOpportunity,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

export type ProductOpportunityUpdateInput = Partial<
  Omit<ProductOpportunityCreateInput, "productId" | "buyerPersonaId">
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const productOpportunitySchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  productId: z.string().min(1),
  buyerPersonaId: z.string().min(1),
  opportunityScore: z.number().min(0).max(100),
  opportunityTier: z.enum(OPPORTUNITY_TIERS),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().min(1),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendedChannels: z.array(z.string()),
  signals: z.array(opportunitySignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a ProductOpportunity record shape. */
export function validateProductOpportunity(value: unknown): ProductOpportunity {
  return productOpportunitySchema.parse(value);
}

/** Maps an opportunity score to a tier label. */
export function resolveOpportunityTier(score: number): OpportunityTier {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}
