/**
 * Decision Explainability Intelligence module — explainable AI decisions without auto-execute.
 */

import {
  DecisionExplainabilityIntelligenceEngine,
  defaultDecisionExplainabilityIntelligenceEngine,
  type DecisionExplainabilityInput,
} from "../engines/decision-explainability-intelligence-engine.js";
import type { DecisionExplainabilityRecord } from "../models/decision-explainability-record.js";
import {
  generateDecisionExplainability,
  decisionExplainabilityIntelligenceScoring,
  type DecisionExplainabilityBrandInput,
  type DecisionExplainabilityDecisionInput,
} from "../scoring/decision-explainability-intelligence-scoring.js";
import type {
  DecisionExplainabilityIntelligenceRepository,
  DecisionExplainabilityIntelligenceRepositoryQuery,
} from "../repositories/decision-explainability-intelligence-repository.js";
import { createInMemoryDecisionExplainabilityIntelligenceRepository } from "../repositories/in-memory-decision-explainability-intelligence-repository.js";

export const DECISION_EXPLAINABILITY_INTELLIGENCE_MODULE_ID =
  "decision-explainability-intelligence" as const;
export type DecisionExplainabilityIntelligenceModuleId =
  typeof DECISION_EXPLAINABILITY_INTELLIGENCE_MODULE_ID;

export const DECISION_EXPLAINABILITY_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type DecisionExplainabilityIntelligenceCapability =
  | "decision-explainability-intelligence.explain"
  | "decision-explainability-intelligence.score"
  | "decision-explainability-intelligence.persist"
  | "decision-explainability-intelligence.list";

export const DECISION_EXPLAINABILITY_INTELLIGENCE_CAPABILITIES: readonly DecisionExplainabilityIntelligenceCapability[] =
  [
    "decision-explainability-intelligence.explain",
    "decision-explainability-intelligence.score",
    "decision-explainability-intelligence.persist",
    "decision-explainability-intelligence.list",
  ] as const;

export type DecisionExplainabilityIntelligenceModuleContract = {
  moduleId: DecisionExplainabilityIntelligenceModuleId;
  version: string;
  capabilities: readonly DecisionExplainabilityIntelligenceCapability[];
};

export const DECISION_EXPLAINABILITY_INTELLIGENCE_MODULE_CONTRACT: DecisionExplainabilityIntelligenceModuleContract =
  {
    moduleId: DECISION_EXPLAINABILITY_INTELLIGENCE_MODULE_ID,
    version: DECISION_EXPLAINABILITY_INTELLIGENCE_MODULE_VERSION,
    capabilities: DECISION_EXPLAINABILITY_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates decision explainability generation and persistence. */
export class DecisionExplainabilityIntelligenceModule {
  readonly contract = DECISION_EXPLAINABILITY_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: DecisionExplainabilityIntelligenceEngine;

  constructor(
    private readonly repository: DecisionExplainabilityIntelligenceRepository,
    engine?: DecisionExplainabilityIntelligenceEngine,
  ) {
    this.engine = engine ?? new DecisionExplainabilityIntelligenceEngine(repository);
  }

  generateDecisionExplainability = generateDecisionExplainability;
  scoring = decisionExplainabilityIntelligenceScoring;

  generateExplainability(input: DecisionExplainabilityInput) {
    return this.engine.generateExplainability(input);
  }

  async persistExplainability(
    workspaceId: string,
    input: DecisionExplainabilityInput,
  ): Promise<DecisionExplainabilityRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getExplainabilityRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<DecisionExplainabilityRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getExplainabilityByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<DecisionExplainabilityRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listExplainabilityRecords(
    workspaceId: string,
    filters: Omit<DecisionExplainabilityIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<DecisionExplainabilityRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a decision explainability intelligence module. */
export function createDecisionExplainabilityIntelligenceModule(
  repository: DecisionExplainabilityIntelligenceRepository = createInMemoryDecisionExplainabilityIntelligenceRepository(),
  engine?: DecisionExplainabilityIntelligenceEngine,
): DecisionExplainabilityIntelligenceModule {
  return new DecisionExplainabilityIntelligenceModule(
    repository,
    engine ?? new DecisionExplainabilityIntelligenceEngine(repository),
  );
}

export const decisionExplainabilityIntelligenceModule =
  createDecisionExplainabilityIntelligenceModule();

export type {
  DecisionExplainabilityInput,
  DecisionExplainabilityBrandInput,
  DecisionExplainabilityDecisionInput,
};

export { defaultDecisionExplainabilityIntelligenceEngine };
