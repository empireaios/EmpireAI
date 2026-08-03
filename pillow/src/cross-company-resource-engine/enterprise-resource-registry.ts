/** X2-11 — Enterprise Resource Registry. */

import { appendCcreLog } from "./ccre-logging.js";
import { CCRE_METADATA_VERSION } from "./paths.js";
import type {
  AllocationStatus,
  ResourceAllocationRecord,
  ResourceCategory,
} from "./types.js";

export class EnterpriseResourceRegistry {
  private resources = new Map<string, ResourceAllocationRecord>();

  list(): ResourceAllocationRecord[] {
    return [...this.resources.values()];
  }

  get(resourceIdentifier: string): ResourceAllocationRecord | null {
    return this.resources.get(resourceIdentifier) ?? null;
  }

  listByCompany(companyReference: string): ResourceAllocationRecord[] {
    return this.list().filter(
      (r) =>
        r.owningCompany === companyReference || r.assignedCompany === companyReference,
    );
  }

  register(input: {
    resourceIdentifier: string;
    resourceCategory: ResourceCategory;
    owningCompany: string;
    utilizationScore: number;
    protectedResource: boolean;
    authorizedAllocation: boolean;
  }): ResourceAllocationRecord {
    const existing = this.resources.get(input.resourceIdentifier);
    const record: ResourceAllocationRecord = {
      resourceAllocationId: existing?.resourceAllocationId ?? `ccre-alloc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      resourceIdentifier: input.resourceIdentifier.trim(),
      resourceCategory: input.resourceCategory,
      owningCompany: input.owningCompany.trim(),
      assignedCompany: existing?.assignedCompany ?? input.owningCompany.trim(),
      allocationStatus: existing?.allocationStatus ?? "available",
      utilizationScore: Math.max(0, Math.min(100, Math.round(input.utilizationScore))),
      validationStatus: "passed",
      metadataVersion: CCRE_METADATA_VERSION,
      protectedResource: input.protectedResource,
      authorizedAllocation: input.authorizedAllocation,
      structuralSignalOnly: true,
      sensitiveEnterpriseData: false,
    };
    this.resources.set(record.resourceIdentifier, record);
    appendCcreLog({
      event: "resource_registration",
      level: "info",
      details: `Registered ${record.resourceCategory} ${record.resourceIdentifier} owner=${record.owningCompany}`,
    });
    return { ...record };
  }

  updateAllocation(input: {
    resourceIdentifier: string;
    assignedCompany: string;
    allocationStatus: AllocationStatus;
    utilizationScore: number;
    authorizedAllocation: boolean;
  }): ResourceAllocationRecord | null {
    const existing = this.resources.get(input.resourceIdentifier);
    if (!existing) return null;
    const updated: ResourceAllocationRecord = {
      ...existing,
      timestamp: new Date().toISOString(),
      assignedCompany: input.assignedCompany.trim(),
      allocationStatus: input.allocationStatus,
      utilizationScore: Math.max(0, Math.min(100, Math.round(input.utilizationScore))),
      authorizedAllocation: input.authorizedAllocation,
      validationStatus: "passed",
    };
    this.resources.set(updated.resourceIdentifier, updated);
    appendCcreLog({
      event: "resource_allocation",
      level: "info",
      details: `Allocated ${updated.resourceIdentifier} → ${updated.assignedCompany} status=${updated.allocationStatus}`,
    });
    return { ...updated };
  }

  markStatus(
    resourceIdentifier: string,
    allocationStatus: AllocationStatus,
  ): ResourceAllocationRecord | null {
    const existing = this.resources.get(resourceIdentifier);
    if (!existing) return null;
    const updated = {
      ...existing,
      timestamp: new Date().toISOString(),
      allocationStatus,
    };
    this.resources.set(resourceIdentifier, updated);
    return { ...updated };
  }

  resetForTesting(): void {
    this.resources.clear();
  }
}
