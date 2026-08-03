/** X2-11 — Resource Optimization Engine. */

import { appendCcreLog } from "./ccre-logging.js";
import type { CrossCompanyResourceEngineConfiguration } from "./configuration.js";
import type { EnterpriseResourceRegistry } from "./enterprise-resource-registry.js";
import type { ResourceAllocationRecord } from "./types.js";

export class ResourceOptimizationEngine {
  constructor(private readonly registry: EnterpriseResourceRegistry) {}

  detectIdle(
    records: ResourceAllocationRecord[],
    config: CrossCompanyResourceEngineConfiguration,
  ): ResourceAllocationRecord[] {
    const idle: ResourceAllocationRecord[] = [];
    for (const record of records) {
      if (record.utilizationScore <= config.idleUtilizationThreshold) {
        const updated = this.registry.markStatus(record.resourceIdentifier, "idle");
        if (updated) idle.push(updated);
      }
    }
    appendCcreLog({
      event: "idle_resource_detection",
      level: "info",
      details: `Idle resources detected: ${idle.length}`,
    });
    return idle;
  }

  optimize(
    records: ResourceAllocationRecord[],
    config: CrossCompanyResourceEngineConfiguration,
  ): ResourceAllocationRecord[] {
    if (!config.optimizationRulesEnabled) return [];
    const optimized: ResourceAllocationRecord[] = [];
    for (const record of records) {
      if (record.allocationStatus === "idle" && record.assignedCompany !== record.owningCompany) {
        const released = this.registry.updateAllocation({
          resourceIdentifier: record.resourceIdentifier,
          assignedCompany: record.owningCompany,
          allocationStatus: "available",
          utilizationScore: record.utilizationScore,
          authorizedAllocation: record.authorizedAllocation,
        });
        if (released) optimized.push(released);
      } else if (
        record.allocationStatus === "available" &&
        record.utilizationScore > config.idleUtilizationThreshold &&
        record.assignedCompany === record.owningCompany
      ) {
        // Keep available but note readiness for sharing via unchanged record
        optimized.push(record);
      }
    }
    appendCcreLog({
      event: "resource_optimization",
      level: "info",
      details: `Optimization pass touched ${optimized.length} resources`,
    });
    return optimized;
  }
}
