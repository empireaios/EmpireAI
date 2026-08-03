/** X2-11 — Resource Allocation Engine. */

import type { CrossCompanyResourceEngineConfiguration } from "./configuration.js";
import type { EnterpriseResourceRegistry } from "./enterprise-resource-registry.js";
import type { AllocationStatus, ResourceAllocationRecord } from "./types.js";

export class ResourceAllocationEngine {
  constructor(private readonly registry: EnterpriseResourceRegistry) {}

  allocate(input: {
    resourceIdentifier: string;
    assignedCompany: string;
    utilizationScore?: number;
    authorizedAllocation?: boolean;
    config: CrossCompanyResourceEngineConfiguration;
  }): { record: ResourceAllocationRecord | null; errors: string[] } {
    const existing = this.registry.get(input.resourceIdentifier);
    if (!existing) {
      return { record: null, errors: ["Resource not registered"] };
    }

    if (
      existing.protectedResource &&
      input.config.neverAllocateProtectedResourcesWithoutAuthorization &&
      input.authorizedAllocation !== true &&
      !existing.authorizedAllocation
    ) {
      return {
        record: null,
        errors: ["Protected resource requires authorizedAllocation=true"],
      };
    }

    const assigned = input.assignedCompany.trim();
    const sameOwner = assigned === existing.owningCompany;
    const utilization =
      typeof input.utilizationScore === "number"
        ? input.utilizationScore
        : Math.max(existing.utilizationScore, 55);

    let allocationStatus: AllocationStatus = sameOwner ? "allocated" : "shared";
    if (utilization <= input.config.idleUtilizationThreshold) {
      allocationStatus = "idle";
    }

    const record = this.registry.updateAllocation({
      resourceIdentifier: input.resourceIdentifier,
      assignedCompany: assigned,
      allocationStatus,
      utilizationScore: utilization,
      authorizedAllocation:
        input.authorizedAllocation === true || existing.authorizedAllocation,
    });

    return { record, errors: record ? [] : ["Allocation update failed"] };
  }
}
