import type { PortfolioState } from "../../opportunity-portfolio/models/opportunity-portfolio.js";
import type {
  CapitalAllocation,
  CapitalAllocationCreateInput,
} from "../models/capital-allocation.js";

export type AllocationRepositoryQuery = {
  workspaceId: string;
  opportunityId?: string;
  productId?: string;
  portfolioState?: PortfolioState;
  minAllocationAmount?: number;
  limit?: number;
  offset?: number;
};

/** Persists capital allocation records. */
export interface AllocationRepository {
  save(
    workspaceId: string,
    input: CapitalAllocationCreateInput,
  ): Promise<CapitalAllocation>;
  getById(
    workspaceId: string,
    allocationId: string,
  ): Promise<CapitalAllocation | null>;
  getByOpportunity(
    workspaceId: string,
    opportunityId: string,
  ): Promise<CapitalAllocation | null>;
  list(query: AllocationRepositoryQuery): Promise<CapitalAllocation[]>;
  delete(workspaceId: string, allocationId: string): Promise<boolean>;
}
