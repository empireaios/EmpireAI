/**
 * Content Library Intelligence module — blog strategy and content blueprints.
 */

import {
  ContentLibraryIntelligenceEngine,
  defaultContentLibraryIntelligenceEngine,
  type ContentLibraryInput,
} from "../engines/content-library-intelligence-engine.js";
import type { ContentLibraryRecord } from "../models/content-library-record.js";
import {
  generateContentLibrary,
  contentLibraryIntelligenceScoring,
  type ContentLibraryBrandInput,
  type ContentLibraryOfferInput,
} from "../scoring/content-library-intelligence-scoring.js";
import type {
  ContentLibraryRepository,
  ContentLibraryRepositoryQuery,
} from "../repositories/content-library-repository.js";
import { createInMemoryContentLibraryRepository } from "../repositories/in-memory-content-library-repository.js";

export const CONTENT_LIBRARY_INTELLIGENCE_MODULE_ID = "content-library-intelligence" as const;
export type ContentLibraryIntelligenceModuleId =
  typeof CONTENT_LIBRARY_INTELLIGENCE_MODULE_ID;

export const CONTENT_LIBRARY_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type ContentLibraryIntelligenceCapability =
  | "content-library-intelligence.generate"
  | "content-library-intelligence.score"
  | "content-library-intelligence.persist"
  | "content-library-intelligence.list";

export const CONTENT_LIBRARY_INTELLIGENCE_CAPABILITIES: readonly ContentLibraryIntelligenceCapability[] =
  [
    "content-library-intelligence.generate",
    "content-library-intelligence.score",
    "content-library-intelligence.persist",
    "content-library-intelligence.list",
  ] as const;

export type ContentLibraryIntelligenceModuleContract = {
  moduleId: ContentLibraryIntelligenceModuleId;
  version: string;
  capabilities: readonly ContentLibraryIntelligenceCapability[];
};

export const CONTENT_LIBRARY_INTELLIGENCE_MODULE_CONTRACT: ContentLibraryIntelligenceModuleContract =
  {
    moduleId: CONTENT_LIBRARY_INTELLIGENCE_MODULE_ID,
    version: CONTENT_LIBRARY_INTELLIGENCE_MODULE_VERSION,
    capabilities: CONTENT_LIBRARY_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates content library generation and persistence. */
export class ContentLibraryIntelligenceModule {
  readonly contract = CONTENT_LIBRARY_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: ContentLibraryIntelligenceEngine;

  constructor(
    private readonly repository: ContentLibraryRepository,
    engine?: ContentLibraryIntelligenceEngine,
  ) {
    this.engine = engine ?? new ContentLibraryIntelligenceEngine(repository);
  }

  generateContentLibrary = generateContentLibrary;
  scoring = contentLibraryIntelligenceScoring;

  generateLibrary(input: ContentLibraryInput) {
    return this.engine.generateLibrary(input);
  }

  async persistLibrary(
    workspaceId: string,
    input: ContentLibraryInput,
  ): Promise<ContentLibraryRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getLibraryRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<ContentLibraryRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getLibraryByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<ContentLibraryRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listLibraryRecords(
    workspaceId: string,
    filters: Omit<ContentLibraryRepositoryQuery, "workspaceId"> = {},
  ): Promise<ContentLibraryRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a content library intelligence module. */
export function createContentLibraryIntelligenceModule(
  repository: ContentLibraryRepository = createInMemoryContentLibraryRepository(),
  engine?: ContentLibraryIntelligenceEngine,
): ContentLibraryIntelligenceModule {
  return new ContentLibraryIntelligenceModule(
    repository,
    engine ?? new ContentLibraryIntelligenceEngine(repository),
  );
}

export const contentLibraryIntelligenceModule = createContentLibraryIntelligenceModule();

export type {
  ContentLibraryInput,
  ContentLibraryBrandInput,
  ContentLibraryOfferInput,
};

export { defaultContentLibraryIntelligenceEngine };
