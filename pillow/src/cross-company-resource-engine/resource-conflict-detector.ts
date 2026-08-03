/** X2-11 — Resource Conflict Detector. */

import type { CrossCompanyResourceEngineConfiguration } from "./configuration.js";
import type { ResourceAllocationRecord, ResourceConflictSignal } from "./types.js";

export class ResourceConflictDetector {
  detect(
    records: ResourceAllocationRecord[],
    config: CrossCompanyResourceEngineConfiguration,
  ): ResourceConflictSignal[] {
    const signals: ResourceConflictSignal[] = [];
    const byIdentifier = new Map<string, ResourceAllocationRecord[]>();

    for (const record of records) {
      const list = byIdentifier.get(record.resourceIdentifier) ?? [];
      list.push(record);
      byIdentifier.set(record.resourceIdentifier, list);
    }

    for (const [resourceIdentifier, group] of byIdentifier) {
      const sharedAcross =
        group.length > 1 ||
        (group[0] &&
          group[0].assignedCompany !== group[0].owningCompany &&
          group[0].allocationStatus === "shared");

      if (
        sharedAcross &&
        group.some((r) => r.utilizationScore >= config.conflictUtilizationThreshold)
      ) {
        signals.push({
          conflictId: `ccre-conflict-${Date.now()}-${resourceIdentifier}`,
          timestamp: new Date().toISOString(),
          resourceIdentifier,
          conflictType: "capacity_overrun",
          companiesInvolved: [
            ...new Set(group.flatMap((r) => [r.owningCompany, r.assignedCompany])),
          ],
          severity: "high",
          rationale: `Utilization at or above conflict threshold (${config.conflictUtilizationThreshold})`,
          structuralSignalOnly: true,
        });
      }

      for (const record of group) {
        if (record.protectedResource && !record.authorizedAllocation) {
          signals.push({
            conflictId: `ccre-conflict-${Date.now()}-auth-${record.resourceAllocationId}`,
            timestamp: new Date().toISOString(),
            resourceIdentifier: record.resourceIdentifier,
            conflictType: "protected_without_auth",
            companiesInvolved: [record.owningCompany, record.assignedCompany],
            severity: "high",
            rationale: "Protected resource allocated or registered without authorization",
            structuralSignalOnly: true,
          });
        }
        if (record.allocationStatus === "conflict") {
          signals.push({
            conflictId: `ccre-conflict-${Date.now()}-status-${record.resourceAllocationId}`,
            timestamp: new Date().toISOString(),
            resourceIdentifier: record.resourceIdentifier,
            conflictType: "double_allocation",
            companiesInvolved: [record.owningCompany, record.assignedCompany],
            severity: "medium",
            rationale: "Resource marked in conflict allocation status",
            structuralSignalOnly: true,
          });
        }
      }
    }

    // Detect multi-assignee pattern: same id assigned to different companies via status conflict
    const assignedMap = new Map<string, Set<string>>();
    for (const record of records) {
      if (record.allocationStatus === "allocated" || record.allocationStatus === "shared") {
        const set = assignedMap.get(record.resourceIdentifier) ?? new Set();
        set.add(record.assignedCompany);
        assignedMap.set(record.resourceIdentifier, set);
      }
    }
    for (const [resourceIdentifier, companies] of assignedMap) {
      if (companies.size > config.maxAllocationsPerResource) {
        signals.push({
          conflictId: `ccre-conflict-${Date.now()}-multi-${resourceIdentifier}`,
          timestamp: new Date().toISOString(),
          resourceIdentifier,
          conflictType: "double_allocation",
          companiesInvolved: [...companies],
          severity: "high",
          rationale: `Assignments exceed maxAllocationsPerResource (${config.maxAllocationsPerResource})`,
          structuralSignalOnly: true,
        });
      }
    }

    return signals;
  }
}
