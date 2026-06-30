import { z } from "zod";

export const GRAPH_OPPORTUNITY_TYPES = [
  "PRODUCT_LAUNCH",
  "CROSS_SELL",
  "MARKET_EXPANSION",
  "SUPPLIER_SWITCH",
  "PRICING_OPTIMIZATION",
  "AUDIENCE_EXPANSION",
] as const;

export type GraphOpportunityType = (typeof GRAPH_OPPORTUNITY_TYPES)[number];

/** New opportunity discovered via knowledge graph enrichment. */
export type GraphOpportunity = {
  opportunityId: string;
  opportunityType: GraphOpportunityType;
  title: string;
  description: string;
  relatedEntityIds: string[];
  expectedValue: number;
  confidence: number;
  score: number;
};

export const graphOpportunitySchema = z.object({
  opportunityId: z.string().min(1),
  opportunityType: z.enum(GRAPH_OPPORTUNITY_TYPES),
  title: z.string().min(1),
  description: z.string().min(1),
  relatedEntityIds: z.array(z.string().min(1)).min(1),
  expectedValue: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
});

/** Validates a GraphOpportunity record shape. */
export function validateGraphOpportunity(value: unknown): GraphOpportunity {
  return graphOpportunitySchema.parse(value);
}
