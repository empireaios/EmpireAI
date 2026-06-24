/**
 * Investigation Priority Intelligence module — decides what EmpireAI should investigate next.
 */

import {
  InvestigationPriorityEngine,
  defaultInvestigationPriorityEngine,
} from "../engines/investigation-priority-engine.js";
import type { InvestigationPriority } from "../models/investigation-priority.js";
import type { InvestigationTarget } from "../models/investigation-target.js";
import {
  scoreInvestigationPriority,
  priorityScoring,
  type InvestigationPriorityAnalysisInput,
} from "../scoring/priority-scoring.js";
import type {
  InvestigationRepository,
  InvestigationRepositoryQuery,
} from "../repositories/investigation-repository.js";
import { createInMemoryInvestigationRepository } from "../repositories/in-memory-investigation-repository.js";

export const INVESTIGATION_PRIORITY_INTELLIGENCE_MODULE_ID =
  "investigation-priority-intelligence" as const;
export type InvestigationPriorityIntelligenceModuleId =
  typeof INVESTIGATION_PRIORITY_INTELLIGENCE_MODULE_ID;

export const INVESTIGATION_PRIORITY_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type InvestigationPriorityIntelligenceCapability =
  | "investigation-priority-intelligence.score"
  | "investigation-priority-intelligence.rank"
  | "investigation-priority-intelligence.persist"
  | "investigation-priority-intelligence.list";

export const INVESTIGATION_PRIORITY_INTELLIGENCE_CAPABILITIES: readonly InvestigationPriorityIntelligenceCapability[] =
  [
    "investigation-priority-intelligence.score",
    "investigation-priority-intelligence.rank",
    "investigation-priority-intelligence.persist",
    "investigation-priority-intelligence.list",
  ] as const;

export type InvestigationPriorityIntelligenceModuleContract = {
  moduleId: InvestigationPriorityIntelligenceModuleId;
  version: string;
  capabilities: readonly InvestigationPriorityIntelligenceCapability[];
};

export const INVESTIGATION_PRIORITY_INTELLIGENCE_MODULE_CONTRACT: InvestigationPriorityIntelligenceModuleContract =
  {
    moduleId: INVESTIGATION_PRIORITY_INTELLIGENCE_MODULE_ID,
    version: INVESTIGATION_PRIORITY_INTELLIGENCE_MODULE_VERSION,
    capabilities: INVESTIGATION_PRIORITY_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates investigation target prioritization and persistence. */
export class InvestigationPriorityModule {
  readonly contract = INVESTIGATION_PRIORITY_INTELLIGENCE_MODULE_CONTRACT;

  constructor(
    private readonly repository: InvestigationRepository,
    private readonly engine: InvestigationPriorityEngine = defaultInvestigationPriorityEngine,
  ) {}

  scoreInvestigationPriority = scoreInvestigationPriority;
  scoring = priorityScoring;

  async prioritizeTarget(
    workspaceId: string,
    input: InvestigationPriorityAnalysisInput,
  ): Promise<{ target: InvestigationTarget; priority: InvestigationPriority }> {
    const target = await this.repository.upsertTarget(workspaceId, input.target);
    const breakdown = this.engine.evaluate(input);
    const priority = await this.repository.savePriority(workspaceId, target.targetId, breakdown);
    return { target, priority };
  }

  rankTargets(inputs: InvestigationPriorityAnalysisInput[]) {
    return this.engine.rank(inputs);
  }

  async getInvestigationPriority(
    workspaceId: string,
    productId: string,
  ): Promise<InvestigationPriority | null> {
    return this.repository.getPriorityByProduct(workspaceId, productId);
  }

  async listInvestigationPriorities(
    workspaceId: string,
    filters: Omit<InvestigationRepositoryQuery, "workspaceId"> = {},
  ): Promise<InvestigationPriority[]> {
    return this.repository.listPriorities({ workspaceId, ...filters });
  }
}

/** Factory for an investigation priority module with optional custom dependencies. */
export function createInvestigationPriorityModule(
  repository: InvestigationRepository = createInMemoryInvestigationRepository(),
  engine: InvestigationPriorityEngine = defaultInvestigationPriorityEngine,
): InvestigationPriorityModule {
  return new InvestigationPriorityModule(repository, engine);
}

export const investigationPriorityModule = createInvestigationPriorityModule();
