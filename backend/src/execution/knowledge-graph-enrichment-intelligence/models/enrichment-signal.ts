import { z } from "zod";

export const ENRICHMENT_SIGNAL_TYPES = [
  "entity_discovery",
  "relationship_mapping",
  "opportunity_synthesis",
  "continuous_learning",
  "graph_coverage",
  "enrichment_composite",
] as const;

export type EnrichmentSignalType = (typeof ENRICHMENT_SIGNAL_TYPES)[number];

/** Scoring signal for knowledge graph enrichment confidence. */
export type EnrichmentSignal = {
  signalType: EnrichmentSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const enrichmentSignalSchema = z.object({
  signalType: z.enum(ENRICHMENT_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates an EnrichmentSignal record shape. */
export function validateEnrichmentSignal(value: unknown): EnrichmentSignal {
  return enrichmentSignalSchema.parse(value);
}
