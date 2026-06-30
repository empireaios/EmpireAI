import { randomUUID } from "node:crypto";

import type {
  CapitalAllocation,
  CapitalAllocationCreateInput,
} from "../models/capital-allocation.js";
import type {
  AllocationRepository,
  AllocationRepositoryQuery,
} from "./allocation-repository.js";

function recordKey(workspaceId: string, allocationId: string): string {
  return `${workspaceId}:allocation:${allocationId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory AllocationRepository for Mission 045 tests and local development. */
export class InMemoryAllocationRepository implements AllocationRepository {
  private readonly store = new Map<string, CapitalAllocation>();
  private readonly opportunityIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: CapitalAllocationCreateInput,
  ): Promise<CapitalAllocation> {
    const opportunityKey = `${workspaceId}:${input.opportunityId}`;
    const existingId = this.opportunityIndex.get(opportunityKey);
    const timestamp = nowIso();

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: CapitalAllocation = {
          ...existing,
          portfolioEntryId: input.portfolioEntryId,
          portfolioState: input.portfolioState,
          allocationPercentage: input.allocationPercentage,
          allocationAmount: input.allocationAmount,
          riskAdjustedAllocation: input.riskAdjustedAllocation,
          confidence: input.confidence,
          rationale: input.rationale,
          totalCapital: input.totalCapital,
          signals: input.signals.map((signal) => ({ ...signal })),
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const record: CapitalAllocation = {
      allocationId: randomUUID(),
      workspaceId,
      portfolioEntryId: input.portfolioEntryId,
      opportunityId: input.opportunityId,
      productId: input.productId,
      portfolioState: input.portfolioState,
      allocationPercentage: input.allocationPercentage,
      allocationAmount: input.allocationAmount,
      riskAdjustedAllocation: input.riskAdjustedAllocation,
      confidence: input.confidence,
      rationale: input.rationale,
      totalCapital: input.totalCapital,
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.allocationId), record);
    this.opportunityIndex.set(opportunityKey, record.allocationId);
    return structuredClone(record);
  }

  async getById(
    workspaceId: string,
    allocationId: string,
  ): Promise<CapitalAllocation | null> {
    const record = this.store.get(recordKey(workspaceId, allocationId));
    return record ? structuredClone(record) : null;
  }

  async getByOpportunity(
    workspaceId: string,
    opportunityId: string,
  ): Promise<CapitalAllocation | null> {
    const allocationId = this.opportunityIndex.get(`${workspaceId}:${opportunityId}`);
    if (!allocationId) {
      return null;
    }
    return this.getById(workspaceId, allocationId);
  }

  async list(query: AllocationRepositoryQuery): Promise<CapitalAllocation[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.opportunityId) {
      results = results.filter((record) => record.opportunityId === query.opportunityId);
    }
    if (query.productId) {
      results = results.filter((record) => record.productId === query.productId);
    }
    if (query.portfolioState) {
      results = results.filter((record) => record.portfolioState === query.portfolioState);
    }
    if (query.minAllocationAmount !== undefined) {
      results = results.filter(
        (record) => record.allocationAmount >= query.minAllocationAmount!,
      );
    }

    results.sort(
      (left, right) =>
        right.riskAdjustedAllocation - left.riskAdjustedAllocation ||
        right.allocationPercentage - left.allocationPercentage,
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, allocationId: string): Promise<boolean> {
    const key = recordKey(workspaceId, allocationId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.opportunityIndex.delete(`${workspaceId}:${existing.opportunityId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory allocation repository. */
export function createInMemoryAllocationRepository(): InMemoryAllocationRepository {
  return new InMemoryAllocationRepository();
}
