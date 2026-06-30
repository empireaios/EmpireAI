import { z } from "zod";

import { revenueSignalSchema, type RevenueSignal } from "./revenue-signal.js";

export type RevenueOpportunityId = string;

export const REVENUE_OPPORTUNITY_TYPES = [
  "DROPSHIPPING",
  "AFFILIATE",
  "CONTENT",
  "LEAD_GENERATION",
  "DIGITAL_PRODUCT",
] as const;

export type RevenueOpportunityType = (typeof REVENUE_OPPORTUNITY_TYPES)[number];

/** Concrete business opportunity synthesized from Eye intelligence. */
export type RevenueOpportunity = {
  opportunityId: RevenueOpportunityId;
  workspaceId: string;
  productId: string;
  opportunityType: RevenueOpportunityType;
  confidence: number;
  expectedValue: number;
  expectedDifficulty: number;
  recommendedAction: string;
  reasons: string[];
  risks: string[];
  signals: RevenueSignal[];
  createdAt: string;
  updatedAt: string;
};

export type RevenueOpportunityCreateInput = Omit<
  RevenueOpportunity,
  "opportunityId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const revenueOpportunitySchema = z.object({
  opportunityId: z.string().min(1),
  workspaceId: z.string().min(1),
  productId: z.string().min(1),
  opportunityType: z.enum(REVENUE_OPPORTUNITY_TYPES),
  confidence: z.number().min(0).max(100),
  expectedValue: z.number().min(0).max(100),
  expectedDifficulty: z.number().min(0).max(100),
  recommendedAction: z.string().min(1),
  reasons: z.array(z.string()),
  risks: z.array(z.string()),
  signals: z.array(revenueSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a RevenueOpportunity record shape. */
export function validateRevenueOpportunity(value: unknown): RevenueOpportunity {
  return revenueOpportunitySchema.parse(value);
}
