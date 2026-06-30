import type { KnowledgeGraphEnrichmentRecord } from "../models/knowledge-graph-enrichment-record.js";
import type { KnowledgeGraphEnrichmentIntelligenceRepository } from "../repositories/knowledge-graph-enrichment-intelligence-repository.js";
import {
  generateKnowledgeGraphEnrichment,
  type KnowledgeGraphEnrichmentInput,
} from "../scoring/knowledge-graph-enrichment-intelligence-scoring.js";

/** Generates knowledge graph enrichment intelligence from brand and context inputs. */
export class KnowledgeGraphEnrichmentIntelligenceEngine {
  constructor(private readonly repository: KnowledgeGraphEnrichmentIntelligenceRepository) {}

  generateEnrichment(input: KnowledgeGraphEnrichmentInput) {
    return generateKnowledgeGraphEnrichment(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: KnowledgeGraphEnrichmentInput,
  ): Promise<KnowledgeGraphEnrichmentRecord> {
    const breakdown = generateKnowledgeGraphEnrichment(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultKnowledgeGraphEnrichmentIntelligenceEngine = {
  generateEnrichment: generateKnowledgeGraphEnrichment,
};

export type { KnowledgeGraphEnrichmentInput };
