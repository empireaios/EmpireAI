/**
 * Continuous Optimization Intelligence module — optimization tasks without auto-apply.
 */

import {
  ContinuousOptimizationIntelligenceEngine,
  defaultContinuousOptimizationIntelligenceEngine,
  type ContinuousOptimizationInput,
} from "../engines/continuous-optimization-intelligence-engine.js";
import type { ContinuousOptimizationRecord } from "../models/continuous-optimization-record.js";
import {
  generateContinuousOptimization,
  continuousOptimizationIntelligenceScoring,
  type ContinuousOptimizationBrandInput,
  type ContinuousOptimizationMetricsInput,
} from "../scoring/continuous-optimization-intelligence-scoring.js";
import type {
  ContinuousOptimizationIntelligenceRepository,
  ContinuousOptimizationIntelligenceRepositoryQuery,
} from "../repositories/continuous-optimization-intelligence-repository.js";
import { createInMemoryContinuousOptimizationIntelligenceRepository } from "../repositories/in-memory-continuous-optimization-intelligence-repository.js";

export const CONTINUOUS_OPTIMIZATION_INTELLIGENCE_MODULE_ID =
  "continuous-optimization-intelligence" as const;
export type ContinuousOptimizationIntelligenceModuleId =
  typeof CONTINUOUS_OPTIMIZATION_INTELLIGENCE_MODULE_ID;

export const CONTINUOUS_OPTIMIZATION_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type ContinuousOptimizationIntelligenceCapability =
  | "continuous-optimization-intelligence.optimize"
  | "continuous-optimization-intelligence.score"
  | "continuous-optimization-intelligence.persist"
  | "continuous-optimization-intelligence.list";

export const CONTINUOUS_OPTIMIZATION_INTELLIGENCE_CAPABILITIES: readonly ContinuousOptimizationIntelligenceCapability[] =
  [
    "continuous-optimization-intelligence.optimize",
    "continuous-optimization-intelligence.score",
    "continuous-optimization-intelligence.persist",
    "continuous-optimization-intelligence.list",
  ] as const;

export type ContinuousOptimizationIntelligenceModuleContract = {
  moduleId: ContinuousOptimizationIntelligenceModuleId;
  version: string;
  capabilities: readonly ContinuousOptimizationIntelligenceCapability[];
};

export const CONTINUOUS_OPTIMIZATION_INTELLIGENCE_MODULE_CONTRACT: ContinuousOptimizationIntelligenceModuleContract =
  {
    moduleId: CONTINUOUS_OPTIMIZATION_INTELLIGENCE_MODULE_ID,
    version: CONTINUOUS_OPTIMIZATION_INTELLIGENCE_MODULE_VERSION,
    capabilities: CONTINUOUS_OPTIMIZATION_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates continuous optimization generation and persistence. */
export class ContinuousOptimizationIntelligenceModule {
  readonly contract = CONTINUOUS_OPTIMIZATION_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: ContinuousOptimizationIntelligenceEngine;

  constructor(
    private readonly repository: ContinuousOptimizationIntelligenceRepository,
    engine?: ContinuousOptimizationIntelligenceEngine,
  ) {
    this.engine = engine ?? new ContinuousOptimizationIntelligenceEngine(repository);
  }

  generateContinuousOptimization = generateContinuousOptimization;
  scoring = continuousOptimizationIntelligenceScoring;

  generateOptimization(input: ContinuousOptimizationInput) {
    return this.engine.generateOptimization(input);
  }

  async persistOptimization(
    workspaceId: string,
    input: ContinuousOptimizationInput,
  ): Promise<ContinuousOptimizationRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getOptimizationRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<ContinuousOptimizationRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getOptimizationByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<ContinuousOptimizationRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listOptimizationRecords(
    workspaceId: string,
    filters: Omit<ContinuousOptimizationIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<ContinuousOptimizationRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a continuous optimization intelligence module. */
export function createContinuousOptimizationIntelligenceModule(
  repository: ContinuousOptimizationIntelligenceRepository = createInMemoryContinuousOptimizationIntelligenceRepository(),
  engine?: ContinuousOptimizationIntelligenceEngine,
): ContinuousOptimizationIntelligenceModule {
  return new ContinuousOptimizationIntelligenceModule(
    repository,
    engine ?? new ContinuousOptimizationIntelligenceEngine(repository),
  );
}

export const continuousOptimizationIntelligenceModule =
  createContinuousOptimizationIntelligenceModule();

export type {
  ContinuousOptimizationInput,
  ContinuousOptimizationBrandInput,
  ContinuousOptimizationMetricsInput,
};

export { defaultContinuousOptimizationIntelligenceEngine };
