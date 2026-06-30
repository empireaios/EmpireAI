/**
 * Engine Coordination Intelligence module — engine orchestration without auto-execute.
 */

import {
  EngineCoordinationIntelligenceEngine,
  defaultEngineCoordinationIntelligenceEngine,
  type EngineCoordinationInput,
} from "../engines/engine-coordination-intelligence-engine.js";
import type { EngineCoordinationRecord } from "../models/engine-coordination-record.js";
import {
  generateEngineCoordination,
  engineCoordinationIntelligenceScoring,
  type EngineCoordinationEngineDef,
} from "../scoring/engine-coordination-intelligence-scoring.js";
import type {
  EngineCoordinationIntelligenceRepository,
  EngineCoordinationIntelligenceRepositoryQuery,
} from "../repositories/engine-coordination-intelligence-repository.js";
import { createInMemoryEngineCoordinationIntelligenceRepository } from "../repositories/in-memory-engine-coordination-intelligence-repository.js";

export const ENGINE_COORDINATION_INTELLIGENCE_MODULE_ID = "engine-coordination-intelligence" as const;
export type EngineCoordinationIntelligenceModuleId =
  typeof ENGINE_COORDINATION_INTELLIGENCE_MODULE_ID;

export const ENGINE_COORDINATION_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type EngineCoordinationIntelligenceCapability =
  | "engine-coordination-intelligence.coordinate"
  | "engine-coordination-intelligence.score"
  | "engine-coordination-intelligence.persist"
  | "engine-coordination-intelligence.list";

export const ENGINE_COORDINATION_INTELLIGENCE_CAPABILITIES: readonly EngineCoordinationIntelligenceCapability[] =
  [
    "engine-coordination-intelligence.coordinate",
    "engine-coordination-intelligence.score",
    "engine-coordination-intelligence.persist",
    "engine-coordination-intelligence.list",
  ] as const;

export type EngineCoordinationIntelligenceModuleContract = {
  moduleId: EngineCoordinationIntelligenceModuleId;
  version: string;
  capabilities: readonly EngineCoordinationIntelligenceCapability[];
};

export const ENGINE_COORDINATION_INTELLIGENCE_MODULE_CONTRACT: EngineCoordinationIntelligenceModuleContract =
  {
    moduleId: ENGINE_COORDINATION_INTELLIGENCE_MODULE_ID,
    version: ENGINE_COORDINATION_INTELLIGENCE_MODULE_VERSION,
    capabilities: ENGINE_COORDINATION_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates engine coordination generation and persistence. */
export class EngineCoordinationIntelligenceModule {
  readonly contract = ENGINE_COORDINATION_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: EngineCoordinationIntelligenceEngine;

  constructor(
    private readonly repository: EngineCoordinationIntelligenceRepository,
    engine?: EngineCoordinationIntelligenceEngine,
  ) {
    this.engine = engine ?? new EngineCoordinationIntelligenceEngine(repository);
  }

  generateEngineCoordination = generateEngineCoordination;
  scoring = engineCoordinationIntelligenceScoring;

  generateCoordination(input: EngineCoordinationInput) {
    return this.engine.generateCoordination(input);
  }

  async persistCoordination(input: EngineCoordinationInput): Promise<EngineCoordinationRecord> {
    return this.engine.generateAndSave(input);
  }

  async getCoordinationRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<EngineCoordinationRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getCoordinationByWorkspace(
    workspaceId: string,
  ): Promise<EngineCoordinationRecord | null> {
    return this.repository.getByWorkspace(workspaceId);
  }

  async listCoordinationRecords(
    filters: EngineCoordinationIntelligenceRepositoryQuery,
  ): Promise<EngineCoordinationRecord[]> {
    return this.repository.list(filters);
  }
}

/** Factory for an engine coordination intelligence module. */
export function createEngineCoordinationIntelligenceModule(
  repository: EngineCoordinationIntelligenceRepository = createInMemoryEngineCoordinationIntelligenceRepository(),
  engine?: EngineCoordinationIntelligenceEngine,
): EngineCoordinationIntelligenceModule {
  return new EngineCoordinationIntelligenceModule(
    repository,
    engine ?? new EngineCoordinationIntelligenceEngine(repository),
  );
}

export const engineCoordinationIntelligenceModule = createEngineCoordinationIntelligenceModule();

export type { EngineCoordinationInput, EngineCoordinationEngineDef };

export { defaultEngineCoordinationIntelligenceEngine };
