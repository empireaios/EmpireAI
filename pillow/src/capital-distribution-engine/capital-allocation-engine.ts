/** X2-05 — Capital allocation engine. */

import { appendCdeLog } from "./cde-logging.js";
import { CDE_METADATA_VERSION } from "./paths.js";
import type { CapitalDistributionEngineConfiguration } from "./configuration.js";
import type {
  AllocationPriority,
  CapitalAllocationRecord,
  CapitalPoolRecord,
} from "./types.js";

export class CapitalAllocationEngine {
  private pool: CapitalPoolRecord | null = null;
  private allocations = new Map<string, CapitalAllocationRecord>();

  getPool(): CapitalPoolRecord | null {
    return this.pool ? { ...this.pool } : null;
  }

  listAllocations(): CapitalAllocationRecord[] {
    return [...this.allocations.values()];
  }

  getByCompany(companyReference: string): CapitalAllocationRecord[] {
    return this.listAllocations().filter((a) => a.companyReference === companyReference);
  }

  ensurePool(defaultUnits: number): CapitalPoolRecord {
    if (!this.pool) {
      this.pool = {
        capitalPoolId: `cde-pool-${Date.now()}`,
        timestamp: new Date().toISOString(),
        poolReference: "enterprise-capital-pool",
        availableUnits: defaultUnits,
        reservedUnits: 0,
        allocatedUnits: 0,
        structuralSignalOnly: true,
        metadataVersion: CDE_METADATA_VERSION,
      };
    }
    return this.pool;
  }

  managePool(input: {
    poolReference?: string;
    availableUnits?: number;
    defaultUnits: number;
  }): CapitalPoolRecord {
    const pool = this.ensurePool(input.defaultUnits);
    if (input.poolReference) pool.poolReference = input.poolReference.trim();
    if (typeof input.availableUnits === "number") {
      pool.availableUnits = Math.max(0, Math.round(input.availableUnits));
    }
    pool.timestamp = new Date().toISOString();
    appendCdeLog({
      event: "capital_pool_update",
      level: "info",
      details: `Pool ${pool.poolReference} available=${pool.availableUnits}`,
    });
    return { ...pool };
  }

  proposeAllocation(input: {
    companyReference: string;
    investmentOpportunityReference: string;
    requestedCapital: number;
    expectedRoi: number;
    capitalEfficiency: number;
    allocationPriority: AllocationPriority;
    config: CapitalDistributionEngineConfiguration;
  }): CapitalAllocationRecord {
    const pool = this.ensurePool(input.config.defaultPoolUnits);
    const requested = Math.round(input.requestedCapital);
    const available = Math.max(0, pool.availableUnits - pool.reservedUnits);

    let approved = Math.min(requested, available);
    let autoApproved = false;
    let requiresManualApproval = false;

    if (approved > input.config.maxAutoApproveUnits) {
      approved = input.config.maxAutoApproveUnits;
      requiresManualApproval = true;
      autoApproved = false;
    } else if (approved > 0 && input.expectedRoi >= input.config.minExpectedRoi) {
      autoApproved = true;
      requiresManualApproval = false;
    } else {
      approved = 0;
      requiresManualApproval = true;
      autoApproved = false;
    }

    // Safety lock: never allocate beyond approval policy
    if (autoApproved && approved > input.config.maxAutoApproveUnits) {
      approved = input.config.maxAutoApproveUnits;
      requiresManualApproval = true;
      autoApproved = false;
    }

    if (autoApproved && approved > 0) {
      pool.reservedUnits += approved;
      pool.allocatedUnits += approved;
      pool.availableUnits = Math.max(0, pool.availableUnits - approved);
      pool.timestamp = new Date().toISOString();
    }

    const record: CapitalAllocationRecord = {
      capitalAllocationId: `cde-alloc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      companyReference: input.companyReference.trim(),
      investmentOpportunityReference: input.investmentOpportunityReference.trim(),
      requestedCapital: requested,
      approvedAllocation: approved,
      expectedRoi: input.expectedRoi,
      allocationPriority: input.allocationPriority,
      validationStatus: "passed",
      metadataVersion: CDE_METADATA_VERSION,
      capitalEfficiency: input.capitalEfficiency,
      autoApproved,
      requiresManualApproval,
      structuralSignalOnly: true,
      sensitiveFinancialData: false,
      ranking: null,
    };

    this.allocations.set(record.capitalAllocationId, record);
    appendCdeLog({
      event: "allocation_decision",
      level: "info",
      details: `Allocation ${record.capitalAllocationId} · approved=${approved} · auto=${autoApproved}`,
    });
    return record;
  }

  applyRankings(ranked: CapitalAllocationRecord[]): void {
    for (const record of ranked) {
      const current = this.allocations.get(record.capitalAllocationId);
      if (!current) continue;
      current.ranking = record.ranking;
      current.timestamp = new Date().toISOString();
      this.allocations.set(record.capitalAllocationId, current);
    }
  }

  resetForTesting(): void {
    this.pool = null;
    this.allocations.clear();
  }
}
