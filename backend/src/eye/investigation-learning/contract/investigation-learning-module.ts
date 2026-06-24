/**
 * Investigation Learning module — converts completed investigations into reusable intelligence.
 */

import {
  InvestigationLearningEngine,
  defaultInvestigationLearningEngine,
  type InvestigationLearningInput,
} from "../engines/investigation-learning-engine.js";
import type { InvestigationLearningRecord } from "../models/investigation-learning-record.js";
import {
  learningScoring,
  scoreInvestigationLearning,
  type InvestigationLearningAnalysisInput,
  type InvestigationLearningForecastInput,
  type InvestigationLearningOpportunityInput,
} from "../scoring/learning-scoring.js";
import type {
  LearningRepository,
  LearningRepositoryQuery,
} from "../repositories/learning-repository.js";
import { createInMemoryLearningRepository } from "../repositories/in-memory-learning-repository.js";

export const INVESTIGATION_LEARNING_MODULE_ID = "investigation-learning" as const;
export type InvestigationLearningModuleId = typeof INVESTIGATION_LEARNING_MODULE_ID;

export const INVESTIGATION_LEARNING_MODULE_VERSION = "0.1.0" as const;

export type InvestigationLearningCapability =
  | "investigation-learning.record"
  | "investigation-learning.patterns"
  | "investigation-learning.recommend"
  | "investigation-learning.confidence"
  | "investigation-learning.persist"
  | "investigation-learning.list";

export const INVESTIGATION_LEARNING_CAPABILITIES: readonly InvestigationLearningCapability[] = [
  "investigation-learning.record",
  "investigation-learning.patterns",
  "investigation-learning.recommend",
  "investigation-learning.confidence",
  "investigation-learning.persist",
  "investigation-learning.list",
] as const;

export type InvestigationLearningModuleContract = {
  moduleId: InvestigationLearningModuleId;
  version: string;
  capabilities: readonly InvestigationLearningCapability[];
};

export const INVESTIGATION_LEARNING_MODULE_CONTRACT: InvestigationLearningModuleContract = {
  moduleId: INVESTIGATION_LEARNING_MODULE_ID,
  version: INVESTIGATION_LEARNING_MODULE_VERSION,
  capabilities: INVESTIGATION_LEARNING_CAPABILITIES,
};

/** Orchestrates investigation learning, pattern detection, and recommendations. */
export class InvestigationLearningModule {
  readonly contract = INVESTIGATION_LEARNING_MODULE_CONTRACT;
  private readonly engine: InvestigationLearningEngine;

  constructor(
    private readonly repository: LearningRepository,
    engine?: InvestigationLearningEngine,
  ) {
    this.engine = engine ?? new InvestigationLearningEngine(repository);
  }

  scoreInvestigationLearning = scoreInvestigationLearning;
  scoring = learningScoring;

  async recordInvestigationOutcome(
    workspaceId: string,
    input: InvestigationLearningInput,
  ): Promise<InvestigationLearningRecord> {
    return this.engine.recordOutcome(workspaceId, input);
  }

  analyzeInvestigationLearning(input: InvestigationLearningAnalysisInput) {
    return this.engine.analyze(input);
  }

  async getLearningRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<InvestigationLearningRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getLearningByExecution(
    workspaceId: string,
    executionId: string,
  ): Promise<InvestigationLearningRecord | null> {
    return this.repository.getByExecution(workspaceId, executionId);
  }

  async listLearningRecords(
    workspaceId: string,
    filters: Omit<LearningRepositoryQuery, "workspaceId"> = {},
  ): Promise<InvestigationLearningRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for an investigation learning module with optional custom dependencies. */
export function createInvestigationLearningModule(
  repository: LearningRepository = createInMemoryLearningRepository(),
  engine?: InvestigationLearningEngine,
): InvestigationLearningModule {
  return new InvestigationLearningModule(
    repository,
    engine ?? new InvestigationLearningEngine(repository),
  );
}

export const investigationLearningModule = createInvestigationLearningModule();

export type {
  InvestigationLearningInput,
  InvestigationLearningAnalysisInput,
  InvestigationLearningOpportunityInput,
  InvestigationLearningForecastInput,
};

export { defaultInvestigationLearningEngine };
