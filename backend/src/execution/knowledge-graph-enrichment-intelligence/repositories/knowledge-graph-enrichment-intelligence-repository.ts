import type {
  KnowledgeGraphEnrichmentRecord,
  KnowledgeGraphEnrichmentRecordCreateInput,
} from "../models/knowledge-graph-enrichment-record.js";

export type KnowledgeGraphEnrichmentIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for knowledge graph enrichment intelligence records. */
export type KnowledgeGraphEnrichmentIntelligenceRepository = {
  save(
    workspaceId: string,
    input: KnowledgeGraphEnrichmentRecordCreateInput,
  ): Promise<KnowledgeGraphEnrichmentRecord>;
  getById(workspaceId: string, recordId: string): Promise<KnowledgeGraphEnrichmentRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<KnowledgeGraphEnrichmentRecord | null>;
  list(
    query: KnowledgeGraphEnrichmentIntelligenceRepositoryQuery,
  ): Promise<KnowledgeGraphEnrichmentRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
