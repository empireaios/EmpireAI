/**
 * Competitor Intelligence module — Eye expansion for competitor tracking and alerts.
 */

import {
  CompetitorIntelligenceEngine,
  defaultCompetitorIntelligenceEngine,
  type CompetitorIntelligenceInput,
} from "../engines/competitor-intelligence-engine.js";
import type { CompetitorIntelligenceRecord } from "../models/competitor-intelligence-record.js";
import {
  generateCompetitorIntelligence,
  runCompetitorWatchCycle,
  competitorIntelligenceScoring,
} from "../scoring/competitor-intelligence-scoring.js";
import type {
  CompetitorIntelligenceRepository,
  CompetitorIntelligenceRepositoryQuery,
} from "../repositories/competitor-intelligence-repository.js";
import { createInMemoryCompetitorIntelligenceRepository } from "../repositories/in-memory-competitor-intelligence-repository.js";

export const COMPETITOR_INTELLIGENCE_MODULE_ID = "competitor-intelligence" as const;
export type CompetitorIntelligenceModuleId = typeof COMPETITOR_INTELLIGENCE_MODULE_ID;

export const COMPETITOR_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type CompetitorIntelligenceCapability =
  | "competitor-intelligence.watch"
  | "competitor-intelligence.detect"
  | "competitor-intelligence.alert"
  | "competitor-intelligence.persist"
  | "competitor-intelligence.list";

export const COMPETITOR_INTELLIGENCE_CAPABILITIES: readonly CompetitorIntelligenceCapability[] = [
  "competitor-intelligence.watch",
  "competitor-intelligence.detect",
  "competitor-intelligence.alert",
  "competitor-intelligence.persist",
  "competitor-intelligence.list",
] as const;

export type CompetitorIntelligenceModuleContract = {
  moduleId: CompetitorIntelligenceModuleId;
  version: string;
  capabilities: readonly CompetitorIntelligenceCapability[];
};

export const COMPETITOR_INTELLIGENCE_MODULE_CONTRACT: CompetitorIntelligenceModuleContract = {
  moduleId: COMPETITOR_INTELLIGENCE_MODULE_ID,
  version: COMPETITOR_INTELLIGENCE_MODULE_VERSION,
  capabilities: COMPETITOR_INTELLIGENCE_CAPABILITIES,
};

/** Orchestrates competitor watch, change detection, alerts, and persistence. */
export class CompetitorIntelligenceModule {
  readonly contract = COMPETITOR_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: CompetitorIntelligenceEngine;

  constructor(
    private readonly repository: CompetitorIntelligenceRepository,
    engine?: CompetitorIntelligenceEngine,
  ) {
    this.engine = engine ?? new CompetitorIntelligenceEngine(repository);
  }

  generateCompetitorIntelligence = generateCompetitorIntelligence;
  runCompetitorWatchCycle = runCompetitorWatchCycle;
  scoring = competitorIntelligenceScoring;

  async runBaselineWatch(
    workspaceId: string,
    input: CompetitorIntelligenceInput,
  ): Promise<CompetitorIntelligenceRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async runDeltaWatch(
    workspaceId: string,
    input: CompetitorIntelligenceInput,
  ): Promise<CompetitorIntelligenceRecord> {
    return this.engine.runWatchCycleAndSave(workspaceId, input);
  }

  async getReportRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<CompetitorIntelligenceRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getReportByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<CompetitorIntelligenceRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listReportRecords(
    workspaceId: string,
    filters: Omit<CompetitorIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<CompetitorIntelligenceRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a competitor intelligence module. */
export function createCompetitorIntelligenceModule(
  repository: CompetitorIntelligenceRepository = createInMemoryCompetitorIntelligenceRepository(),
  engine?: CompetitorIntelligenceEngine,
): CompetitorIntelligenceModule {
  return new CompetitorIntelligenceModule(
    repository,
    engine ?? new CompetitorIntelligenceEngine(repository),
  );
}

export const competitorIntelligenceModule = createCompetitorIntelligenceModule();

export type { CompetitorIntelligenceInput };

export { defaultCompetitorIntelligenceEngine };
