/**
 * Analytics Intelligence module — tracking blueprints without live API integration.
 */

import {
  AnalyticsIntelligenceEngine,
  defaultAnalyticsIntelligenceEngine,
  type AnalyticsIntelligenceInput,
} from "../engines/analytics-intelligence-engine.js";
import type { AnalyticsIntelligenceRecord } from "../models/analytics-intelligence-record.js";
import {
  generateAnalyticsBlueprint,
  analyticsIntelligenceScoring,
  type AnalyticsIntelligenceBrandInput,
  type AnalyticsIntelligenceOfferInput,
} from "../scoring/analytics-intelligence-scoring.js";
import type {
  AnalyticsIntelligenceRepository,
  AnalyticsIntelligenceRepositoryQuery,
} from "../repositories/analytics-intelligence-repository.js";
import { createInMemoryAnalyticsIntelligenceRepository } from "../repositories/in-memory-analytics-intelligence-repository.js";

export const ANALYTICS_INTELLIGENCE_MODULE_ID = "analytics-intelligence" as const;
export type AnalyticsIntelligenceModuleId = typeof ANALYTICS_INTELLIGENCE_MODULE_ID;

export const ANALYTICS_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type AnalyticsIntelligenceCapability =
  | "analytics-intelligence.generate"
  | "analytics-intelligence.score"
  | "analytics-intelligence.persist"
  | "analytics-intelligence.list";

export const ANALYTICS_INTELLIGENCE_CAPABILITIES: readonly AnalyticsIntelligenceCapability[] = [
  "analytics-intelligence.generate",
  "analytics-intelligence.score",
  "analytics-intelligence.persist",
  "analytics-intelligence.list",
] as const;

export type AnalyticsIntelligenceModuleContract = {
  moduleId: AnalyticsIntelligenceModuleId;
  version: string;
  capabilities: readonly AnalyticsIntelligenceCapability[];
};

export const ANALYTICS_INTELLIGENCE_MODULE_CONTRACT: AnalyticsIntelligenceModuleContract = {
  moduleId: ANALYTICS_INTELLIGENCE_MODULE_ID,
  version: ANALYTICS_INTELLIGENCE_MODULE_VERSION,
  capabilities: ANALYTICS_INTELLIGENCE_CAPABILITIES,
};

/** Orchestrates analytics blueprint generation and persistence. */
export class AnalyticsIntelligenceModule {
  readonly contract = ANALYTICS_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: AnalyticsIntelligenceEngine;

  constructor(
    private readonly repository: AnalyticsIntelligenceRepository,
    engine?: AnalyticsIntelligenceEngine,
  ) {
    this.engine = engine ?? new AnalyticsIntelligenceEngine(repository);
  }

  generateAnalyticsBlueprint = generateAnalyticsBlueprint;
  scoring = analyticsIntelligenceScoring;

  generateBlueprint(input: AnalyticsIntelligenceInput) {
    return this.engine.generateBlueprint(input);
  }

  async persistBlueprint(
    workspaceId: string,
    input: AnalyticsIntelligenceInput,
  ): Promise<AnalyticsIntelligenceRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getBlueprintRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<AnalyticsIntelligenceRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getBlueprintByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<AnalyticsIntelligenceRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listBlueprintRecords(
    workspaceId: string,
    filters: Omit<AnalyticsIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<AnalyticsIntelligenceRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for an analytics intelligence module. */
export function createAnalyticsIntelligenceModule(
  repository: AnalyticsIntelligenceRepository = createInMemoryAnalyticsIntelligenceRepository(),
  engine?: AnalyticsIntelligenceEngine,
): AnalyticsIntelligenceModule {
  return new AnalyticsIntelligenceModule(
    repository,
    engine ?? new AnalyticsIntelligenceEngine(repository),
  );
}

export const analyticsIntelligenceModule = createAnalyticsIntelligenceModule();

export type {
  AnalyticsIntelligenceInput,
  AnalyticsIntelligenceBrandInput,
  AnalyticsIntelligenceOfferInput,
};

export { defaultAnalyticsIntelligenceEngine };
