/**
 * Persistent Memory Intelligence module — long-term learning without auto-write.
 */

import {
  PersistentMemoryIntelligenceEngine,
  defaultPersistentMemoryIntelligenceEngine,
  type PersistentMemoryInput,
} from "../engines/persistent-memory-intelligence-engine.js";
import type { PersistentMemoryRecord } from "../models/persistent-memory-record.js";
import {
  generatePersistentMemory,
  persistentMemoryIntelligenceScoring,
  type PersistentMemoryBrandInput,
  type PersistentMemoryContextInput,
} from "../scoring/persistent-memory-intelligence-scoring.js";
import type {
  PersistentMemoryIntelligenceRepository,
  PersistentMemoryIntelligenceRepositoryQuery,
} from "../repositories/persistent-memory-intelligence-repository.js";
import { createInMemoryPersistentMemoryIntelligenceRepository } from "../repositories/in-memory-persistent-memory-intelligence-repository.js";

export const PERSISTENT_MEMORY_INTELLIGENCE_MODULE_ID = "persistent-memory-intelligence" as const;
export type PersistentMemoryIntelligenceModuleId =
  typeof PERSISTENT_MEMORY_INTELLIGENCE_MODULE_ID;

export const PERSISTENT_MEMORY_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type PersistentMemoryIntelligenceCapability =
  | "persistent-memory-intelligence.learn"
  | "persistent-memory-intelligence.score"
  | "persistent-memory-intelligence.persist"
  | "persistent-memory-intelligence.list";

export const PERSISTENT_MEMORY_INTELLIGENCE_CAPABILITIES: readonly PersistentMemoryIntelligenceCapability[] =
  [
    "persistent-memory-intelligence.learn",
    "persistent-memory-intelligence.score",
    "persistent-memory-intelligence.persist",
    "persistent-memory-intelligence.list",
  ] as const;

export type PersistentMemoryIntelligenceModuleContract = {
  moduleId: PersistentMemoryIntelligenceModuleId;
  version: string;
  capabilities: readonly PersistentMemoryIntelligenceCapability[];
};

export const PERSISTENT_MEMORY_INTELLIGENCE_MODULE_CONTRACT: PersistentMemoryIntelligenceModuleContract =
  {
    moduleId: PERSISTENT_MEMORY_INTELLIGENCE_MODULE_ID,
    version: PERSISTENT_MEMORY_INTELLIGENCE_MODULE_VERSION,
    capabilities: PERSISTENT_MEMORY_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates persistent memory generation and persistence. */
export class PersistentMemoryIntelligenceModule {
  readonly contract = PERSISTENT_MEMORY_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: PersistentMemoryIntelligenceEngine;

  constructor(
    private readonly repository: PersistentMemoryIntelligenceRepository,
    engine?: PersistentMemoryIntelligenceEngine,
  ) {
    this.engine = engine ?? new PersistentMemoryIntelligenceEngine(repository);
  }

  generatePersistentMemory = generatePersistentMemory;
  scoring = persistentMemoryIntelligenceScoring;

  generateMemory(input: PersistentMemoryInput) {
    return this.engine.generateMemory(input);
  }

  async persistMemory(
    workspaceId: string,
    input: PersistentMemoryInput,
  ): Promise<PersistentMemoryRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getMemoryRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<PersistentMemoryRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getMemoryByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<PersistentMemoryRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listMemoryRecords(
    workspaceId: string,
    filters: Omit<PersistentMemoryIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<PersistentMemoryRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a persistent memory intelligence module. */
export function createPersistentMemoryIntelligenceModule(
  repository: PersistentMemoryIntelligenceRepository = createInMemoryPersistentMemoryIntelligenceRepository(),
  engine?: PersistentMemoryIntelligenceEngine,
): PersistentMemoryIntelligenceModule {
  return new PersistentMemoryIntelligenceModule(
    repository,
    engine ?? new PersistentMemoryIntelligenceEngine(repository),
  );
}

export const persistentMemoryIntelligenceModule = createPersistentMemoryIntelligenceModule();

export type { PersistentMemoryInput, PersistentMemoryBrandInput, PersistentMemoryContextInput };

export { defaultPersistentMemoryIntelligenceEngine };
