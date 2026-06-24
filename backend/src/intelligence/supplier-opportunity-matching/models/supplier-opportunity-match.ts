import { z } from "zod";

import { supplierMatchSignalSchema, type SupplierMatchSignal } from "./supplier-match-signal.js";

export type SupplierOpportunityMatchId = string;

export const SUPPLIER_MATCH_TIERS = ["high", "medium", "low"] as const;
export type SupplierMatchTier = (typeof SUPPLIER_MATCH_TIERS)[number];

/** Match linking a supplier to a product opportunity for fulfillment. */
export type SupplierOpportunityMatch = {
  id: SupplierOpportunityMatchId;
  workspaceId: string;
  supplierId: string;
  productId: string;
  opportunityId: string;
  matchScore: number;
  matchTier: SupplierMatchTier;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  recommendedUse: string;
  signals: SupplierMatchSignal[];
  createdAt: string;
  updatedAt: string;
};

export type SupplierOpportunityMatchCreateInput = Omit<
  SupplierOpportunityMatch,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

export type SupplierOpportunityMatchUpdateInput = Partial<
  Omit<SupplierOpportunityMatchCreateInput, "supplierId" | "productId" | "opportunityId">
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const supplierOpportunityMatchSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  supplierId: z.string().min(1),
  productId: z.string().min(1),
  opportunityId: z.string().min(1),
  matchScore: z.number().min(0).max(100),
  matchTier: z.enum(SUPPLIER_MATCH_TIERS),
  confidence: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendedUse: z.string().min(1),
  signals: z.array(supplierMatchSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a SupplierOpportunityMatch record shape. */
export function validateSupplierOpportunityMatch(value: unknown): SupplierOpportunityMatch {
  return supplierOpportunityMatchSchema.parse(value);
}

/** Maps a match score to a tier label. */
export function resolveSupplierMatchTier(score: number): SupplierMatchTier {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}
