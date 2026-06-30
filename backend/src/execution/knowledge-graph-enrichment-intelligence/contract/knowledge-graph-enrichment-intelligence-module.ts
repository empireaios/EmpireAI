/**
 * Knowledge Graph Enrichment Intelligence module — graph enrichment without auto-write.
 */

import {
  KnowledgeGraphEnrichmentIntelligenceEngine,
  defaultKnowledgeGraphEnrichmentIntelligenceEngine,
  type KnowledgeGraphEnrichmentInput,
} from "../engines/knowledge-graph-enrichment-intelligence-engine.js";
import type { KnowledgeGraphEnrichmentRecord } from "../models/knowledge-graph-enrichment-record.js";
import {
  generateKnowledgeGraphEnrichment,
  knowledgeGraphEnrichmentIntelligenceScoring,
  type KnowledgeGraphEnrichmentBrandInput,
  type KnowledgeGraphEnrichmentContextInput,
} from "../scoring/knowledge-graph-enrichment-intelligence-scoring.js";
import type {
  KnowledgeGraphEnrichmentIntelligenceRepository,
  KnowledgeGraphEnrichmentIntelligenceRepositoryQuery,
} from "../repositories/knowledge-graph-enrichment-intelligence-repository.js";
import { createInMemoryKnowledgeGraphEnrichmentIntelligenceRepository } from "../repositories/in-memory-knowledge-graph-enrichment-intelligence-repository.js";

export const KNOWLEDGE_GRAPH_ENRICHMENT_INTELLIGENCE_MODULE_ID =
  "knowledge-graph-enrichment-intelligence" as const;
export type KnowledgeGraphEnrichmentIntelligenceModuleId =
  typeof KNOWLEDGE_GRAPH_ENRICHMENT_INTELLIGENCE_MODULE_ID;

export const KNOWLEDGE_GRAPH_ENRICHMENT_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type KnowledgeGraphEnrichmentIntelligenceCapability =
  | "knowledge-graph-enrichment-intelligence.enrich"
  | "knowledge-graph-enrichment-intelligence.score"
  | "knowledge-graph-enrichment-intelligence.persist"
  | "knowledge-graph-enrichment-intelligence.list";

export const KNOWLEDGE_GRAPH_ENRICHMENT_INTELLIGENCE_CAPABILITIES: readonly KnowledgeGraphEnrichmentIntelligenceCapability[] =
  [
    "knowledge-graph-enrichment-intelligence.enrich",
    "knowledge-graph-enrichment-intelligence.score",
    "knowledge-graph-enrichment-intelligence.persist",
    "knowledge-graph-enrichment-intelligence.list",
  ] as const;

export type KnowledgeGraphEnrichmentIntelligenceModuleContract = {
  moduleId: KnowledgeGraphEnrichmentIntelligenceModuleId;
  version: string;
  capabilities: readonly KnowledgeGraphEnrichmentIntelligenceCapability[];
};

export const KNOWLEDGE_GRAPH_ENRICHMENT_INTELLIGENCE_MODULE_CONTRACT: KnowledgeGraphEnrichmentIntelligenceModuleContract =
  {
    moduleId: KNOWLEDGE_GRAPH_ENRICHMENT_INTELLIGENCE_MODULE_ID,
    version: KNOWLEDGE_GRAPH_ENRICHMENT_INTELLIGENCE_MODULE_VERSION,
    capabilities: KNOWLEDGE_GRAPH_ENRICHMENT_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates knowledge graph enrichment generation and persistence. */
export class KnowledgeGraphEnrichmentIntelligenceModule {
  readonly contract = KNOWLEDGE_GRAPH_ENRICHMENT_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: KnowledgeGraphEnrichmentIntelligenceEngine;

  constructor(
    private readonly repository: KnowledgeGraphEnrichmentIntelligenceRepository,
    engine?: KnowledgeGraphEnrichmentIntelligenceEngine,
  ) {
    this.engine = engine ?? new KnowledgeGraphEnrichmentIntelligenceEngine(repository);
  }

  generateKnowledgeGraphEnrichment = generateKnowledgeGraphEnrichment;
  scoring = knowledgeGraphEnrichmentIntelligenceScoring;

  generateEnrichment(input: KnowledgeGraphEnrichmentInput) {
    return this.engine.generateEnrichment(input);
  }

  async persistEnrichment(
    workspaceId: string,
    input: KnowledgeGraphEnrichmentInput,
  ): Promise<KnowledgeGraphEnrichmentRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getEnrichmentRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<KnowledgeGraphEnrichmentRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getEnrichmentByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<KnowledgeGraphEnrichmentRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listEnrichmentRecords(
    workspaceId: string,
    filters: Omit<KnowledgeGraphEnrichmentIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<KnowledgeGraphEnrichmentRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a knowledge graph enrichment intelligence module. */
export function createKnowledgeGraphEnrichmentIntelligenceModule(
  repository: KnowledgeGraphEnrichmentIntelligenceRepository = createInMemoryKnowledgeGraphEnrichmentIntelligenceRepository(),
  engine?: KnowledgeGraphEnrichmentIntelligenceEngine,
): KnowledgeGraphEnrichmentIntelligenceModule {
  return new KnowledgeGraphEnrichmentIntelligenceModule(
    repository,
    engine ?? new KnowledgeGraphEnrichmentIntelligenceEngine(repository),
  );
}

export const knowledgeGraphEnrichmentIntelligenceModule =
  createKnowledgeGraphEnrichmentIntelligenceModule();

export type {
  KnowledgeGraphEnrichmentInput,
  KnowledgeGraphEnrichmentBrandInput,
  KnowledgeGraphEnrichmentContextInput,
};

export { defaultKnowledgeGraphEnrichmentIntelligenceEngine };
