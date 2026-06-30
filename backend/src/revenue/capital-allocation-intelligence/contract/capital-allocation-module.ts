/**
 * Capital Allocation Intelligence module — allocates capital across portfolio opportunities.
 */

import {
  CapitalAllocationEngine,
  defaultCapitalAllocationEngine,
  type CapitalAllocationEntryInput,
  type CapitalAllocationPlanInput,
} from "../engines/capital-allocation-engine.js";
import type { CapitalAllocation } from "../models/capital-allocation.js";
import {
  capitalAllocationScoring,
  scoreCapitalAllocation,
} from "../scoring/capital-allocation-scoring.js";
import type {
  AllocationRepository,
  AllocationRepositoryQuery,
} from "../repositories/allocation-repository.js";
import { createInMemoryAllocationRepository } from "../repositories/in-memory-allocation-repository.js";

export const CAPITAL_ALLOCATION_INTELLIGENCE_MODULE_ID =
  "capital-allocation-intelligence" as const;
export type CapitalAllocationIntelligenceModuleId =
  typeof CAPITAL_ALLOCATION_INTELLIGENCE_MODULE_ID;

export const CAPITAL_ALLOCATION_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type CapitalAllocationIntelligenceCapability =
  | "capital-allocation-intelligence.allocate"
  | "capital-allocation-intelligence.score"
  | "capital-allocation-intelligence.persist"
  | "capital-allocation-intelligence.list";

export const CAPITAL_ALLOCATION_INTELLIGENCE_CAPABILITIES: readonly CapitalAllocationIntelligenceCapability[] =
  [
    "capital-allocation-intelligence.allocate",
    "capital-allocation-intelligence.score",
    "capital-allocation-intelligence.persist",
    "capital-allocation-intelligence.list",
  ] as const;

export type CapitalAllocationIntelligenceModuleContract = {
  moduleId: CapitalAllocationIntelligenceModuleId;
  version: string;
  capabilities: readonly CapitalAllocationIntelligenceCapability[];
};

export const CAPITAL_ALLOCATION_INTELLIGENCE_MODULE_CONTRACT: CapitalAllocationIntelligenceModuleContract =
  {
    moduleId: CAPITAL_ALLOCATION_INTELLIGENCE_MODULE_ID,
    version: CAPITAL_ALLOCATION_INTELLIGENCE_MODULE_VERSION,
    capabilities: CAPITAL_ALLOCATION_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates capital allocation scoring and persistence. */
export class CapitalAllocationModule {
  readonly contract = CAPITAL_ALLOCATION_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: CapitalAllocationEngine;

  constructor(
    private readonly repository: AllocationRepository,
    engine?: CapitalAllocationEngine,
  ) {
    this.engine = engine ?? new CapitalAllocationEngine(repository);
  }

  scoreCapitalAllocation = scoreCapitalAllocation;
  scoring = capitalAllocationScoring;

  allocateCapital(input: CapitalAllocationPlanInput) {
    return this.engine.allocateCapital(input);
  }

  async persistCapitalAllocations(
    workspaceId: string,
    input: CapitalAllocationPlanInput,
  ): Promise<CapitalAllocation[]> {
    return this.engine.allocateAndPersist(workspaceId, input);
  }

  async getCapitalAllocation(
    workspaceId: string,
    allocationId: string,
  ): Promise<CapitalAllocation | null> {
    return this.repository.getById(workspaceId, allocationId);
  }

  async getAllocationByOpportunity(
    workspaceId: string,
    opportunityId: string,
  ): Promise<CapitalAllocation | null> {
    return this.repository.getByOpportunity(workspaceId, opportunityId);
  }

  async listCapitalAllocations(
    workspaceId: string,
    filters: Omit<AllocationRepositoryQuery, "workspaceId"> = {},
  ): Promise<CapitalAllocation[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a capital allocation module with optional custom dependencies. */
export function createCapitalAllocationModule(
  repository: AllocationRepository = createInMemoryAllocationRepository(),
  engine?: CapitalAllocationEngine,
): CapitalAllocationModule {
  return new CapitalAllocationModule(
    repository,
    engine ?? new CapitalAllocationEngine(repository),
  );
}

export const capitalAllocationModule = createCapitalAllocationModule();

export type {
  CapitalAllocationPlanInput,
  CapitalAllocationEntryInput,
  AllocationPortfolioEntryInput,
  AllocationRevenueOpportunityInput,
} from "../scoring/capital-allocation-scoring.js";

export { defaultCapitalAllocationEngine };
