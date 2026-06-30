import { z } from "zod";

import {
  continuousLearningUpdateSchema,
  type ContinuousLearningUpdate,
} from "./continuous-learning-update.js";
import { enrichmentSignalSchema, type EnrichmentSignal } from "./enrichment-signal.js";
import { graphEntitySchema, type GraphEntity } from "./graph-entity.js";
import { graphOpportunitySchema, type GraphOpportunity } from "./graph-opportunity.js";
import { graphRelationshipSchema, type GraphRelationship } from "./graph-relationship.js";

export type KnowledgeGraphEnrichmentReportId = string;

/** Complete knowledge graph enrichment report — intelligence only, no auto-write. */
export type KnowledgeGraphEnrichmentReport = {
  reportId: KnowledgeGraphEnrichmentReportId;
  storeId: string;
  brandId: string;
  reportName: string;
  newEntities: GraphEntity[];
  newRelationships: GraphRelationship[];
  newOpportunities: GraphOpportunity[];
  continuousLearning: ContinuousLearningUpdate[];
  totalEntitiesAdded: number;
  totalRelationshipsAdded: number;
  totalOpportunitiesDiscovered: number;
  overallScore: number;
  confidence: number;
  signals: EnrichmentSignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoWriteEnabled: false;
};

export type KnowledgeGraphEnrichmentReportCreateInput = Omit<
  KnowledgeGraphEnrichmentReport,
  "reportId"
>;

export const knowledgeGraphEnrichmentReportSchema = z.object({
  reportId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  reportName: z.string().min(1),
  newEntities: z.array(graphEntitySchema).min(1),
  newRelationships: z.array(graphRelationshipSchema).min(1),
  newOpportunities: z.array(graphOpportunitySchema).min(1),
  continuousLearning: z.array(continuousLearningUpdateSchema).min(1),
  totalEntitiesAdded: z.number().int().min(1),
  totalRelationshipsAdded: z.number().int().min(1),
  totalOpportunitiesDiscovered: z.number().int().min(1),
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(enrichmentSignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoWriteEnabled: z.literal(false),
});

/** Validates a KnowledgeGraphEnrichmentReport record shape. */
export function validateKnowledgeGraphEnrichmentReport(
  value: unknown,
): KnowledgeGraphEnrichmentReport {
  return knowledgeGraphEnrichmentReportSchema.parse(value);
}
