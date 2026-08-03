import type { RegistryStore } from "./registry-store.js";
import type { LookupDimension, LookupInput, RegistryRecord } from "./types.js";

/** Capability lookups without hardcoded Pillow knowledge. */
export class CapabilityLookup {
  constructor(private readonly store: RegistryStore) {}

  lookup(input: LookupInput): RegistryRecord[] {
    const query = input.query.trim().toLowerCase();
    const workers = this.store.listWorkers();
    switch (input.dimension as LookupDimension) {
      case "worker":
        return workers.filter(
          (w) =>
            w.workerId.toLowerCase() === query ||
            w.workerName.toLowerCase().includes(query) ||
            w.registryId.toLowerCase() === query,
        );
      case "capability":
        return workers.filter((w) =>
          w.capabilityList.some((c) => c.toLowerCase() === query || c.toLowerCase().includes(query)),
        );
      case "department":
        return workers.filter((w) => w.department.toLowerCase() === query || w.department.toLowerCase().includes(query));
      case "tool":
        return workers.filter((w) =>
          w.approvedTools.some((t) => t.toLowerCase() === query || t.toLowerCase().includes(query)) ||
          w.operatingLimits.allowedTools.some((t) => t.toLowerCase() === query || t.toLowerCase().includes(query)),
        );
      case "skill":
        return workers.filter((w) =>
          w.skillList.some((s) => s.toLowerCase() === query || s.toLowerCase().includes(query)),
        );
      case "status":
        return workers.filter((w) => w.currentStatus.toLowerCase() === query);
      default:
        return [];
    }
  }
}
