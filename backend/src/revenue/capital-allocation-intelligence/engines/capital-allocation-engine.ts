import type { CapitalAllocation } from "../models/capital-allocation.js";
import type { AllocationRepository } from "../repositories/allocation-repository.js";
import {
  rankCapitalAllocations,
  scoreCapitalAllocation,
  type CapitalAllocationEntryInput,
  type CapitalAllocationPlanInput,
} from "../scoring/capital-allocation-scoring.js";

/** Allocates capital across portfolio opportunities. */
export class CapitalAllocationEngine {
  constructor(private readonly repository: AllocationRepository) {}

  allocateCapital(input: CapitalAllocationPlanInput) {
    const breakdowns = scoreCapitalAllocation(input);
    return rankCapitalAllocations(breakdowns);
  }

  async allocateAndPersist(
    workspaceId: string,
    input: CapitalAllocationPlanInput,
  ): Promise<CapitalAllocation[]> {
    const breakdowns = this.allocateCapital(input);
    const saved: CapitalAllocation[] = [];

    for (const breakdown of breakdowns) {
      saved.push(
        await this.repository.save(workspaceId, {
          ...breakdown,
          totalCapital: input.totalCapital,
        }),
      );
    }

    return saved;
  }
}

export const defaultCapitalAllocationEngine = {
  allocateCapital: scoreCapitalAllocation,
  rankCapitalAllocations,
};

export type { CapitalAllocationPlanInput, CapitalAllocationEntryInput };
